import React from 'react';
import { ActiveTab, PantryItem } from '../../types';

interface HomeViewProps {
  pantryItems: PantryItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectCategory?: (category: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  pantryItems,
  setActiveTab,
  onSelectCategory,
}) => {
  // Filter expiring items
  const expiringItems = pantryItems.filter(
    item => item.daysLeft <= 2 || item.status === 'critical' || item.status === 'warning'
  );

  // Counts by category
  const getCategoryCount = (categoryName: string) => {
    return pantryItems.filter(item => item.category === categoryName).length;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-8">
      {/* Header Section */}
      <section className="pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-[#1b1c1a] tracking-tight">
            What's in your kitchen today, Alex?
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-[#e9e8e4] md:hidden">
          <img
            alt="Profile Picture"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-E1KDH0Qwjjqsrov1GwcZHYm9Qcj11BVf8Pdun-Jhj7_mHInjROGrEwDWBnrSGY317iy06QHE44hnzTRw-IOf1gwLKiM504-hOk5dCC0laon_tJkj_YLGg4FJFPs0D1q9Ji3G4aVXL87BEexmodxaEeC5zKVoygJCVm_ME_MFNPlpROGjVfTKnk_gVvNf8gN6Nw-UdlzMw5rb1WvTmPaZ4xGhQG-Pw2aL7Qlxj_kUl8nYQdDrUzBP1g"
          />
        </div>
      </section>

      {/* Main Action Area: Scan CTA */}
      <section>
        <button
          onClick={() => setActiveTab('scanner')}
          className="w-full bg-[#b72301] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-[0_4px_20px_0_rgba(183,35,1,0.2)] hover:bg-[#b72301]/90 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl fill">photo_camera</span>
          <span className="text-lg font-bold font-headline">Scan Fridge & Pantry</span>
        </button>
      </section>

      {/* Use First Banner (Expiry Alerts) */}
      <section className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-headline font-bold text-[#1b1c1a]">Use First</h2>
          <button
            onClick={() => setActiveTab('pantry')}
            className="text-sm font-semibold text-[#b72301] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 md:mx-0 md:px-0">
          {/* Card 1: Spinach */}
          <div
            onClick={() => setActiveTab('pantry')}
            className="bg-white rounded-2xl p-4 min-w-[200px] shrink-0 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e3e2df] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#ba1a1a]"></div>
            <div className="pl-2 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-[#1b1c1a]">Spinach</h3>
                <p className="text-xs text-[#5b403a] mt-0.5">Produce Drawer</p>
              </div>
              <span className="material-symbols-outlined text-[#ba1a1a] fill text-xl">
                warning
              </span>
            </div>
            <div className="pl-2 mt-auto">
              <span className="inline-block bg-[#ffdad6] text-[#93000a] text-xs px-2.5 py-1 rounded-full font-bold">
                1 day left
              </span>
            </div>
          </div>

          {/* Card 2: Heavy Cream */}
          <div
            onClick={() => setActiveTab('pantry')}
            className="bg-white rounded-2xl p-4 min-w-[200px] shrink-0 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e3e2df] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#835400]"></div>
            <div className="pl-2 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-[#1b1c1a]">Heavy Cream</h3>
                <p className="text-xs text-[#5b403a] mt-0.5">Top Shelf</p>
              </div>
              <span className="material-symbols-outlined text-[#835400] fill text-xl">
                schedule
              </span>
            </div>
            <div className="pl-2 mt-auto">
              <span className="inline-block bg-[#ffddb5] text-[#3d2500] text-xs px-2.5 py-1 rounded-full font-bold">
                2 days left
              </span>
            </div>
          </div>

          {/* Card 3: Avocados */}
          <div
            onClick={() => setActiveTab('pantry')}
            className="bg-white rounded-2xl p-4 min-w-[200px] shrink-0 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e3e2df] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#2c694e]"></div>
            <div className="pl-2 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-[#1b1c1a]">Avocados</h3>
                <p className="text-xs text-[#5b403a] mt-0.5">Countertop</p>
              </div>
              <span className="material-symbols-outlined text-[#2c694e] fill text-xl">
                eco
              </span>
            </div>
            <div className="pl-2 mt-auto">
              <span className="inline-block bg-[#aeeecb] text-[#316e52] text-xs px-2.5 py-1 rounded-full font-bold">
                Ripe now
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Summary */}
      <section className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-headline font-bold text-[#1b1c1a]">Inventory</h2>
          <button
            onClick={() => setActiveTab('recipes')}
            className="text-xs px-3 py-1.5 rounded-full bg-[#ff5733]/10 text-[#b72301] font-bold hover:bg-[#ff5733]/20 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>What Can I Cook?</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Produce */}
          <div
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Produce');
              setActiveTab('pantry');
            }}
            className="bg-[#f4f4f0] rounded-[24px] p-4 flex flex-col gap-2 hover:bg-[#e9e8e4] cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#aeeecb] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#316e52]">nutrition</span>
            </div>
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1b1c1a]">Produce</h3>
              <p className="text-xs text-[#5b403a] mt-0.5">
                {getCategoryCount('Produce') || 12} Items
              </p>
            </div>
          </div>

          {/* Dairy */}
          <div
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Dairy');
              setActiveTab('pantry');
            }}
            className="bg-[#f4f4f0] rounded-[24px] p-4 flex flex-col gap-2 hover:bg-[#e9e8e4] cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#ffddb5]/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#835400]">egg</span>
            </div>
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1b1c1a]">Dairy</h3>
              <p className="text-xs text-[#5b403a] mt-0.5">
                {getCategoryCount('Dairy') || 8} Items
              </p>
            </div>
          </div>

          {/* Pantry */}
          <div
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Pantry');
              setActiveTab('pantry');
            }}
            className="bg-[#f4f4f0] rounded-[24px] p-4 flex flex-col gap-2 hover:bg-[#e9e8e4] cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#e4beb6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5b403a]">kitchen</span>
            </div>
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1b1c1a]">Pantry</h3>
              <p className="text-xs text-[#5b403a] mt-0.5">
                {getCategoryCount('Pantry') || 45} Items
              </p>
            </div>
          </div>

          {/* Protein */}
          <div
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Protein');
              setActiveTab('pantry');
            }}
            className="bg-[#f4f4f0] rounded-[24px] p-4 flex flex-col gap-2 hover:bg-[#e9e8e4] cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#93000a]">set_meal</span>
            </div>
            <div className="mt-2">
              <h3 className="text-base font-bold text-[#1b1c1a]">Protein</h3>
              <p className="text-xs text-[#5b403a] mt-0.5">
                {getCategoryCount('Protein') || 5} Items
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Quick Dish Quick Launch */}
      <section className="mt-2 p-5 rounded-3xl bg-white border border-[#e4beb6]/30 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTfIJJ_89WDqvwNuXO6v6osXcwEtyYeD2RjrBWE3GCr4ZXkfMjwhW8Pbg-SVMWxtRhgEWPljAhOYb4sQZnpXT3ODb2Xvi1r0Wk82TcZYHnQ9YlnwKVyrioH2-yGwv0OeeuL7WzOPVpjQbf2xUFWrZasi9Cso0VZfUvZQmKglaJ1z17JzuZ1pyoLccxMGhaL58fJ2lv8ccOr7ex21hhJ2zXQOKlU2XEGx6z_BuFofKZuMJwj75r2ol1Dg"
              alt="Creamy Spinach Pasta"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#aeeecb] text-[#316e52] text-[10px] font-bold px-2 py-0.5 rounded-full">
                100% Match
              </span>
              <span className="text-xs text-[#5b403a]">15 min • 450 kcal</span>
            </div>
            <h3 className="font-bold text-[#1b1c1a] text-base">Creamy Spinach Pasta</h3>
            <p className="text-xs text-[#835400] font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Uses 2 items expiring today</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('recipes')}
          className="w-full md:w-auto px-5 py-2.5 bg-[#b72301] text-white rounded-xl text-xs font-bold hover:bg-[#b72301]/90 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          View Recipe
        </button>
      </section>
    </div>
  );
};
