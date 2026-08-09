import React from 'react';
import { ActiveTab } from '../types';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pantryCount?: number;
  recipesCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  pantryCount = 12,
  recipesCount = 12,
}) => {
  if (activeTab === 'scanner' || activeTab === 'scanned-review') {
    return null;
  }

  const navItems: { id: ActiveTab; label: string; icon: string; count?: number }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'pantry', label: 'Pantry', icon: 'inventory_2', count: pantryCount },
    { id: 'recipes', label: 'Recipes', icon: 'restaurant_menu', count: recipesCount },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-20 gap-3 mr-6 py-4">
      <nav className="flex flex-col gap-1.5">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#ff5733]/15 text-[#580c00] font-bold shadow-sm border border-[#ffdad3]'
                  : 'text-[#5b403a] hover:bg-[#e3e2df]/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined ${
                    isActive ? 'fill text-[#b72301]' : 'text-[#5b403a]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#b72301] text-white'
                      : 'bg-[#efeeea] text-[#5b403a]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick CTA card in desktop sidebar */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[#ffdad3] to-[#efeeea] border border-[#e4beb6]/40 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#b72301] font-bold text-xs uppercase tracking-wider">
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          <span>AI Vision Scan</span>
        </div>
        <p className="text-xs text-[#5b403a] leading-relaxed">
          Snap a photo of your fridge to instantly detect ingredients & expire dates.
        </p>
        <button
          onClick={() => setActiveTab('scanner')}
          className="w-full bg-[#b72301] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#b72301]/90 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">camera_alt</span>
          <span>Scan Fridge & Pantry</span>
        </button>
      </div>
    </aside>
  );
};
