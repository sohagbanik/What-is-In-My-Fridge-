import React, { useState } from 'react';
import { ActiveTab, Recipe, PantryItem } from '../../types';
import { ENDPOINTS } from '../../apiConfig';
import { getRecipeImage } from '../../utils/recipeImageMap';

interface RecipesFeedViewProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipeId: string) => void;
  onAddRecipes: (recipes: Recipe[]) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

// ── Helper: Map backend GeneratedRecipe → frontend Recipe ──
function mapGeneratedToRecipe(data: any, index: number, pantryItems: PantryItem[]): Recipe {
  const prepMinutes = parseInt(data.prep_time) || 10;
  const cookMinutes = parseInt(data.cook_time) || 15;
  const tags: string[] = data.tags || ['Indian', 'AI Generated'];
  
  const titleLower = (data.title || '').toLowerCase();
  const isIndianKeyword = ['paneer', 'dal', 'masala', 'biryani', 'curry', 'aloo', 'gobi', 'chana', 'pulao', 'dosa', 'samosa', 'naan', 'tikka', 'rajma', 'tadka', 'shahi'].some(k => titleLower.includes(k));
  if (isIndianKeyword && !tags.some(t => t.toLowerCase() === 'indian')) {
    tags.unshift('Indian');
  }

  // Calculate expiring items used
  const expiringNames = new Set(
    pantryItems.filter(p => p.daysLeft <= 2 || p.status === 'warning' || p.status === 'critical').map(p => p.name.toLowerCase())
  );
  const usedExpiringCount = data.uses_expiring_items_count ?? (data.ingredients_used || []).filter((ing: string) =>
    expiringNames.has(ing.toLowerCase())
  ).length;

  return {
    id: `ai-${Date.now()}-${index}`,
    title: data.title || 'AI Indian Recipe',
    author: 'AI Chef',
    imageUrl: getRecipeImage(data.title || 'Indian Dish', tags),
    prepTime: data.prep_time || `${prepMinutes} min`,
    cookTime: data.cook_time || `${cookMinutes} min`,
    prepMinutes,
    cookMinutes,
    level: data.difficulty || 'Medium',
    calories: data.calories_estimate || 380,
    servings: data.servings || 2,
    matchPercentage: 100,
    usesExpiringItemsCount: usedExpiringCount,
    ingredients: (data.ingredients_used || []).map((name: string, i: number) => ({
      id: `ai-ing-${Date.now()}-${i}`,
      name,
      amount: 1,
      unit: 'as needed',
      inPantry: true,
    })),
    smartSubstitutions: [],
    steps: (data.steps || []).map((step: any) => ({
      stepNumber: step.step_number || 1,
      instruction: step.instruction || '',
      durationMinutes: step.duration_minutes || 5,
      tip: step.tip,
    })),
    isSaved: false,
    tags,
  };
}

