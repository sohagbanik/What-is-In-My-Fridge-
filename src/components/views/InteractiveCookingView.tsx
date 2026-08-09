import React, { useState, useEffect } from 'react';
import { Recipe } from '../../types';

interface InteractiveCookingViewProps {
  recipe: Recipe;
  onClose: () => void;
}

export const InteractiveCookingView: React.FC<InteractiveCookingViewProps> = ({
  recipe,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentStep = recipe.steps[currentStepIndex] || recipe.steps[0];
  const isLastStep = currentStepIndex === recipe.steps.length - 1;

  // Speech synthesis voice readout
  const speakInstruction = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(currentStep.instruction);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Timer effect
  useEffect(() => {
    if (currentStep.durationMinutes) {
      setTimerSeconds(currentStep.durationMinutes * 60);
      setIsTimerRunning(false);
    } else {
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  }, [currentStepIndex, currentStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => (s !== null && s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#faf9f5] text-[#1b1c1a] flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#e4beb6]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ff5733]/15 text-[#b72301] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined fill text-xl">
              local_fire_department
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-[#b72301] uppercase tracking-wider">
              Cooking Mode
            </span>
            <h2 className="text-lg font-headline font-bold text-[#1b1c1a] truncate max-w-xs md:max-w-md">
              {recipe.title}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#efeeea] hover:bg-[#e3e2df] flex items-center justify-center text-[#5b403a] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#e3e2df] h-2 rounded-full my-4 overflow-hidden">
        <div
          className="bg-[#b72301] h-full transition-all duration-300"
          style={{
            width: `${((currentStepIndex + 1) / recipe.steps.length) * 100}%`,
          }}
        />
      </div>

      {/* Main Step Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full my-auto flex flex-col justify-center py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ffdad3] text-[#8c1800]">
            Step {currentStepIndex + 1} of {recipe.steps.length}
          </span>

          <button
            onClick={speakInstruction}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-[#b72301] text-white animate-pulse'
                : 'bg-[#efeeea] text-[#1b1c1a] hover:bg-[#e3e2df]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSpeaking ? 'volume_up' : 'record_voice_over'}
            </span>
            <span>{isSpeaking ? 'Reading...' : 'Voice Readout'}</span>
          </button>
        </div>

        {/* Big Instruction Text */}
        <p className="text-xl md:text-2xl font-semibold leading-relaxed text-[#1b1c1a] mb-6">
          {currentStep.instruction}
        </p>

        {/* Timer Card if applicable */}
        {timerSeconds !== null && (
          <div className="p-4 rounded-2xl bg-white border border-[#e4beb6]/40 shadow-sm flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#b72301] text-2xl">
                timer
              </span>
              <div>
                <span className="text-xs font-semibold text-[#5b403a]">
                  Step Timer
                </span>
                <p className="text-2xl font-mono font-bold text-[#1b1c1a]">
                  {formatTimer(timerSeconds)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-4 py-2 bg-[#b72301] text-white font-bold rounded-xl text-xs hover:bg-[#b72301]/90 transition-all cursor-pointer"
              >
                {isTimerRunning ? 'Pause' : 'Start Timer'}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  if (currentStep.durationMinutes) {
                    setTimerSeconds(currentStep.durationMinutes * 60);
                  }
                }}
                className="p-2 bg-[#efeeea] text-[#5b403a] rounded-xl hover:bg-[#e3e2df] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
              </button>
            </div>
          </div>
        )}

        {/* Tip Box */}
        {currentStep.tip && (
          <div className="p-4 rounded-2xl bg-[#ffddb5]/30 border border-[#ffddb5] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#835400] text-xl mt-0.5">
              lightbulb
            </span>
            <div>
              <span className="text-xs font-bold text-[#835400] uppercase tracking-wider">
                Chef Tip
              </span>
              <p className="text-xs text-[#1b1c1a] mt-0.5 leading-relaxed">
                {currentStep.tip}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto w-full pt-4 border-t border-[#e4beb6]/30">
        <button
          onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
          disabled={currentStepIndex === 0}
          className="px-5 py-3 rounded-xl bg-[#efeeea] text-[#1b1c1a] font-bold text-sm hover:bg-[#e3e2df] disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Previous</span>
        </button>

        {isLastStep ? (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-[#2c694e] text-white font-bold text-sm hover:bg-[#2c694e]/90 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined fill">check_circle</span>
            <span>Finish Cooking!</span>
          </button>
        ) : (
          <button
            onClick={() =>
              setCurrentStepIndex(i => Math.min(recipe.steps.length - 1, i + 1))
            }
            className="px-6 py-3 rounded-xl bg-[#b72301] text-white font-bold text-sm hover:bg-[#b72301]/90 transition-all flex items-center gap-1 cursor-pointer shadow-md"
          >
            <span>Next Step</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
