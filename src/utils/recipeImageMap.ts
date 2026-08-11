/**
 * High-quality curated Unsplash food image mapping.
 * Maps recipe titles, tags, and ingredients to accurate, appetizing food photography.
 */

const foodImages: Record<string, string> = {
  // --- Indian Cuisine ---
  'paneer butter masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'paneer tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
  'paneer bhurji': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'palak paneer': 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?auto=format&fit=crop&w=800&q=80',
  'kadai paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',

  'aloo gobi': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  'aloo': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  'gobi': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',

  'dal tadka': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'tadka dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',

  'chana masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  'chole': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  'chana': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',

  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  'pulao': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=800&q=80',
  'jeera rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80',

  'egg curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  'curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  'masala': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',

  'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  'naan': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
  'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
  'lassi': 'https://images.unsplash.com/photo-1571006682858-a45722271578?auto=format&fit=crop&w=800&q=80',

  // --- Salads & Fresh Produce ---
  'strawberry apple salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
  'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'tomato': 'https://images.unsplash.com/photo-1592417817098-8f3d6928e08d?auto=format&fit=crop&w=800&q=80',
  'cucumber': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',

  // --- Eggs & Breakfast ---
  'cheesy tomato frittata': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
  'frittata': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
  'omelette': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
  'scramble': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  'egg': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  'toast': 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80',

  // --- Smoothies & Drinks ---
  'smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
  'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',

  // --- Pasta & Global Mains ---
  'pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&w=800&q=80',
  'rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80',
  'soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  'chicken': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
  'stir fry': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
};

const defaultFoodImages = [
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', // Indian Curry / Thali
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80', // Paneer Butter Masala
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', // Healthy Buddha Bowl
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', // Rich Indian Gravy
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', // Fresh Green Salad
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', // Delicious Biryani
];

export function getRecipeImage(title: string, tags: string[] = []): string {
  const query = `${title} ${tags.join(' ')}`.toLowerCase();

  for (const [key, url] of Object.entries(foodImages)) {
    if (query.includes(key)) {
      return url;
    }
  }

  // Return a high quality food bowl image based on title length hash
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultFoodImages[hash % defaultFoodImages.length];
}