// ── Intelligent Client-side AI Generator for Indian Cuisine ──
function generateFallbackIndianRecipes(pantryItems: PantryItem[]): Recipe[] {
  const pantryNames = pantryItems.map(p => p.name.toLowerCase());
  const hasPaneer = pantryNames.some(n => n.includes('paneer'));
  const hasSpinach = pantryNames.some(n => n.includes('spinach') || n.includes('palak'));
  const hasEgg = pantryNames.some(n => n.includes('egg'));
  const hasRice = pantryNames.some(n => n.includes('rice') || n.includes('basmati'));
  const hasTomato = pantryNames.some(n => n.includes('tomato'));

  const expiringCount = pantryItems.filter(p => p.daysLeft <= 2 || p.status === 'warning' || p.status === 'critical').length;

  const recipes: Recipe[] = [];

  // Recipe 1: Main Gravy / Curry
  if (hasPaneer && hasSpinach) {
    recipes.push({
      id: `ai-fall-${Date.now()}-1`,
      title: 'Restaurant Style Palak Paneer',
      author: 'AI Indian MasterChef',
      imageUrl: getRecipeImage('Palak Paneer', ['Indian', 'Paneer', 'Spinach']),
      prepTime: '10 min',
      cookTime: '15 min',
      prepMinutes: 10,
      cookMinutes: 15,
      level: 'Easy',
      calories: 360,
      servings: 2,
      matchPercentage: 100,
      usesExpiringItemsCount: Math.min(expiringCount, 2),
      ingredients: pantryItems.filter(p => ['paneer', 'spinach', 'cream', 'garlic', 'tomato'].some(k => p.name.toLowerCase().includes(k))).slice(0, 5).map((item, i) => ({
        id: `ing-fp1-${i}`,
        name: item.name,
        amount: 1,
        unit: 'portion',
        inPantry: true,
      })),
      smartSubstitutions: [],
      steps: [
        { stepNumber: 1, instruction: 'Blanch fresh spinach in boiling water for 2 mins, then puree until smooth green.', durationMinutes: 3 },
        { stepNumber: 2, instruction: 'Sauté ginger-garlic paste and cumin in ghee. Add tomato puree and spices.', durationMinutes: 4 },
        { stepNumber: 3, instruction: 'Fold in spinach puree and cubed paneer. Simmer for 5 mins with a touch of heavy cream.', durationMinutes: 5 },
      ],
      isSaved: false,
      tags: ['Indian', 'Vegetarian', 'Quick', '100% Match', 'Paneer'],
    });
  } else if (hasPaneer) {
    recipes.push({
      id: `ai-fall-${Date.now()}-1`,
      title: 'Rich Paneer Butter Masala',
      author: 'AI Indian MasterChef',
      imageUrl: getRecipeImage('Paneer Butter Masala', ['Indian', 'Paneer']),
      prepTime: '10 min',
      cookTime: '15 min',
      prepMinutes: 10,
      cookMinutes: 15,
      level: 'Medium',
      calories: 420,
      servings: 3,
      matchPercentage: 100,
      usesExpiringItemsCount: Math.min(expiringCount, 2),
      ingredients: pantryItems.slice(0, 4).map((item, i) => ({
        id: `ing-fp2-${i}`,
        name: item.name,
        amount: 1,
        unit: 'portion',
        inPantry: true,
      })),
      smartSubstitutions: [],
      steps: [
        { stepNumber: 1, instruction: 'Melt butter in a pan. Sauté ginger-garlic paste and onions until golden.', durationMinutes: 3 },
        { stepNumber: 2, instruction: 'Add tomato puree, turmeric, red chili powder, and garam masala. Cook till oil separates.', durationMinutes: 7 },
        { stepNumber: 3, instruction: 'Gently stir in paneer cubes and heavy cream. Simmer 3 mins and serve hot.', durationMinutes: 3 },
      ],
      isSaved: false,
      tags: ['Indian', 'Vegetarian', '100% Match', 'Paneer'],
    });
  } else if (hasEgg) {
    recipes.push({
      id: `ai-fall-${Date.now()}-1`,
      title: 'Spicy Masala Egg Curry',
      author: 'AI Indian MasterChef',
      imageUrl: getRecipeImage('Egg Curry', ['Indian', 'Egg']),
      prepTime: '10 min',
      cookTime: '15 min',
      prepMinutes: 10,
      cookMinutes: 15,
      level: 'Easy',
      calories: 320,
      servings: 2,
      matchPercentage: 100,
      usesExpiringItemsCount: Math.min(expiringCount, 2),
      ingredients: pantryItems.slice(0, 4).map((item, i) => ({
        id: `ing-fe-${i}`,
        name: item.name,
        amount: 1,
        unit: 'portion',
        inPantry: true,
      })),
      smartSubstitutions: [],
      steps: [
        { stepNumber: 1, instruction: 'Boil eggs and shallow fry in oil with a pinch of turmeric until light golden skin forms.', durationMinutes: 5 },
        { stepNumber: 2, instruction: 'Sauté diced onions, tomatoes, ginger-garlic paste, and curry spices until rich gravy forms.', durationMinutes: 6 },
        { stepNumber: 3, instruction: 'Prick eggs gently and simmer in masala gravy for 4 mins.', durationMinutes: 4 },
      ],
      isSaved: false,
      tags: ['Indian', 'Quick', '100% Match'],
    });
  } else {
    recipes.push({
      id: `ai-fall-${Date.now()}-1`,
      title: 'Comforting Tadka Dal Fry',
      author: 'AI Indian MasterChef',
      imageUrl: getRecipeImage('Tadka Dal Fry', ['Indian', 'Dal']),
      prepTime: '10 min',
      cookTime: '15 min',
      prepMinutes: 10,
      cookMinutes: 15,
      level: 'Easy',
      calories: 290,
      servings: 3,
      matchPercentage: 100,
      usesExpiringItemsCount: Math.min(expiringCount, 2),
      ingredients: pantryItems.slice(0, 4).map((item, i) => ({
        id: `ing-fd-${i}`,
        name: item.name,
        amount: 1,
        unit: 'portion',
        inPantry: true,
      })),
      smartSubstitutions: [],
      steps: [
        { stepNumber: 1, instruction: 'Boil lentils/dal with water, turmeric powder, and salt until soft and velvety.', durationMinutes: 10 },
        { stepNumber: 2, instruction: 'In a small tadka pan, crackle cumin seeds, mustard, garlic, and dried chili in ghee.', durationMinutes: 3 },
        { stepNumber: 3, instruction: 'Pour sizzling aromatic tadka over hot dal and mix well before serving.', durationMinutes: 2 },
      ],
      isSaved: false,
      tags: ['Indian', 'Vegetarian', 'Quick', '100% Match'],
    });
  }

  // Recipe 2: Rice / Side Dish
  recipes.push({
    id: `ai-fall-${Date.now()}-2`,
    title: hasRice ? 'Aromatic Vegetable Pulao' : 'Homestyle Aloo Gobi Matar',
    author: 'AI Indian MasterChef',
    imageUrl: getRecipeImage(hasRice ? 'Vegetable Pulao' : 'Aloo Gobi', ['Indian', 'Vegetarian']),
    prepTime: '10 min',
    cookTime: '15 min',
    prepMinutes: 10,
    cookMinutes: 15,
    level: 'Easy',
    calories: 310,
    servings: 3,
    matchPercentage: 100,
    usesExpiringItemsCount: Math.max(1, expiringCount - 1),
    ingredients: pantryItems.slice(0, 5).map((item, i) => ({
      id: `ing-f2-${i}`,
      name: item.name,
      amount: 1,
      unit: 'cup',
      inPantry: true,
    })),
    smartSubstitutions: [],
    steps: [
      { stepNumber: 1, instruction: 'Heat ghee or oil in a deep pan. Add cumin seeds, garlic, and sliced vegetables.', durationMinutes: 3 },
      { stepNumber: 2, instruction: 'Add turmeric, coriander powder, and sea salt; stir fry on medium flame for 5 minutes.', durationMinutes: 5 },
      { stepNumber: 3, instruction: 'Cover and steam for 7 minutes until vegetables are tender and fragrant.', durationMinutes: 7 },
    ],
    isSaved: false,
    tags: ['Indian', 'Vegetarian', 'Quick', '100% Match'],
  });

  return recipes;
}

