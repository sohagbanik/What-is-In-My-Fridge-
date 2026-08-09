import React, { useState, useRef } from 'react';
import { ActiveTab, PantryItem } from '../../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Toggle live camera mode using browser webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseLiveCamera(true);
      }
    } catch (err) {
      console.warn('Webcam permission or device camera unavailable, using simulated scanner', err);
      setUseLiveCamera(false);
    }
  };

  const handleCapture = async () => {
    setIsAnalyzing(true);
    try {
      // Call server API for real or simulated vision parsing
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: null }),
      });
      const data = await response.json();
      if (data.success && data.items) {
        onScanComplete(data.items);
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsAnalyzing(false);
      setActiveTab('scanned-review');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = event.target?.result as string;
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await response.json();
        if (data.success && data.items) {
          onScanComplete(data.items);
        }
      } catch (err) {
        console.error('Upload scan error:', err);
      } finally {
        setIsAnalyzing(false);
        setActiveTab('scanned-review');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Background Camera Viewport */}
      {useLiveCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
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

      {/* Top Bar: Back & Status */}
      <div className="relative z-20 flex justify-between items-center p-4 md:p-6 pt-6">
        <button
          onClick={() => setActiveTab('home')}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/15">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2c694e] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {isAnalyzing ? 'Analyzing AI...' : 'AI Active'}
          </span>
        </div>

        <button
          onClick={() => {
            if (useLiveCamera) {
              setUseLiveCamera(false);
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

          {/* Review Button */}
          <button
            onClick={() => setActiveTab('scanned-review')}
            className="h-14 px-5 bg-[#faf9f5] rounded-[16px] flex items-center gap-2 shadow-lg hover:bg-[#f4f4f0] transition-all active:scale-95 border border-[#e4beb6]/30 text-[#1b1c1a] cursor-pointer"
          >
            <span className="text-sm font-bold">Review (12)</span>
            <span className="material-symbols-outlined text-[#b72301]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
