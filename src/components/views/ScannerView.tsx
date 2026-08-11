import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActiveTab, PantryItem } from '../../types';
import { ENDPOINTS } from '../../apiConfig';
import { mapDetectedToPantryItem } from '../../utils/scanHelper';
import { analyzeImageClientSide } from '../../utils/fallbackVision';
import { ScanLoadingOverlay } from '../ScanLoadingOverlay';

interface ScannerViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onScanComplete: (newItems: PantryItem[]) => void;
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

  // ── Auto-start camera and live scan on mount ──
  useEffect(() => {
    startCamera().then(() => {
      startLiveScan();
    });

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

  // ── Helper: Category Icon ──
  const getCategoryIcon = (category?: string) => {
    switch ((category || '').toLowerCase()) {
      case 'produce': return 'eco';
      case 'dairy': return 'water_drop';
      case 'protein': return 'egg';
      case 'pantry': return 'inventory_2';
      case 'beverage': return 'local_bar';
      case 'condiment': return 'soup_kitchen';
      default: return 'nutrition';
    }
  };

  // ── Helper: Dynamic Screen Box Positions ──
  const getBoxPosition = (index: number) => {
    const positions = [
      { top: '32%', left: '16%', width: '30%', height: '26%' },
      { top: '16%', right: '14%', width: '28%', height: '34%' },
      { bottom: '28%', left: '20%', width: '34%', height: '24%' },
      { bottom: '26%', right: '16%', width: '30%', height: '28%' },
      { top: '48%', left: '38%', width: '25%', height: '22%' },
      { top: '20%', left: '42%', width: '26%', height: '20%' },
    ];
    return positions[index % positions.length];
  };

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

  // ── Helper: Generate synthetic fridge image blob if external fetch fails ──
  const generateDemoFridgeBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fridge background
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(0, 0, 640, 640);
        // Shelves
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(30, 220, 580, 12);
        ctx.fillRect(30, 440, 580, 12);
        // Red Apples (Produce)
        ctx.fillStyle = '#e53935';
        ctx.beginPath(); ctx.arc(120, 160, 35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(180, 165, 30, 0, Math.PI * 2); ctx.fill();
        // Carrots (Produce)
        ctx.fillStyle = '#ff9800';
        ctx.beginPath(); ctx.moveTo(320, 120); ctx.lineTo(350, 190); ctx.lineTo(290, 190); ctx.closePath(); ctx.fill();
        // Milk Jug (Dairy)
        ctx.fillStyle = '#1e88e5';
        ctx.fillRect(440, 110, 70, 100);
        // Cheese Block (Dairy)
        ctx.fillStyle = '#fdd835';
        ctx.fillRect(100, 340, 90, 60);
        // Broccoli (Produce)
        ctx.fillStyle = '#43a047';
        ctx.beginPath(); ctx.arc(280, 360, 40, 0, Math.PI * 2); ctx.fill();
        // Eggs Carton (Protein)
        ctx.fillStyle = '#d7ccc8';
        ctx.fillRect(400, 360, 140, 50);
        // Orange Juice (Beverage)
        ctx.fillStyle = '#fb8c00';
        ctx.fillRect(140, 500, 60, 110);
        // Tomatoes (Produce)
        ctx.fillStyle = '#e53935';
        ctx.beginPath(); ctx.arc(320, 560, 35, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(380, 560, 30, 0, Math.PI * 2); ctx.fill();
      }
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/jpeg', 0.85);
    });
  };

  // ── Capture a single frame from webcam or demo image and upload to /scan-image ──
  const handleCapture = async () => {
    // If live items are already detected, accept them directly
    if (liveItems.length > 0) {
      onScanComplete(liveItems);
      setActiveTab('scanned-review');
      return;
    }

    setIsAnalyzing(true);
    let scannedSuccessfully = false;
    try {
      const formData = new FormData();

      if (useLiveCamera && videoRef.current && canvasRef.current) {
        // Webcam active — capture a frame from the video element
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85)
          );
          if (blob) {
            formData.append('file', blob, 'capture.jpg');
          }
        }
      }

      // If no file blob yet (camera off or capture failed), use demo image
      if (!formData.has('file')) {
        try {
          const imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwqyI9v0b09z_jZW-DMXdhkWlvrh84xsMpxS_5wRv2ZO41SrFPpwX5I3buOqPOjmLx-ius8pSHCGv8j0OQ2o_D7abQwtoBLqaHpKKGgS7Pp5s7drvJ-N0dvtSlzSdfaps6_0Zw5dcxlPWuNiRkoWikegGhUf_Zu0l_SWeIUX7oXJW8wZYMP7VjQZjBKkr_J00Vtkz6mRaT2xddHnBD4wu2nQJkzbYlgXxd-CHeXYQC87OtqbnbaWuBfg';
          const imgResponse = await fetch(imgUrl, { mode: 'cors' });
          if (!imgResponse.ok) throw new Error('Demo fetch failed');
          const imgBlob = await imgResponse.blob();
          formData.append('file', imgBlob, 'fridge-demo.jpg');
        } catch {
          // Fallback to generated canvas demo fridge blob
          const demoBlob = await generateDemoFridgeBlob();
          formData.append('file', demoBlob, 'fridge-demo.jpg');
        }
      }

      // Send to backend AI
      const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.items && data.items.length > 0) {
        const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
        onScanComplete(mapped);
        scannedSuccessfully = true;
      } else {
        alert(data.message || 'No food items detected in the image. Try taking another picture.');
      }
    } catch (e) {
      console.error('Scan error:', e);
      alert('Could not connect to backend server. Make sure the FastAPI server is running on port 8000.');
    } finally {
      setIsAnalyzing(false);
      if (scannedSuccessfully) {
        setActiveTab('scanned-review');
      }
    }
  };

  // ── Handle file upload — send file directly as FormData with fallback ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    let mappedItems: PantryItem[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.items && data.items.length > 0) {
          mappedItems = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
        }
      }
    } catch (err) {
      console.warn('Backend scan unreachable, using client-side AI fallback:', err);
    }

    if (mappedItems.length === 0) {
      try {
        mappedItems = await analyzeImageClientSide(file);
      } catch (fallbackErr) {
        console.error('Fallback vision error:', fallbackErr);
      }
    }

    setIsAnalyzing(false);
    if (mappedItems.length > 0) {
      onScanComplete(mappedItems);
      setActiveTab('scanned-review');
    } else {
      alert('Could not detect food items in uploaded photo. Try taking another picture.');
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
      {/* Full-Screen Loading Overlay when Analyzing Upload */}
      {isAnalyzing && <ScanLoadingOverlay onCancel={() => setIsAnalyzing(false)} />}

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
        {liveItems.length > 0 ? (
          liveItems.map((item, index) => {
            const pos = getBoxPosition(index);
            const icon = getCategoryIcon(item.category);
            return (
              <div
                key={item.id || index}
                className="absolute border-2 border-[#b72301] rounded-xl detect-box flex flex-col justify-between p-2 bg-[#b72301]/15 backdrop-blur-[1px] transition-all duration-500 shadow-[0_0_15px_rgba(183,35,1,0.3)]"
                style={{ ...pos, animationDelay: `${index * 0.2}s` }}
              >
                {/* Item Label Badge */}
                <div className="bg-[#b72301]/95 text-white rounded-lg px-2.5 py-1.5 self-start transform -translate-y-full mb-1 flex items-center gap-1.5 backdrop-blur-md text-xs font-bold shadow-lg border border-white/20">
                  <span className="material-symbols-outlined text-[15px]">{icon}</span>
                  <span>{item.name}</span>
                  {item.confidence && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] opacity-90">
                      {item.confidence}%
                    </span>
                  )}
                </div>

                {/* Freshness/Quantity Tag */}
                <div className="self-end bg-black/70 backdrop-blur-md text-white rounded-md px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 border border-white/10">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'fresh' ? 'bg-green-400' : item.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <span>{item.expiryText || 'Detected'}</span>
                </div>
              </div>
            );
          })
        ) : (
          /* Active Reticle / Scanning Spinner Box when no items detected yet */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-white/40 rounded-3xl flex flex-col justify-center items-center bg-black/10 backdrop-blur-[1px] relative animate-pulse">
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#b72301]" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#b72301]" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#b72301]" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#b72301]" />
              <div className="bg-black/70 text-white rounded-full px-3.5 py-1.5 flex items-center gap-2 backdrop-blur-md text-xs font-semibold border border-white/15">
                <span className="material-symbols-outlined text-[16px] animate-spin text-[#b72301]">
                  progress_activity
                </span>
                <span>{isAnalyzing ? 'Analyzing AI...' : wsRef.current ? 'AI Scanning Live...' : 'Ready to Scan'}</span>
              </div>
            </div>
          </div>
        )}
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
