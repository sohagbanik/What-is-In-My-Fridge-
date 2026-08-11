import React from 'react';
import { ActiveTab } from '../types';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pantryCount?: number;
  recipesCount?: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  pantryCount = 0,
  recipesCount = 0,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
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

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Responsive Navigation Drawer (Desktop sidebar + Slide-in Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 md:top-20 z-50 md:z-10 h-full md:h-auto w-72 md:w-64 bg-[#faf9f5] md:bg-transparent p-6 md:p-0 flex flex-col shrink-0 gap-4 transition-transform duration-300 ease-out border-r md:border-none border-[#e4beb6]/20 ${
          isMobileMenuOpen
            ? 'translate-x-0 left-0 shadow-2xl'
            : '-translate-x-full md:translate-x-0 hidden md:flex'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex justify-between items-center pb-4 md:hidden border-b border-[#e4beb6]/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#b72301] fill">kitchen</span>
            <span className="font-headline font-bold text-lg text-[#b72301]">What's in my fridge?</span>
          </div>
          <button
            onClick={onCloseMobileMenu}
            className="p-1.5 text-[#5b403a] hover:bg-[#e3e2df] rounded-full transition-colors"
            title="Close Menu"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 mt-2 md:mt-0">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
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

        {/* Quick CTA Card */}
        <div className="mt-auto md:mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#ffdad3] to-[#efeeea] border border-[#e4beb6]/40 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#b72301] font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>AI Vision Scan</span>
          </div>
          <p className="text-xs text-[#5b403a] leading-relaxed">
            Snap or upload a photo of your fridge to instantly detect ingredients & expire dates.
          </p>
          <button
            onClick={() => handleNavClick('scanner')}
            className="w-full bg-[#b72301] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#b72301]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">camera_alt</span>
            <span>Scan Fridge & Pantry</span>
          </button>
        </div>
      </aside>
    </>
  );
};