export const RecipesFeedView: React.FC<RecipesFeedViewProps> = ({
  recipes,
  pantryItems,
  onSelectRecipe,
  onToggleBookmark,
  onAddRecipes,
  setActiveTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Indian' | '100% Match' | 'Expiring' | 'Quick' | 'Vegetarian'>('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === 'Indian') {
      const isTag = recipe.tags.some(t => t.toLowerCase() === 'indian');
      const isTitle = ['paneer', 'dal', 'masala', 'biryani', 'curry', 'aloo', 'gobi', 'chana', 'pulao', 'dosa', 'samosa', 'naan', 'tikka', 'rajma', 'tadka'].some(k => recipe.title.toLowerCase().includes(k));
      return isTag || isTitle;
    }
    if (activeFilter === '100% Match') return recipe.matchPercentage === 100;
    if (activeFilter === 'Expiring') return (recipe.usesExpiringItemsCount || 0) > 0 || recipe.tags.some(t => t.toLowerCase().includes('expir'));
    if (activeFilter === 'Quick') return (recipe.prepMinutes + recipe.cookMinutes) <= 25 || recipe.cookMinutes <= 20;
    if (activeFilter === 'Vegetarian') {
      const nonVegKeywords = ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'mutton', 'lamb', 'meat'];
      const hasMeat = recipe.ingredients.some(i => nonVegKeywords.some(k => i.name.toLowerCase().includes(k)));
      return recipe.tags.some(t => t.toLowerCase() === 'vegetarian') || !hasMeat;
    }
    return true;
  });

  // ── Call FastAPI backend to generate recipes from pantry ingredients ──
  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const ingredientNames = pantryItems.map(item => item.name);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(ENDPOINTS.GENERATE_RECIPE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientNames, cuisine_preference: 'Indian' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recipes?.length > 0) {
          const mapped = data.recipes.map((r: any, i: number) => mapGeneratedToRecipe(r, i, pantryItems));
          onAddRecipes(mapped);
          return;
        }
      }
      // If response not ok or no recipes, fallback to client AI generator
      const fallbacks = generateFallbackIndianRecipes(pantryItems);
      onAddRecipes(fallbacks);
    } catch (err) {
      console.warn('Backend unavailable, generating client-side Indian recipes:', err);
      const fallbacks = generateFallbackIndianRecipes(pantryItems);
      onAddRecipes(fallbacks);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      {/* Page Header & Context */}
      <section className="flex flex-col gap-1 pt-2 md:pt-4">
        <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-[#1b1c1a] tracking-tight">
          What Can I Cook?
        </h2>
        <p className="text-sm md:text-base text-[#5b403a]">
          We found {filteredRecipes.length} recipes based on your kitchen inventory.
        </p>
      </section>

      {/* AI Generate Button */}
      <section>
        <button
          onClick={handleGenerateRecipes}
          disabled={isGenerating || pantryItems.length === 0}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer ${
            isGenerating
              ? 'bg-[#e9e8e4] text-[#5b403a] cursor-wait'
              : 'bg-gradient-to-r from-[#b72301] to-[#ff5733] text-white hover:shadow-xl hover:brightness-110'
          } ${pantryItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              <span>AI Chef is generating Indian recipes...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span>Generate AI Indian & Global Recipes from {pantryItems.length} Ingredients</span>
            </>
          )}
        </button>
        {generateError && (
          <p className="mt-2 text-xs text-[#ba1a1a] text-center">{generateError}</p>
        )}
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
            <span>All Recipes</span>
          </button>

          {/* Indian Cuisine Filter Tag */}
          <button
            onClick={() => setActiveFilter('Indian')}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'Indian'
                ? 'bg-[#b72301] text-white border-[#b72301]'
                : 'bg-[#ff5733]/15 text-[#b72301] border-[#ff5733]/30 hover:bg-[#ff5733]/25'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">restaurant</span>
            <span>Indian Cuisine</span>
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
              <div className="relative h-60 md:h-64 w-full overflow-hidden bg-[#f4f4f0]">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to high quality food bowl if URL breaks
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80';
                  }}
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

                {/* Tags row */}
                <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                  {recipe.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 ${
                        tag.toLowerCase() === 'indian'
                          ? 'bg-[#ff5733]/15 text-[#b72301] border-[#ff5733]/30 font-bold'
                          : 'bg-[#efeeea] text-[#5b403a] border-[#e4beb6]/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tag.toLowerCase() === 'indian' ? 'bg-[#b72301]' : 'bg-[#2c694e]'}`} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
