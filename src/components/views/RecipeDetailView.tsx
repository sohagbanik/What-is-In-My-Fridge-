import React, { useState } from 'react';
import { ActiveTab, Recipe } from '../../types';

interface RecipeDetailViewProps {
  recipe: Recipe;
  setActiveTab: (tab: ActiveTab) => void;
  onStartCooking: () => void;
  onToggleBookmark: (recipeId: string) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  setActiveTab,
  onStartCooking,
  onToggleBookmark,
}) => {
  const [servings, setServings] = useState(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({
    i1: true,
    i2: true,
  });
  const [appliedSubstitutions, setAppliedSubstitutions] = useState<Record<string, boolean>>({});

  const scaleRatio = servings / (recipe.servings || 4);

  const toggleCheck = (id: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApplySwap = (subId: string) => {
    setAppliedSubstitutions(prev => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] pb-32">
      {/* Desktop Top Header Bar */}
      <header className="hidden md:flex justify-between items-center px-6 py-4 max-w-4xl mx-auto bg-[#faf9f5] sticky top-0 z-40 border-b border-[#e4beb6]/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('recipes')}
            className="hover:bg-[#e3e2df] p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#b72301]">arrow_back</span>
          </button>
          <h1 className="text-xl font-headline font-extrabold text-[#b72301]">
            Kitchen Assistant
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: recipe.title, url: window.location.href });
              }
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#e9e8e4] hover:bg-[#e3e2df] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#5b403a]">share</span>
          </button>
          <button
            onClick={() => onToggleBookmark(recipe.id)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#e9e8e4] hover:bg-[#e3e2df] transition-colors cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[#b72301] ${
                recipe.isSaved ? 'fill' : ''
              }`}
            >
              bookmark
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto md:mt-6 md:px-6">
        {/* Hero Image Block */}
        <div className="relative w-full h-[360px] md:h-[400px] md:rounded-[32px] overflow-hidden group shadow-md">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />

          {/* Mobile Floating Overlay Actions */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start md:hidden bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => setActiveTab('recipes')}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[#1b1c1a] cursor-pointer"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: recipe.title, url: window.location.href });
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[#1b1c1a] cursor-pointer"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
              <button
                onClick={() => onToggleBookmark(recipe.id)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform text-[#b72301] cursor-pointer"
              >
                <span className={`material-symbols-outlined ${recipe.isSaved ? 'fill' : ''}`}>
                  bookmark
                </span>
              </button>
            </div>
          </div>

          {/* Hero Bottom Title Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white">
            <h1 className="font-headline font-bold text-2xl md:text-3xl mb-1 drop-shadow-sm">
              {recipe.title}
            </h1>
            <p className="text-xs md:text-sm text-[#ffb4a4] font-medium tracking-wide">
              {recipe.author}
            </p>
          </div>
        </div>

        {/* Recipe Overview & Serving Size Controls */}
        <div className="px-6 md:px-0 mt-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#5b403a] uppercase tracking-wider">
                Prep
              </span>
              <span className="text-base font-bold text-[#1b1c1a]">
                {recipe.prepTime}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#5b403a] uppercase tracking-wider">
                Cook
              </span>
              <span className="text-base font-bold text-[#1b1c1a]">
                {recipe.cookTime}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#5b403a] uppercase tracking-wider">
                Level
              </span>
              <span className="text-base font-bold text-[#1b1c1a]">
                {recipe.level}
              </span>
            </div>
          </div>

          {/* Serving Size Controller */}
          <div className="flex items-center bg-[#efeeea] px-3 py-1.5 rounded-full border border-[#e3e2df]">
            <button
              onClick={() => setServings(s => Math.max(1, s - 1))}
              className="w-8 h-8 flex items-center justify-center text-[#1b1c1a] hover:text-[#b72301] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-[10px] font-semibold text-[#5b403a] uppercase leading-none">
                Servings
              </span>
              <span className="text-base font-bold text-[#1b1c1a] leading-none mt-0.5">
                {servings}
              </span>
            </div>
            <button
              onClick={() => setServings(s => s + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#1b1c1a] hover:text-[#b72301] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        <hr className="border-[#e3e2df] my-6 mx-6 md:mx-0" />

        {/* Ingredients Checklist */}
        <section className="px-6 md:px-0">
          <h2 className="text-2xl font-headline font-bold text-[#1b1c1a] mb-4">
            Ingredients
          </h2>

          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e3e2df]/50 mb-8">
            <h3 className="text-xs font-bold text-[#5b403a] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2c694e] text-base fill">
                check_circle
              </span>
              <span>You Have</span>
            </h3>

            <ul className="space-y-3">
              {recipe.ingredients.map(ing => {
                const isChecked = checkedIngredients[ing.id];
                const scaledAmount = (ing.amount * scaleRatio).toFixed(
                  ing.amount * scaleRatio % 1 === 0 ? 0 : 1
                );

                return (
                  <li
                    key={ing.id}
                    onClick={() => toggleCheck(ing.id)}
                    className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-[#efeeea] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#2c694e] border-[#2c694e]'
                            : 'border-[#8f7069]'
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-white text-[16px]">
                            check
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-sm md:text-base font-medium text-[#1b1c1a] ${
                          isChecked ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {scaledAmount} {ing.unit} {ing.name}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Smart Substitutions AI Section */}
            {recipe.smartSubstitutions.length > 0 && (
              <>
                <hr className="border-[#e3e2df] my-6" />
                <h3 className="text-xs font-bold text-[#835400] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#835400] text-base">
                    swap_horiz
                  </span>
                  <span>Smart Substitutions (AI)</span>
                </h3>

                <ul className="space-y-4">
                  {recipe.smartSubstitutions.map(sub => {
                    const isApplied = appliedSubstitutions[sub.id];
                    return (
                      <li
                        key={sub.id}
                        className="flex items-start gap-3 bg-[#ffddb5]/30 p-3.5 rounded-2xl border border-[#ffddb5]"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-full bg-[#c78200] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-[16px]">
                            swap_horiz
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1b1c1a] mb-0.5">
                            Use{' '}
                            <span className="text-[#835400] font-bold">
                              {sub.substituteIngredient}
                            </span>{' '}
                            instead of {sub.originalIngredient}
                          </p>
                          <p className="text-xs text-[#5b403a] leading-relaxed">
                            {sub.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => handleApplySwap(sub.id)}
                          className={`p-2 rounded-full transition-colors cursor-pointer ${
                            isApplied
                              ? 'bg-[#2c694e] text-white'
                              : 'text-[#b72301] hover:bg-[#b72301]/10'
                          }`}
                          title={isApplied ? 'Swap Applied' : 'Apply Swap'}
                        >
                          <span className="material-symbols-outlined">
                            {isApplied ? 'check_circle' : 'add_circle'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Bar for Interactive Cooking Mode */}
      <div className="fixed bottom-0 left-0 w-full px-6 pb-20 md:pb-8 flex justify-center z-50 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto w-full max-w-md">
          <button
            onClick={onStartCooking}
            className="flex-1 bg-[#b72301] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(183,35,1,0.3)] hover:bg-[#b72301]/95 transition-all hover:-translate-y-0.5 active:translate-y-0 font-bold text-base md:text-lg font-headline cursor-pointer"
          >
            <span className="material-symbols-outlined fill">local_fire_department</span>
            <span>Start Cooking</span>
          </button>

          <button
            onClick={onStartCooking}
            className="w-14 h-14 bg-[#e3e2df] text-[#1b1c1a] rounded-2xl flex items-center justify-center shadow-lg hover:bg-[#e9e8e4] transition-colors group relative cursor-pointer shrink-0"
            title="Voice Guided Mode"
          >
            <span className="material-symbols-outlined group-hover:text-[#b72301] transition-colors">
              mic
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
