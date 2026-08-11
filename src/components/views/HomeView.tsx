import React from 'react';
import { ActiveTab, PantryItem } from '../../types';
import { ENDPOINTS } from '../../apiConfig';
import { mapDetectedToPantryItem } from '../../utils/scanHelper';

interface HomeViewProps {
  pantryItems: PantryItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onScanComplete?: (newItems: PantryItem[]) => void;
  onSelectCategory?: (category: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  pantryItems,
  setActiveTab,
  onScanComplete,
  onSelectCategory,
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter expiring items
  const expiringItems = pantryItems.filter(
    item => item.daysLeft <= 2 || item.status === 'critical' || item.status === 'warning'
  );

  // Counts by category
  const getCategoryCount = (categoryName: string) => {
    return pantryItems.filter(item => item.category === categoryName).length;
  };

  // Handle direct image file upload from Home page
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(ENDPOINTS.SCAN_IMAGE, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.items && data.items.length > 0) {
        const mapped = data.items.map((item: any, i: number) => mapDetectedToPantryItem(item, i));
        if (onScanComplete) {
          onScanComplete(mapped);
        } else {
          setActiveTab('scanned-review');
        }
      } else {
        alert(data.message || 'No food items detected in uploaded photo. Please try a clearer fridge image.');
      }
    } catch (err) {
      console.error('Upload scan error:', err);
      alert('Could not connect to scan service. Make sure the backend server is running on port 8000.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Header Section */}
      <section className="pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-[#1b1c1a] tracking-tight">
            What's in your kitchen today, Alex?
          </h1>
          <p className="text-sm text-[#5b403a] mt-1">
            Detect ingredients using AI image upload or live camera scan
          </p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-[#e9e8e4] md:hidden">
          <img
            alt="Profile Picture"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-E1KDH0Qwjjqsrov1GwcZHYm9Qcj11BVf8Pdun-Jhj7_mHInjROGrEwDWBnrSGY317iy06QHE44hnzTRw-IOf1gwLKiM504-hOk5dCC0laon_tJkj_YLGg4FJFPs0D1q9Ji3G4aVXL87BEexmodxaEeC5zKVoygJCVm_ME_MFNPlpROGjVfTKnk_gVvNf8gN6Nw-UdlzMw5rb1WvTmPaZ4xGhQG-Pw2aL7Qlxj_kUl8nYQdDrUzBP1g"
          />
        </div>
      </section>

      {/* Main Action Area: 2 Separate Buttons */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Button 1: Upload Inside Fridge Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gradient-to-br from-[#b72301] to-[#801800] text-white rounded-2xl p-5 flex flex-col items-start justify-between gap-4 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer border border-[#b72301]/30 group text-left relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl">
                {isUploading ? 'progress_activity' : 'cloud_upload'}
              </span>
            </div>
            <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold backdrop-blur-md">
              Instant AI
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold font-headline leading-tight group-hover:underline">
              {isUploading ? 'Analyzing AI...' : 'Upload Fridge Photo'}
            </h3>
            <p className="text-xs text-white/80 mt-1">
              Upload an inside fridge photo to detect all food & produce
            </p>
          </div>
        </button>

        {/* Button 2: Live Camera Scan */}
        <button
          onClick={() => setActiveTab('scanner')}
          className="bg-white dark:bg-[#2f312e] text-[#1b1c1a] dark:text-white rounded-2xl p-5 flex flex-col items-start justify-between gap-4 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer border border-[#e4beb6]/40 group text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-12 h-12 rounded-xl bg-[#2c694e]/10 text-[#2c694e] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">videocam</span>
            </div>
            <span className="bg-[#2c694e]/15 text-[#2c694e] text-xs px-2.5 py-1 rounded-full font-bold">
              Real-time
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold font-headline leading-tight group-hover:underline text-[#1b1c1a] dark:text-white">
              Live Camera Scan
            </h3>
            <p className="text-xs text-[#5b403a] dark:text-[#e3e2df] mt-1">
              Use live camera view for continuous food item detection
            </p>
          </div>
        </button>
      </section>

      {/* Use First Banner (Expiry Alerts) — dynamic from pantryItems */}
      {expiringItems.length > 0 ? (
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
            {expiringItems.slice(0, 5).map(item => {
              const isRed = item.status === 'critical' || item.daysLeft <= 1;
              const barColor = isRed ? 'bg-[#ba1a1a]' : 'bg-[#835400]';
              const iconName = isRed ? 'warning' : 'schedule';
              const iconColor = isRed ? 'text-[#ba1a1a]' : 'text-[#835400]';
              const badgeBg = isRed ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#ffddb5] text-[#3d2500]';
              const badgeText = item.daysLeft <= 0 ? 'Expired' : item.daysLeft === 1 ? '1 day left' : `${item.daysLeft} days left`;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab('pantry')}
                  className="bg-white rounded-2xl p-4 min-w-[200px] shrink-0 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] border border-[#e3e2df] flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${barColor}`}></div>
                  <div className="pl-2 flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-[#1b1c1a]">{item.name}</h3>
                      <p className="text-xs text-[#5b403a] mt-0.5">{item.location || item.category}</p>
                    </div>
                    <span className={`material-symbols-outlined ${iconColor} fill text-xl`}>
                      {iconName}
                    </span>
                  </div>
                  <div className="pl-2 mt-auto">
                    <span className={`inline-block ${badgeBg} text-xs px-2.5 py-1 rounded-full font-bold`}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-2 p-6 rounded-3xl bg-white border border-[#e4beb6]/20 shadow-sm text-center">
          <span className="material-symbols-outlined text-5xl text-[#dbdad6] mb-2">kitchen</span>
          <h2 className="font-headline font-bold text-lg text-[#1b1c1a]">Your kitchen is empty</h2>
          <p className="text-sm text-[#5b403a] mt-1">Scan your fridge to get started with AI-powered food tracking</p>
        </section>
      )}

      {/* Inventory Summary — dynamic counts */}
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
                {getCategoryCount('Produce')} Items
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
                {getCategoryCount('Dairy')} Items
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
                {getCategoryCount('Pantry')} Items
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
                {getCategoryCount('Protein')} Items
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action — Scan or Cook */}
      <section className="mt-2 p-5 rounded-3xl bg-white border border-[#e4beb6]/30 shadow-[0_4px_20px_0_rgba(183,35,1,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b72301]/10 to-[#ff5733]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#b72301] text-3xl">auto_awesome</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#aeeecb] text-[#316e52] text-[10px] font-bold px-2 py-0.5 rounded-full">
                AI Powered
              </span>
              <span className="text-xs text-[#5b403a]">
                {pantryItems.length > 0 ? `${pantryItems.length} ingredients available` : 'No ingredients yet'}
              </span>
            </div>
            <h3 className="font-bold text-[#1b1c1a] text-base">
              {pantryItems.length > 0 ? 'Generate AI Recipes' : 'Scan Your Kitchen'}
            </h3>
            <p className="text-xs text-[#835400] font-medium mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                {pantryItems.length > 0 ? 'restaurant_menu' : 'photo_camera'}
              </span>
              <span>
                {pantryItems.length > 0
                  ? `Cook with what you have`
                  : 'Point your camera at your fridge'}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab(pantryItems.length > 0 ? 'recipes' : 'scanner')}
          className="w-full md:w-auto px-5 py-2.5 bg-[#b72301] text-white rounded-xl text-xs font-bold hover:bg-[#b72301]/90 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          {pantryItems.length > 0 ? 'View Recipes' : 'Start Scanning'}
        </button>
      </section>
    </div>
  );
};
