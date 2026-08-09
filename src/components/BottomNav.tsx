import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  if (activeTab === 'scanner' || activeTab === 'scanned-review') {
    return null; // Suppressed on linear full-screen review and camera scanner
  }

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'pantry', label: 'Pantry', icon: 'inventory_2' },
    { id: 'recipes', label: 'Recipes', icon: 'restaurant_menu' },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
  ];

  return (
    <nav className="md:hidden bg-white fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 min-h-[68px] border-t border-[#e4beb6]/30 shadow-[0_-4px_20px_0_rgba(183,35,1,0.04)] rounded-t-2xl">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-[#ff5733]/15 text-[#580c00] font-bold'
                : 'text-[#5b403a] hover:bg-[#efeeea]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                isActive ? 'fill text-[#b72301]' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span
              className={`text-[12px] font-medium mt-0.5 ${
                isActive ? 'text-[#b72301] font-bold' : ''
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
