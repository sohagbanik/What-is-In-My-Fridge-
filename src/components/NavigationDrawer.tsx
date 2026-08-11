import React from 'react';
import { ActiveTab } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pantryCount?: number;
  recipesCount?: number;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  pantryCount = 0,
  recipesCount = 0,
}) => {
  if (!isOpen) return null;

  const navItems: { id: ActiveTab; label: string; icon: string; count?: number; description: string }[] = [
    { id: 'home', label: 'Home', icon: 'home', description: 'Main dashboard & AI quick actions' },
    { id: 'pantry', label: 'Pantry', icon: 'inventory_2', count: pantryCount, description: 'Track all ingredients & expiration dates' },
    { id: 'recipes', label: 'Recipes', icon: 'restaurant_menu', count: recipesCount, description: 'AI generated recipes from your fridge' },
    { id: 'saved', label: 'Saved Recipes', icon: 'bookmark', description: 'Your saved favorite recipes' },
  ];

  const handleSelect = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Semi-transparent Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Box */}
      <aside className="relative z-[110] w-80 max-w-[85vw] bg-[#faf9f5] h-full shadow-2xl flex flex-col p-6 border-r border-[#e4beb6]/30 animate-in slide-in-from-left duration-300">
        {/* Drawer Top Header */}
        <div className="flex justify-between items-center pb-5 mb-4 border-b border-[#e4beb6]/30">
          <div
            onClick={() => handleSelect('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#b72301] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl fill">kitchen</span>
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-lg text-[#b72301] tracking-tight leading-tight">
                What's in my fridge?
              </h2>
              <p className="text-[11px] text-[#5b403a] font-medium">Smart AI Kitchen Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#efeeea] hover:bg-[#e3e2df] flex items-center justify-center text-[#5b403a] transition-colors cursor-pointer"
            title="Close Menu"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Section Heading */}
        <p className="text-xs font-bold text-[#5b403a]/70 uppercase tracking-wider mb-2 px-1">
          Navigation Sections
        </p>

        {/* Navigation Section Buttons */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#b72301] text-white shadow-lg shadow-[#b72301]/20 font-bold'
                    : 'bg-white hover:bg-[#f4f4f0] text-[#1b1c1a] border border-[#e4beb6]/20 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#ff5733]/10 text-[#b72301]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">{item.label}</h3>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isActive ? 'text-white/80' : 'text-[#5b403a]'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.count !== undefined && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isActive
                        ? 'bg-white text-[#b72301]'
                        : 'bg-[#ff5733]/15 text-[#b72301]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Scan Box in Drawer */}
        <div className="mt-auto pt-4 border-t border-[#e4beb6]/30">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ffdad3] to-[#efeeea] border border-[#e4beb6]/40 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-[#b72301] font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              <span>AI Vision Scanner</span>
            </div>
            <p className="text-xs text-[#5b403a] leading-relaxed">
              Detect all food items in your fridge automatically.
            </p>
            <button
              onClick={() => handleSelect('scanner')}
              className="w-full bg-[#b72301] text-white py-3 rounded-xl text-xs font-bold shadow-md hover:bg-[#b72301]/90 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <span className="material-symbols-outlined text-base">camera_alt</span>
              <span>Start Fridge Scan</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
