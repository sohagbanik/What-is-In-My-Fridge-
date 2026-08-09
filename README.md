# 🍳 What's In My Fridge? — AI Kitchen Assistant

> An AI-powered kitchen companion that scans your fridge, tracks pantry freshness, and generates smart recipes from the ingredients you already have — so nothing goes to waste.

---

## ✨ Features

### 📸 AI Fridge & Pantry Scanner
- **Snap a photo** of your fridge or pantry and let **Gemini AI** identify every food item automatically.
- Each detected item includes a **confidence score**, estimated **shelf life**, **freshness percentage**, and **storage location**.
- Falls back to realistic mock detection when no API key is configured.

### 🥬 Smart Pantry Management
- **Dashboard view** with categorized inventory: Produce, Dairy, Pantry, and Protein.
- **Expiry alerts** with color-coded status indicators:
  - 🔴 **Critical** — use immediately
  - 🟡 **Warning** — expiring soon
  - 🟢 **Fresh** — plenty of time
- **"Use First" section** surfaces items closest to expiration on the home screen.

### 🍝 AI Recipe Generation
- Generates personalized recipes from your **actual pantry contents** using Gemini AI.
- Recipes display **ingredient match percentage** (e.g. *"100% Match"*) and highlight items that are expiring soon.
- Filter recipes by category and dietary preferences.

### 🔄 Smart Substitutions
- When a recipe calls for an ingredient you don't have, the AI suggests **pantry-friendly swaps**.
- Example: *"Use Greek Yogurt instead of Heavy Cream — similar creamy texture with less fat."*

### 👨‍🍳 Interactive Cooking Mode
- Step-by-step guided cooking experience with **timer integration** for each step.
- Includes **pro tips** at key steps for better results.
- Full-screen modal so you can cook without distractions.

### 💾 Save & Bookmark Recipes
- Bookmark your favorite recipes for quick access in the **Saved** tab.
- Toggle bookmarks from the recipe feed, detail view, or saved collection.

### 📱 Responsive Design
- **Desktop**: Full sidebar navigation with persistent layout.
- **Mobile**: Bottom navigation bar with compact card layouts.
- Designed with **Material Design 3** icons and a warm, kitchen-inspired color palette.

---

## 🏗️ Tech Stack

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript                                              |
| **Styling**  | Tailwind CSS v4, Google Fonts (Inter, Plus Jakarta Sans)          |
| **Icons**    | Google Material Symbols (Outlined + Filled)                       |
| **Bundler**  | Vite 6                                                            |
| **AI**       | Google Gemini API (`@google/genai`) via custom Vite server plugin |
| **Backend**  | Vite dev server middleware (Express-style API routes)             |

---

## 📁 Project Structure

```
kitchen-assistant/
├── index.html                  # Entry HTML with font preloads
├── vite.config.ts              # Vite config with React, Tailwind & API plugin
├── package.json
├── tsconfig.json
├── .env.local                  # GEMINI_API_KEY goes here
│
└── src/
    ├── main.tsx                # React DOM entry point
    ├── App.tsx                 # Root component with view routing & state
    ├── index.css               # Tailwind theme, custom animations
    │
    ├── types/
    │   └── index.ts            # TypeScript interfaces (PantryItem, Recipe, etc.)
    │
    ├── data/
    │   └── mockData.ts         # Default pantry items & sample recipes
    │
    ├── components/
    │   ├── Header.tsx          # Top navigation bar
    │   ├── BottomNav.tsx       # Mobile bottom navigation
    │   ├── DesktopSidebar.tsx  # Desktop left sidebar
    │   └── views/
    │       ├── HomeView.tsx              # Dashboard with "Use First" & Inventory
    │       ├── ScannerView.tsx           # Camera-based AI fridge scanner
    │       ├── ScannedReviewView.tsx     # Review & confirm scanned items
    │       ├── RecipesFeedView.tsx       # Browse AI-generated recipe cards
    │       ├── RecipeDetailView.tsx      # Full recipe with ingredients & steps
    │       ├── InteractiveCookingView.tsx # Step-by-step cooking guide
    │       ├── PantryView.tsx            # Full pantry inventory manager
    │       └── SavedView.tsx             # Bookmarked recipes collection
    │
    └── server/
        └── apiPlugin.ts        # Vite server middleware with 3 API routes
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- *(Optional)* A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey) for AI features

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sohagbanik/What-is-In-My-Fridge-.git
cd What-is-In-My-Fridge-

# 2. Install dependencies
npm install

# 3. (Optional) Configure your Gemini API key
#    Edit .env.local and replace the placeholder:
echo GEMINI_API_KEY=your_actual_api_key_here > .env.local

# 4. Start the development server
npm run dev
```

The app will be available at **[http://localhost:5173](http://localhost:5173)**.

> **Note:** The app works fully without an API key — it uses built-in mock data for scanning, recipe generation, and smart substitutions. Add a Gemini API key to unlock real AI-powered features.

---

## 🔌 API Routes

The Vite dev server exposes three API endpoints via a custom middleware plugin:

| Method | Endpoint                | Description                                      |
| ------ | ----------------------- | ------------------------------------------------ |
| POST   | `/api/analyze-image`    | Analyzes a fridge/pantry photo and detects items  |
| POST   | `/api/generate-recipes` | Generates recipes from pantry ingredients         |
| POST   | `/api/smart-swap`       | Suggests ingredient substitutions from your pantry |

All endpoints return JSON. When `GEMINI_API_KEY` is not set, they return realistic mock responses.

---

## 📜 Available Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the Vite development server  |
| `npm run build`     | Build for production into `dist/`  |
| `npm run preview`   | Preview the production build       |

---

## 🎨 Design System

The app uses a **Material Design 3** inspired warm color palette defined in `src/index.css`:

| Token               | Color     | Usage                          |
| -------------------- | --------- | ------------------------------ |
| `--color-primary`    | `#b72301` | CTA buttons, active navigation |
| `--color-secondary`  | `#2c694e` | Fresh status badges            |
| `--color-tertiary`   | `#835400` | Warning/amber indicators       |
| `--color-error`      | `#ba1a1a` | Critical expiry alerts         |
| `--color-background` | `#faf9f5` | Warm off-white page background |

**Typography:**
- **Display / Headlines** — Plus Jakarta Sans (600–800 weight)
- **Body / UI** — Inter (400–700 weight)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using React, Vite, Tailwind CSS & Google Gemini AI
</p>
