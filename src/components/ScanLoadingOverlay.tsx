import React, { useState, useEffect } from 'react';

interface ScanLoadingOverlayProps {
  imagePreviewUrl?: string | null;
  onCancel?: () => void;
}

export const ScanLoadingOverlay: React.FC<ScanLoadingOverlayProps> = ({
  imagePreviewUrl,
  onCancel,
}) => {
  const [step, setStep] = useState(0);

  const steps = [
    'Uploading image to AI vision model...',
    'Pre-processing image contrast & focus...',
    'Detecting fruits, vegetables, and beverages...',
    'Estimating freshness & expiration dates...',
    'Finalizing scanned inventory items...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg text-white flex flex-col items-center justify-center p-6 transition-all duration-300">
      {/* Container Card */}
      <div className="w-full max-w-md bg-[#1e201d] rounded-3xl p-6 border border-white/15 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Active Laser Scanning Preview Frame */}
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden mb-6 border-2 border-[#b72301] shadow-[0_0_20px_rgba(183,35,1,0.4)] bg-black/50 flex items-center justify-center">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Scanning preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/50">
              <span className="material-symbols-outlined text-5xl">kitchen</span>
            </div>
          )}

          {/* Animated Laser Line */}
          <div className="absolute left-0 right-0 h-1 bg-[#b72301] shadow-[0_0_15px_4px_#b72301] animate-scan z-10" />

          {/* Reticle Corner Brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#b72301] z-10" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#b72301] z-10" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#b72301] z-10" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#b72301] z-10" />
        </div>

        {/* AI Processing Icon & Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[#b72301] animate-spin text-2xl">
            sync
          </span>
          <h3 className="text-xl font-headline font-bold text-white tracking-wide">
            Analyzing Fridge Photo
          </h3>
        </div>

        {/* Dynamic Animated Status Text */}
        <p className="text-sm text-gray-300 font-medium h-6 mb-6 animate-pulse">
          {steps[step]}
        </p>

        {/* Step Progress Dots */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-[#b72301]'
                  : i < step
                  ? 'w-2 bg-white/60'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Optional Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white underline transition-colors cursor-pointer"
          >
            Cancel scan
          </button>
        )}
      </div>
    </div>
  );
};
