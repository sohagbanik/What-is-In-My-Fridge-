import React from 'react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNotifications?: () => void;
  scannedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  scannedCount = 12,
}) => {
  if (activeTab === 'scanner' || activeTab === 'scanned-review') {
    return null; // Detailed full-screen flows handle their own top bars
  }

  return (
    <header className="bg-[#faf9f5] sticky top-0 z-40 border-b border-[#e4beb6]/20">
      <div className="flex justify-between items-center px-4 md:px-6 py-3 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="p-2 text-[#5b403a] hover:bg-[#e3e2df] rounded-full transition-colors hidden md:block"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1
            onClick={() => setActiveTab('home')}
            className="font-headline font-extrabold text-2xl text-[#b72301] cursor-pointer tracking-tight"
          >
            Kitchen Assistant
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff5733]/10 text-[#b72301] hover:bg-[#ff5733]/20 transition-colors text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>Scan Fridge</span>
          </button>

          <button
            onClick={() => setActiveTab('scanned-review')}
            className="relative p-2 text-[#5b403a] hover:bg-[#e3e2df] rounded-full transition-colors"
            title="Notifications & Inventory Alerts"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#b72301] rounded-full ring-2 ring-[#faf9f5]"></span>
          </button>

          <div
            onClick={() => setActiveTab('home')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#e9e8e4] ml-1 cursor-pointer"
          >
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-E1KDH0Qwjjqsrov1GwcZHYm9Qcj11BVf8Pdun-Jhj7_mHInjROGrEwDWBnrSGY317iy06QHE44hnzTRw-IOf1gwLKiM504-hOk5dCC0laon_tJkj_YLGg4FJFPs0D1q9Ji3G4aVXL87BEexmodxaEeC5zKVoygJCVm_ME_MFNPlpROGjVfTKnk_gVvNf8gN6Nw-UdlzMw5rb1WvTmPaZ4xGhQG-Pw2aL7Qlxj_kUl8nYQdDrUzBP1g"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
