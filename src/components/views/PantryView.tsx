import React, { useState } from 'react';
import { ActiveTab, PantryItem } from '../../types';

interface PantryViewProps {
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCategoryFilter?: string | null;
}

export const PantryView: React.FC<PantryViewProps> = ({
  pantryItems,
  setPantryItems,
  setActiveTab,
  selectedCategoryFilter,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(
    selectedCategoryFilter || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Produce' | 'Dairy' | 'Pantry' | 'Protein'>('Produce');
  const [quantity, setQuantity] = useState(1);
  const [daysLeft, setDaysLeft] = useState(3);

  const categories = ['All', 'Produce', 'Dairy', 'Pantry', 'Protein'];

  const filteredItems = pantryItems.filter(item => {
    const matchesCategory =
      activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleDelete = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: PantryItem = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      category,
      quantity,
      daysLeft,
      expiryText: daysLeft <= 2 ? `Use within ${daysLeft} days` : `Fresh (${daysLeft} days)`,
      freshnessPercent: Math.min(100, Math.max(10, daysLeft * 15)),
      status: daysLeft <= 1 ? 'critical' : daysLeft <= 2 ? 'warning' : 'fresh',
    };

    setPantryItems(prev => [newItem, ...prev]);
    setName('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      {/* Page Title & Add Button */}
      <section className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-[#1b1c1a]">
            Kitchen Inventory
          </h2>
          <p className="text-sm text-[#5b403a] mt-0.5">
            {pantryItems.length} total items stored
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className="px-3.5 py-2 bg-[#ff5733]/15 text-[#b72301] rounded-xl text-xs font-bold hover:bg-[#ff5733]/25 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span className="hidden sm:inline">Scan Fridge</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#2c694e] text-white rounded-xl text-xs font-bold hover:bg-[#2c694e]/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Item</span>
          </button>
        </div>
      </section>

      {/* Search & Category Filter Tabs */}
      <section className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b403a] text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ingredients in your pantry..."
            className="w-full bg-white border border-[#e4beb6]/50 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301] shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1b1c1a] text-white'
                  : 'bg-[#efeeea] text-[#5b403a] hover:bg-[#e3e2df]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Inventory Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const isAmber = item.daysLeft <= 2 || item.status === 'warning';
          const isRed = item.status === 'critical' || item.daysLeft <= 1;
          const barColor = isRed ? 'bg-[#ba1a1a]' : isAmber ? 'bg-[#835400]' : 'bg-[#2c694e]';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-[#e3e2df] shadow-sm flex items-center justify-between gap-3 relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`} />

              <div className="pl-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#efeeea] text-[#5b403a]">
                    {item.category}
                  </span>
                  {item.location && (
                    <span className="text-[11px] text-[#5b403a] truncate">
                      {item.location}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[#1b1c1a] text-base mt-1 truncate">
                  {item.name}
                </h3>

                <p className="text-xs text-[#835400] font-medium mt-0.5">
                  {item.expiryText}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-[#f4f4f0] rounded-lg border border-[#e4beb6]/50 h-8">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="px-2 h-full text-[#5b403a] hover:bg-[#e3e2df] rounded-l-lg cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-[#1b1c1a]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="px-2 h-full text-[#5b403a] hover:bg-[#e3e2df] rounded-r-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-[#5b403a] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Add Item Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#faf9f5] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#e4beb6]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e3e2df] pb-3">
              <h3 className="text-lg font-headline font-bold text-[#1b1c1a]">
                Add Ingredient to Pantry
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#5b403a] hover:text-[#1b1c1a] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-[#5b403a] uppercase block mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Cherry Tomatoes, Cheddar Cheese..."
                  className="w-full bg-white border border-[#e4beb6]/50 rounded-xl px-3.5 py-2 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5b403a] uppercase block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-white border border-[#e4beb6]/50 rounded-xl px-3.5 py-2 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301]"
                >
                  <option value="Produce">Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Protein">Protein</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#5b403a] uppercase block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-[#e4beb6]/50 rounded-xl px-3.5 py-2 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5b403a] uppercase block mb-1">
                    Days Left
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={daysLeft}
                    onChange={e => setDaysLeft(Number(e.target.value))}
                    className="w-full bg-white border border-[#e4beb6]/50 rounded-xl px-3.5 py-2 text-sm text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#b72301]"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#efeeea] text-[#5b403a] rounded-xl text-xs font-bold hover:bg-[#e3e2df] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b72301] text-white rounded-xl text-xs font-bold hover:bg-[#b72301]/90 cursor-pointer shadow-sm"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
