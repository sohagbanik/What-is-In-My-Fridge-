import React, { useState } from 'react';
import { ActiveTab, Recipe } from '../../types';

interface RecipesFeedViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const RecipesFeedView: React.FC<RecipesFeedViewProps> = ({
  recipes,
  onSelectRecipe,
  onToggleBookmark,
  setActiveTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | '100% Match' | 'Expiring' | 'Quick' | 'Vegetarian'>('All');

  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === '100% Match') return recipe.matchPercentage === 100;
    if (activeFilter === 'Expiring') return (recipe.usesExpiringItemsCount || 0) > 0;
    if (activeFilter === 'Quick') return recipe.cookMinutes <= 15;
    if (activeFilter === 'Vegetarian') return recipe.tags.includes('Vegetarian');
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      {/* Page Header & Context */}
      <section className="flex flex-col gap-1 pt-2 md:pt-4">
        <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-[#1b1c1a] tracking-tight">
          What Can I Cook?
        </h2>
        <p className="text-sm md:text-base text-[#5b403a]">
          We found {filteredRecipes.length} recipes based on your pantry.
        </p>
      </section>

      {/* Scrollable Filter Chips */}
      <section className="relative w-full overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
          {/* Filters trigger */}
          <button
            onClick={() => setActiveFilter('All')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'All'
                ? 'bg-[#1b1c1a] text-white border-[#1b1c1a]'
                : 'bg-[#e9e8e4] text-[#1b1c1a] border-[#e4beb6]/40 hover:bg-[#e3e2df]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Filters</span>
          </button>

          {/* 100% Match Filter */}
          <button
            onClick={() => setActiveFilter('100% Match')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === '100% Match'
                ? 'bg-[#2c694e] text-white border-[#2c694e]'
                : 'bg-[#aeeecb] text-[#316e52] border-[#b1f0ce] hover:opacity-90'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>100% Match</span>
          </button>

          {/* High Expiry Usage Filter */}
          <button
            onClick={() => setActiveFilter('Expiring')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'Expiring'
                ? 'bg-[#835400] text-white border-[#835400]'
                : 'bg-[#c78200]/20 text-[#3d2500] border-[#ffddb5] hover:opacity-90'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>High Expiry Usage</span>
          </button>

          {/* Quick Cook Time */}
          <button
            onClick={() => setActiveFilter('Quick')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'Quick'
                ? 'bg-[#b72301] text-white border-[#b72301]'
                : 'bg-white text-[#1b1c1a] border-[#e4beb6]/40 hover:bg-[#e9e8e4]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span>Cook Time &lt; 20 min</span>
          </button>

          {/* Vegetarian */}
          <button
            onClick={() => setActiveFilter('Vegetarian')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'Vegetarian'
                ? 'bg-[#2c694e] text-white border-[#2c694e]'
                : 'bg-white text-[#1b1c1a] border-[#e4beb6]/40 hover:bg-[#e9e8e4]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">eco</span>
            <span>Vegetarian</span>
          </button>
        </div>
      </section>

      {/* Recipe Feed - Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {filteredRecipes.map((recipe, index) => {
          const isFeatured = index === 0;
          return (
            <article
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className={`bg-white rounded-[24px] shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] overflow-hidden flex flex-col relative group cursor-pointer hover:shadow-lg transition-all duration-300 border border-[#e3e2df] ${
                isFeatured ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Recipe Card Image Header */}
              <div className="relative h-60 md:h-64 w-full overflow-hidden">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Overlays */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                  {recipe.matchPercentage === 100 && (
                    <div className="bg-[#2c694e] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <span className="material-symbols-outlined text-[16px] fill">
                        check_circle
                      </span>
                      <span>100% Match</span>
                    </div>
                  )}

                  {(recipe.usesExpiringItemsCount || 0) > 0 && (
                    <div className="bg-[#835400] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <span className="material-symbols-outlined text-[16px] fill">
                        warning
                      </span>
                      <span>Uses {recipe.usesExpiringItemsCount} items expiring soon!</span>
                    </div>
                  )}
                </div>

                {/* Bookmark Action Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleBookmark(recipe.id);
                    }}
                    className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#5b403a] hover:text-[#b72301] hover:bg-white transition-all shadow-sm cursor-pointer"
                    title={recipe.isSaved ? 'Unsave Recipe' : 'Save Recipe'}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        recipe.isSaved ? 'fill text-[#b72301]' : ''
                      }`}
                    >
                      {recipe.isSaved ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Recipe Card Details */}
              <div className="p-5 flex flex-col gap-3 flex-grow">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-headline font-bold text-[#1b1c1a] group-hover:text-[#b72301] transition-colors leading-snug">
                    {recipe.title}
                  </h3>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-4 text-[#5b403a] text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      schedule
                    </span>
                    <span>{recipe.prepMinutes + recipe.cookMinutes} min</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#e4beb6]" />
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">
                      local_fire_department
                    </span>
                    <span>{recipe.calories} kcal</span>
                  </div>
                </div>

                {/* Smart Swap Banner if present */}
                {recipe.smartSubstitutions.length > 0 ? (
                  <div className="mt-auto pt-3 border-t border-[#e3e2df]">
                    <div className="flex items-start gap-2.5 bg-gradient-to-r from-[#faf9f5] to-[#ffdad3]/30 p-3 rounded-xl border border-[#ffdad3]">
                      <span className="material-symbols-outlined text-[#b72301] mt-0.5 text-[20px]">
                        auto_awesome
                      </span>
                      <p className="text-xs text-[#5b403a] leading-relaxed">
                        <span className="text-[#b72301] font-bold">Smart Swap:</span>{' '}
                        {recipe.smartSubstitutions[0].reason}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-[#efeeea] text-[#5b403a] rounded-md text-[11px] font-medium border border-[#e4beb6]/30 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2c694e]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
