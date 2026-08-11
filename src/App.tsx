import { useState } from 'react';
import { ActiveTab, PantryItem, Recipe } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { HomeView } from './components/views/HomeView';
import { ScannerView } from './components/views/ScannerView';
import { ScannedReviewView } from './components/views/ScannedReviewView';
import { RecipesFeedView } from './components/views/RecipesFeedView';
import { RecipeDetailView } from './components/views/RecipeDetailView';
import { InteractiveCookingView } from './components/views/InteractiveCookingView';
import { PantryView } from './components/views/PantryView';
import { SavedView } from './components/views/SavedView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  // Start with EMPTY state — all data comes from real AI scanning
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);

  const handleScanComplete = (scanned: PantryItem[]) => {
    // Merge new scanned items with existing pantry
    setPantryItems(prev => {
      const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
      const filteredNew = scanned.filter(s => !existingNames.has(s.name.toLowerCase()));
      return [...filteredNew, ...prev];
    });
    setActiveTab('scanned-review');
  };

  const handleToggleBookmark = (recipeId: string) => {
    setRecipes(prev =>
      prev.map(r => (r.id === recipeId ? { ...r, isSaved: !r.isSaved } : r))
    );
    if (selectedRecipe && selectedRecipe.id === recipeId) {
      setSelectedRecipe(prev => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setActiveTab('recipe-detail');
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1b1c1a] font-body flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scannedCount={pantryItems.length}
      />

      {/* Main Container Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6 flex flex-col md:flex-row items-start relative">
        {/* Desktop Left Navigation Bar */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pantryCount={pantryItems.length}
          recipesCount={recipes.length}
        />

        {/* View Switcher Content Area */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'home' && (
            <HomeView
              pantryItems={pantryItems}
              setActiveTab={setActiveTab}
              onScanComplete={handleScanComplete}
              onSelectCategory={cat => setSelectedCategoryFilter(cat)}
            />
          )}

          {activeTab === 'scanner' && (
            <ScannerView
              setActiveTab={setActiveTab}
              onScanComplete={handleScanComplete}
            />
          )}

          {activeTab === 'scanned-review' && (
            <ScannedReviewView
              pantryItems={pantryItems}
              setPantryItems={setPantryItems}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesFeedView
              recipes={recipes}
              pantryItems={pantryItems}
              onSelectRecipe={handleSelectRecipe}
              onToggleBookmark={handleToggleBookmark}
              onAddRecipes={(newRecipes) => setRecipes(prev => [...newRecipes, ...prev])}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'recipe-detail' && selectedRecipe && (
            <RecipeDetailView
              recipe={selectedRecipe}
              setActiveTab={setActiveTab}
              onStartCooking={() => setIsCookingModeOpen(true)}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'pantry' && (
            <PantryView
              pantryItems={pantryItems}
              setPantryItems={setPantryItems}
              setActiveTab={setActiveTab}
              selectedCategoryFilter={selectedCategoryFilter}
            />
          )}

          {activeTab === 'saved' && (
            <SavedView
              recipes={recipes}
              onSelectRecipe={handleSelectRecipe}
              onToggleBookmark={handleToggleBookmark}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Interactive Cooking Guide Modal */}
      {isCookingModeOpen && selectedRecipe && (
        <InteractiveCookingView
          recipe={selectedRecipe}
          onClose={() => setIsCookingModeOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
