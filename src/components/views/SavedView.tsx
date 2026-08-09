import React, { useState } from 'react';
import { ActiveTab, Recipe } from '../../types';

interface SavedViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  recipes,
  onSelectRecipe,
  onToggleBookmark,
  setActiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const savedRecipes = recipes.filter(
    r => r.isSaved && r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <section className="pt-2">
        <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-[#1b1c1a]">
          Saved Cookbook
        </h2>
        <p className="text-sm text-[#5b403a] mt-0.5">
          {savedRecipes.length} recipes bookmarked for quick cooking
        </p>
      </section>

      {/* Search Input */}
      <section>
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b403a] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search saved recipes..."
            className="w-full bg-white border border-[#e4beb6]/50 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301] shadow-sm"
          />
        </div>
      </section>

      {/* Saved Recipe List */}
      {savedRecipes.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#e3e2df] flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#5b403a]">
            bookmark_border
          </span>
          <p className="text-sm font-semibold text-[#1b1c1a]">
            No saved recipes found
          </p>
          <button
            onClick={() => setActiveTab('recipes')}
            className="px-4 py-2 bg-[#b72301] text-white text-xs font-bold rounded-xl hover:bg-[#b72301]/90 transition-all cursor-pointer"
          >
            Explore Recipes
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="bg-white rounded-2xl border border-[#e3e2df] shadow-sm p-4 flex gap-3 group cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0 pr-6">
                <div>
                  <h3 className="font-bold text-[#1b1c1a] text-sm group-hover:text-[#b72301] transition-colors truncate">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-[#5b403a] mt-0.5">{recipe.author}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#5b403a] font-medium mt-2">
                  <span>{recipe.prepMinutes + recipe.cookMinutes} min</span>
                  <span>•</span>
                  <span>{recipe.calories} kcal</span>
                </div>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleBookmark(recipe.id);
                }}
                className="absolute top-3 right-3 text-[#b72301] hover:text-[#5b403a] transition-colors cursor-pointer"
                title="Unsave recipe"
              >
                <span className="material-symbols-outlined fill text-xl">
                  bookmark
                </span>
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
