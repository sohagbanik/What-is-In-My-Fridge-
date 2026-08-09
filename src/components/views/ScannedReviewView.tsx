import React, { useState } from 'react';
import { ActiveTab, PantryItem } from '../../types';

interface ScannedReviewViewProps {
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ScannedReviewView: React.FC<ScannedReviewViewProps> = ({
  pantryItems,
  setPantryItems,
  setActiveTab,
}) => {
  const [prioritizeExpiring, setPrioritizeExpiring] = useState(true);
  const [newItemName, setNewItemName] = useState('');

  const handleQuantityChange = (id: string, delta: number) => {
    setPantryItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: PantryItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      category: 'Pantry',
      quantity: 1,
      daysLeft: 7,
      expiryText: 'Fresh (7 days)',
      freshnessPercent: 90,
      status: 'fresh',
      isScanned: true,
    };
    setPantryItems(prev => [newItem, ...prev]);
    setNewItemName('');
  };

  // Sort items if prioritizeExpiring is enabled
  const displayedItems = [...pantryItems].sort((a, b) => {
    if (prioritizeExpiring) {
      return a.daysLeft - b.daysLeft;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#faf9f5] pb-32">
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-[#faf9f5]/95 backdrop-blur-md z-40 border-b border-[#e4beb6]/30 py-4 px-4 md:px-6 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('scanner')}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#1b1c1a] hover:bg-[#f4f4f0] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline text-xl md:text-2xl font-bold text-[#1b1c1a] tracking-tight">
            Scanned Ingredients
          </h1>
          <p className="text-xs md:text-sm text-[#5b403a] mt-0.5 font-medium">
            {pantryItems.length} Items Found
          </p>
        </div>
      </header>

      <main className="pt-6 px-4 md:px-6 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Prioritize Expiring Toggle */}
        <div className="bg-white rounded-[20px] p-4 flex justify-between items-center shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e4beb6]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffdad6]/40 flex items-center justify-center text-[#835400]">
              <span className="material-symbols-outlined fill">warning</span>
            </div>
            <span className="font-semibold text-sm text-[#1b1c1a]">
              Prioritize Expiring Items
            </span>
          </div>
          <button
            onClick={() => setPrioritizeExpiring(!prioritizeExpiring)}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none cursor-pointer ${
              prioritizeExpiring ? 'bg-[#b72301]' : 'bg-[#dbdad6]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${
                prioritizeExpiring ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Quick Add Custom Item */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Add missing ingredient (e.g. Olive Oil)..."
            className="flex-1 bg-white border border-[#e4beb6]/50 rounded-xl px-4 py-2.5 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#2c694e] text-white rounded-xl text-xs font-bold hover:bg-[#2c694e]/90 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add</span>
          </button>
        </form>

        {/* List View: Scanned Ingredient Cards */}
        <div className="flex flex-col gap-3">
          {displayedItems.map(item => {
            const isAmber = item.daysLeft <= 2 || item.status === 'warning';
            const isRed = item.status === 'critical' || item.daysLeft <= 1;
            const barColor = isRed ? 'bg-[#ba1a1a]' : isAmber ? 'bg-[#835400]' : 'bg-[#2c694e]';
            const textColor = isRed ? 'text-[#ba1a1a]' : isAmber ? 'text-[#835400]' : 'text-[#2c694e]';

            return (
              <article
                key={item.id}
                className="bg-white rounded-[24px] shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] relative overflow-hidden flex flex-row items-center p-3 gap-4 border border-[#e4beb6]/20 transition-transform hover:-translate-y-0.5 duration-200"
              >
                {/* Status Indicator Bar on Left Edge */}
                <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${barColor}`} />

                {/* Item Thumbnail */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-[#f4f4f0] border border-[#e3e2df]/50 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5b403a]">
                      <span className="material-symbols-outlined text-3xl">
                        kitchen
                      </span>
                    </div>
                  )}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 flex flex-col py-1 pr-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-semibold text-base text-[#1b1c1a] truncate leading-tight">
                      {item.name}
                    </h3>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                      className="text-[#5b403a] hover:text-[#ba1a1a] transition-colors p-1 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>

                  {/* Freshness Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-[#e3e2df] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${barColor} h-full rounded-full transition-all`}
                        style={{ width: `${Math.max(10, item.freshnessPercent)}%` }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${textColor} mt-1`}>
                      {item.expiryText}
                    </p>
                  </div>

                  {/* Quantity Stepper Control */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-[#f4f4f0] rounded-lg border border-[#e4beb6]/50 h-8">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="px-2.5 h-full text-[#5b403a] hover:bg-[#e3e2df] transition-colors rounded-l-lg flex items-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          remove
                        </span>
                      </button>
                      <span className="text-xs font-bold w-7 text-center text-[#1b1c1a]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="px-2.5 h-full text-[#5b403a] hover:bg-[#e3e2df] transition-colors rounded-r-lg flex items-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          add
                        </span>
                      </button>
                    </div>

                    {item.unit && (
                      <span className="text-xs text-[#5b403a] font-medium px-2 py-0.5 bg-[#e3e2df]/50 rounded-md">
                        {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Footer CTA */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 backdrop-blur-lg border-t border-[#e4beb6]/20 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50 rounded-t-3xl">
        <div className="max-w-md mx-auto flex flex-col gap-2.5">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#faf9f5] to-[#ffdad3]/50 border border-[#ffdad3]">
              <span className="material-symbols-outlined text-[#b72301] text-[14px]">
                auto_awesome
              </span>
              <span className="text-xs text-[#b72301] font-bold">
                AI Chef Ready
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('recipes')}
            className="w-full bg-[#b72301] text-white h-14 rounded-[16px] flex items-center justify-center gap-2 shadow-md hover:bg-[#b72301]/90 active:scale-95 transition-all duration-200 cursor-pointer font-bold text-base font-headline"
          >
            <span className="material-symbols-outlined fill">restaurant_menu</span>
            <span>Generate Recipes ({pantryItems.length} Ingredients)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
