import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActiveTab, PantryItem } from '../../types';
import { ENDPOINTS } from '../../apiConfig';

interface ScannerViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onScanComplete: (newItems: PantryItem[]) => void;
}

// ── Helper: Map backend DetectedItem → frontend PantryItem ──
// The FastAPI backend returns items with { name, quantity, category, confidence, freshness }
// The frontend expects PantryItem with { id, daysLeft, freshnessPercent, status, ... }
function mapDetectedToPantryItem(item: any, index: number): PantryItem {
  // Map freshness string → numeric values
  const freshnessMap: Record<string, { daysLeft: number; freshnessPercent: number; status: PantryItem['status'] }> = {
    'fresh':         { daysLeft: 7,  freshnessPercent: 85, status: 'fresh' },
    'okay':          { daysLeft: 4,  freshnessPercent: 55, status: 'fresh' },
    'expiring soon': { daysLeft: 2,  freshnessPercent: 20, status: 'warning' },
    'expired':       { daysLeft: 0,  freshnessPercent: 5,  status: 'critical' },
  };

  const freshness = freshnessMap[(item.freshness || 'okay').toLowerCase()] || freshnessMap['okay'];

  // Map category string
  const categoryMap: Record<string, PantryItem['category']> = {
    'produce': 'Produce',
    'dairy': 'Dairy',
    'protein': 'Protein',
    'pantry': 'Pantry',
    'beverage': 'Other',
    'condiment': 'Pantry',
  };

  const category = categoryMap[(item.category || 'other').toLowerCase()] || 'Other';

  // Map confidence string → percentage
  const confidenceMap: Record<string, number> = { 'high': 95, 'medium': 80, 'low': 60 };
  const confidence = confidenceMap[(item.confidence || 'medium').toLowerCase()] || 80;

  // Build the expiry text from daysLeft
  const expiryText = freshness.daysLeft === 0
    ? 'Expired'
    : freshness.daysLeft <= 2
      ? `Use within ${freshness.daysLeft} day${freshness.daysLeft > 1 ? 's' : ''}`
      : `Fresh (${freshness.daysLeft}+ days)`;

  return {
    id: `scan-${Date.now()}-${index}`,
    name: item.name || 'Unknown Item',
    category,
    quantity: parseInt(item.quantity) || 1,
    unit: item.quantity?.replace(/[0-9]/g, '').trim() || undefined,
    location: 'Scanned',
    daysLeft: freshness.daysLeft,
    expiryText,
    freshnessPercent: freshness.freshnessPercent,
    status: freshness.status,
    confidence,
    isScanned: true,
  };
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  setActiveTab,
  onScanComplete,
}) => {
  const [pantryMode, setPantryMode] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [liveItems, setLiveItems] = useState<PantryItem[]>([]);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Attach stream to video element when mounted or when stream updates ──
  useEffect(() => {
    if (useLiveCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [useLiveCamera]);

  // ── Auto-start camera on mount ──
  useEffect(() => {
    startCamera();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ── Start webcam ──
  const startCamera = async () => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      setUseLiveCamera(true);
    } catch (err) {
      console.warn('Webcam permission denied or camera unavailable, using simulated scanner background', err);
      setUseLiveCamera(false);
    }
  };

  // ── Stop webcam + live scan ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setUseLiveCamera(false);
    setLiveStatus('');
  }, []);

  // ── Start live WebSocket scanning ──
  // Captures a video frame every 250ms and sends it to the backend.
  // The backend throttles to 1 frame / 2.5s internally.
  const startLiveScan = useCallback(() => {
    if (wsRef.current) return; // Already connected

    const ws = new WebSocket(ENDPOINTS.LIVE_SCAN_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setLiveStatus('Live scan connected');
      console.log('[WS] Connected to live scan');

      // Send video frames as binary at ~4 FPS (the server throttles internally)
      liveIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current || ws.readyState !== WebSocket.OPEN) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob && ws.readyState === WebSocket.OPEN) {
              blob.arrayBuffer().then(buffer => ws.send(buffer));
            }
          },
          'image/jpeg',
          0.7 // JPEG quality 70% to reduce bandwidth
        );
      }, 250); // 4 FPS — server throttles to 1 per 2.5s
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'scan_result' && data.items) {
          const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
          setLiveItems(mapped);
          setLiveStatus(`Detected ${mapped.length} items (frame #${data.frame_number})`);
        } else if (data.type === 'error') {
          setLiveStatus(`Error: ${data.message}`);
        }
      } catch (e) {
        console.warn('[WS] Failed to parse message', e);
      }
    };

    ws.onclose = () => {
      setLiveStatus('Live scan disconnected');
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      setLiveStatus('Connection error — is the backend running?');
    };
  }, []);

  // ── Capture a single frame from webcam and upload to /scan-image ──
  const handleCapture = async () => {
    setIsAnalyzing(true);
    try {
      let blob: Blob | null = null;

      // If webcam is active, capture a frame from the video element
      if (useLiveCamera && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85)
          );
        }
      }

      if (blob) {
        // Send the captured frame as a file upload
        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');

        const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success && data.items) {
          const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
          onScanComplete(mapped);
        }
      } else {
        // No webcam — send a dummy request (backend handles no-image gracefully)
        const formData = new FormData();
        // Create a tiny 1x1 transparent PNG as a placeholder
        const emptyBlob = new Blob([new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00,
          0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
          0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F,
          0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
          0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
          0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
          0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])], { type: 'image/png' });
        formData.append('file', emptyBlob, 'placeholder.png');

        const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success && data.items) {
          const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
          onScanComplete(mapped);
        }
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsAnalyzing(false);
      setActiveTab('scanned-review');
    }
  };

  // ── Handle file upload — send file directly as FormData ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.items) {
        const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
        onScanComplete(mapped);
      }
    } catch (err) {
      console.error('Upload scan error:', err);
    } finally {
      setIsAnalyzing(false);
      setActiveTab('scanned-review');
    }
  };

  // ── Accept live-scanned items into the pantry ──
  const acceptLiveItems = () => {
    if (liveItems.length > 0) {
      onScanComplete(liveItems);
      setActiveTab('scanned-review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Background Camera Viewport */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 ${useLiveCamera ? 'block' : 'hidden'}`}
      />
      {!useLiveCamera && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0 transition-transform duration-700"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBwqyI9v0b09z_jZW-DMXdhkWlvrh84xsMpxS_5wRv2ZO41SrFPpwX5I3buOqPOjmLx-ius8pSHCGv8j0OQ2o_D7abQwtoBLqaHpKKGgS7Pp5s7drvJ-N0dvtSlzSdfaps6_0Zw5dcxlPWuNiRkoWikegGhUf_Zu0l_SWeIUX7oXJW8wZYMP7VjQZjBKkr_J00Vtkz6mRaT2xddHnBD4wu2nQJkzbYlgXxd-CHeXYQC87OtqbnbaWuBfg')`,
          }}
        />
      )}

      {/* Dark Gradient Overlay for readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Active Scanning Laser Line */}
      <div className="absolute left-0 right-0 h-0.5 bg-[#b72301] z-10 animate-scan shadow-[0_0_12px_3px_rgba(183,35,1,0.6)]" />

      {/* Detected Items Bounding Boxes */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Tomato Box */}
        <div className="absolute top-[35%] left-[20%] w-[30%] h-[25%] border-2 border-[#b72301] rounded-lg detect-box flex flex-col justify-end p-2 bg-[#b72301]/10">
          <div className="bg-[#b72301]/90 text-white rounded-md px-2 py-1 self-start transform -translate-y-full mb-2 flex items-center gap-1 backdrop-blur-sm text-xs font-semibold shadow-sm">
            <span className="material-symbols-outlined text-[14px]">local_pizza</span>
            <span>Tomatoes</span>
            <span className="opacity-80 ml-1">95%</span>
          </div>
        </div>

        {/* Milk Box */}
        <div
          className="absolute top-[15%] right-[10%] w-[25%] h-[40%] border-2 border-[#b72301] rounded-lg detect-box flex flex-col justify-end p-2 bg-[#b72301]/10"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="bg-[#b72301]/90 text-white rounded-md px-2 py-1 self-start transform -translate-y-full mb-2 flex items-center gap-1 backdrop-blur-sm text-xs font-semibold shadow-sm">
            <span className="material-symbols-outlined text-[14px]">water_drop</span>
            <span>Milk</span>
            <span className="opacity-80 ml-1">90%</span>
          </div>
        </div>

        {/* Scanning Spinner Box */}
        <div className="absolute bottom-[40%] left-[60%] w-[20%] h-[20%] border-2 border-dashed border-white/50 rounded-lg flex flex-col justify-center items-center bg-white/5">
          <div className="bg-black/60 text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-md text-xs">
            <span className="material-symbols-outlined text-[14px] animate-spin">
              progress_activity
            </span>
            <span>Scanning</span>
          </div>
        </div>
      </div>

      {/* Live Scan Status Bar */}
      {useLiveCamera && liveStatus && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 text-xs text-white border border-white/10">
          {liveStatus}
          {liveItems.length > 0 && (
            <span className="ml-2 text-[#2c694e] font-bold">
              ({liveItems.length} items found)
            </span>
          )}
        </div>
      )}

      {/* Top Bar: Back & Status */}
      <div className="relative z-20 flex justify-between items-center p-4 md:p-6 pt-6">
        <button
          onClick={() => {
            stopCamera();
            setActiveTab('home');
          }}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/15">
          <div className={`w-2.5 h-2.5 rounded-full ${wsRef.current ? 'bg-[#2c694e]' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {isAnalyzing ? 'Analyzing AI...' : wsRef.current ? 'Live Scan Active' : 'AI Active'}
          </span>
        </div>

        <button
          onClick={() => {
            if (useLiveCamera) {
              stopCamera();
            } else {
              startCamera();
            }
          }}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10 cursor-pointer"
          title={useLiveCamera ? 'Switch to Simulation' : 'Use Webcam Camera'}
        >
          <span className="material-symbols-outlined">
            {useLiveCamera ? 'videocam' : 'flip_camera_ios'}
          </span>
        </button>
      </div>

      {/* Bottom Sheet Controls Area */}
      <div className="relative z-20 p-4 md:p-6 pb-8 flex flex-col max-w-lg mx-auto w-full">
        {/* Settings Panel Card */}
        <div className="mb-4 bg-[#faf9f5]/90 dark:bg-[#2f312e]/95 backdrop-blur-xl rounded-[24px] p-4 border border-white/20 shadow-xl flex flex-col gap-3">
          {/* Pantry Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#b72301] fill">
                kitchen
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1b1c1a] dark:text-[#f2f1ed]">
                  Pantry Mode
                </h3>
                <p className="text-xs text-[#5b403a] dark:text-[#e3e2df] opacity-80">
                  Scanning Fridge Items
                </p>
              </div>
            </div>
            <button
              onClick={() => setPantryMode(!pantryMode)}
              className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none ${
                pantryMode ? 'bg-[#b72301]' : 'bg-gray-400'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  pantryMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-[#8f7069]/20" />

          {/* Strict Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5b403a] dark:text-[#e3e2df]">
                rule
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1b1c1a] dark:text-[#f2f1ed]">
                  Strict Mode
                </h3>
                <p className="text-xs text-[#5b403a] dark:text-[#e3e2df] opacity-80">
                  Only add scanned items
                </p>
              </div>
            </div>
            <button
              onClick={() => setStrictMode(!strictMode)}
              className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none ${
                strictMode ? 'bg-[#b72301]' : 'bg-[#dbdad6]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  strictMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="h-px w-full bg-[#8f7069]/20" />

          {/* Live Scan Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2c694e]">
                stream
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1b1c1a] dark:text-[#f2f1ed]">
                  Live Scan
                </h3>
                <p className="text-xs text-[#5b403a] dark:text-[#e3e2df] opacity-80">
                  Real-time AI detection via WebSocket
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (wsRef.current) {
                  // Stop live scanning
                  wsRef.current.close();
                  wsRef.current = null;
                  if (liveIntervalRef.current) {
                    clearInterval(liveIntervalRef.current);
                    liveIntervalRef.current = null;
                  }
                  setLiveStatus('');
                } else if (useLiveCamera) {
                  startLiveScan();
                } else {
                  // Start camera first, then live scan
                  startCamera().then(() => {
                    setTimeout(startLiveScan, 500);
                  });
                }
              }}
              className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none ${
                wsRef.current ? 'bg-[#2c694e]' : 'bg-[#dbdad6]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  wsRef.current ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-4">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Upload Photo"
          >
            <span className="material-symbols-outlined text-2xl">file_upload</span>
          </button>

          {/* Shutter Capture Button */}
          <button
            onClick={handleCapture}
            disabled={isAnalyzing}
            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/50 hover:bg-white/30 transition-all active:scale-95 cursor-pointer relative"
          >
            <div className="w-14 h-14 bg-white rounded-full transition-transform active:scale-90" />
          </button>

          {/* Review / Accept Live Items Button */}
          <button
            onClick={liveItems.length > 0 ? acceptLiveItems : () => setActiveTab('scanned-review')}
            className="h-14 px-5 bg-[#faf9f5] rounded-[16px] flex items-center gap-2 shadow-lg hover:bg-[#f4f4f0] transition-all active:scale-95 border border-[#e4beb6]/30 text-[#1b1c1a] cursor-pointer"
          >
            <span className="text-sm font-bold">
              {liveItems.length > 0 ? `Accept (${liveItems.length})` : 'Review'}
            </span>
            <span className="material-symbols-outlined text-[#b72301]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
