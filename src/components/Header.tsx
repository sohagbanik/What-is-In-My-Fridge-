import React, { useState } from 'react';
import { ActiveTab, PantryItem } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleMobileMenu?: () => void;
  expiringItems?: PantryItem[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileMenu,
  expiringItems = [],
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  if (activeTab === 'scanner' || activeTab === 'scanned-review') {
    return null; // Detailed full-screen flows handle their own top bars
  }

  const expiringCount = expiringItems.length;

  return (
    <header className="bg-[#faf9f5] sticky top-0 z-40 border-b border-[#e4beb6]/20 shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-6 py-3 w-full max-w-7xl mx-auto">
        {/* Left: 3-line Menu Button & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-[#5b403a] hover:bg-[#e3e2df] rounded-full transition-colors active:scale-95 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            title="Open Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <h1
            onClick={() => setActiveTab('home')}
            className="font-headline font-extrabold text-xl md:text-2xl text-[#b72301] cursor-pointer tracking-tight flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-2xl fill">kitchen</span>
            <span>What's in my fridge?</span>
          </h1>
        </div>

        {/* Right: Quick Action Buttons & Notifications */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveTab('scanner')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#b72301] text-white hover:bg-[#b72301]/90 transition-colors text-xs font-semibold shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>Scan Fridge</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#5b403a] hover:bg-[#e3e2df] rounded-full transition-colors cursor-pointer"
            title="Notifications & Inventory Alerts"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {expiringCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#b72301] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#faf9f5]">
                {expiringCount}
              </span>
            )}
          </button>

          {/* User Avatar */}
          <div
            onClick={() => setActiveTab('home')}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#e9e8e4] ml-1 cursor-pointer hover:border-[#b72301] transition-colors"
            title="Home"
          >
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-E1KDH0Qwjjqsrov1GwcZHYm9Qcj11BVf8Pdun-Jhj7_mHInjROGrEwDWBnrSGY317iy06QHE44hnzTRw-IOf1gwLKiM504-hOk5dCC0laon_tJkj_YLGg4FJFPs0D1q9Ji3G4aVXL87BEexmodxaEeC5zKVoygJCVm_ME_MFNPlpROGjVfTKnk_gVvNf8gN6Nw-UdlzMw5rb1WvTmPaZ4xGhQG-Pw2aL7Qlxj_kUl8nYQdDrUzBP1g"
            />
          </div>

          {/* Notifications Popover Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-[#e4beb6]/30 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#e4beb6]/20">
                <h3 className="font-headline font-bold text-sm text-[#1b1c1a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#b72301] text-base">notifications_active</span>
                  Notifications
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#5b403a] hover:text-[#1b1c1a]"
                >
                  Close
                </button>
              </div>

              {expiringCount > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-[#ffddb5]/50 border border-[#835400]/20 rounded-xl text-xs">
                    <p className="font-bold text-[#835400] flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      {expiringCount} Item{expiringCount > 1 ? 's' : ''} Expiring Soon
                    </p>
                    <p className="text-[#5b403a]">
                      Check your pantry items to reduce food waste before they expire.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      setActiveTab('pantry');
                    }}
                    className="w-full text-center text-xs font-bold text-[#b72301] py-2 bg-[#ff5733]/10 hover:bg-[#ff5733]/20 rounded-xl transition-colors cursor-pointer"
                  >
                    View Expiring Pantry Items →
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#5b403a]">
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">check_circle</span>
                  <p className="font-bold text-[#1b1c1a]">All Caught Up!</p>
                  <p className="mt-0.5 text-gray-500">No items expiring soon in your kitchen.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
