export type ExpiryStatus = 'critical' | 'warning' | 'fresh' | 'good';

export interface PantryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy' | 'Pantry' | 'Protein' | 'Other';
  quantity: number;
  unit?: string;
  location?: string; // e.g. "Produce Drawer", "Top Shelf", "Countertop"
  daysLeft: number; // e.g. 1, 2, 5
  expiryText: string; // e.g. "Use within 1 day", "Fresh (5+ days)", "Ripe now"
  freshnessPercent: number; // 0 to 100 for progress bar
  status: ExpiryStatus; // 'critical' (red), 'warning' (amber), 'fresh' (green)
  imageUrl?: string;
  confidence?: number; // Detection confidence e.g. 95%
  isScanned?: boolean;
}

export interface SmartSubstitution {
  id: string;
  originalIngredient: string;
  substituteIngredient: string;
  reason: string;
  availableInPantry: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  inPantry: boolean;
  category?: string;
}

export interface CookingStep {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

export interface Recipe {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  prepTime: string; // e.g. "15 min"
  cookTime: string; // e.g. "25 min"
  prepMinutes: number;
  cookMinutes: number;
  level: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  servings: number;
  matchPercentage: number; // e.g. 100%
  usesExpiringItemsCount?: number;
  ingredients: Ingredient[];
  smartSubstitutions: SmartSubstitution[];
  steps: CookingStep[];
  isSaved?: boolean;
  tags: string[]; // e.g. ["Bell Peppers", "Broccoli", "Tofu"] or ["Vegetarian", "100% Match"]
}

export type ActiveTab = 'home' | 'pantry' | 'recipes' | 'saved' | 'scanner' | 'scanned-review' | 'recipe-detail';
