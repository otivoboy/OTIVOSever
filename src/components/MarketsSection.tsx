import React, { useState } from 'react';
import { MarketSymbolInfo } from '../types/index.js';
import { ChevronRight, PlusCircle, Layers } from 'lucide-react';

interface MarketsSectionProps {
  markets: MarketSymbolInfo[];
  catalogueOptions: MarketSymbolInfo[];
  onConfigureSlot: (slotNumber: 1 | 2, symbol: string) => Promise<void>;
  onSelectMarket?: (symbol: string) => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({
  markets,
  catalogueOptions,
  onConfigureSlot,
  onSelectMarket
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [configuringSlot, setConfiguringSlot] = useState<1 | 2 | null>(null);
  const [selectedCatalogueSym, setSelectedCatalogueSym] = useState('');

  const filterTabs = [
    'All',
    'Volatility 10',
    'Volatility 15',
    'Volatility 25',
    'Volatility 30',
    'Volatility 50',
    'Volatility 75',
    'Volatility 90',
    'Volatility 100',
    'Custom'
  ];

  const standard8 = markets.filter(m => m.isStandard8);
  const customSlots = markets.filter(m => m.isConfigurableSlot);
  const slot1 = customSlots[0];
  const slot2 = customSlots[1];

  const filteredMarkets = standard8.filter(m => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Custom') return false;
    return m.displayName.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const renderSparkline = (prices?: number[]) => {
    const pts = prices && prices.length >= 2 ? prices : [2340, 2345, 2342, 2348, 2344, 2352, 2349, 2356];
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const width = 120;
    const height = 24;
    const coordinates = pts.map((p, idx) => {
      const x = (idx / (pts.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-6 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="#00e676"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coordinates}
        />
      </svg>
    );
  };

  const handleSaveSlot = async (slotNum: 1 | 2) => {
    if (!selectedCatalogueSym) return;
    await onConfigureSlot(slotNum, selectedCatalogueSym);
    setConfiguringSlot(null);
    setSelectedCatalogueSym('');
  };

  return (
    <div className="space-y-3">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span>Markets</span>
          <span className="text-xs font-normal text-[#5f8197]">(8 Volatility 1s + 2 Additional Slots)</span>
        </h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab
                ? 'bg-[#00e676] text-[#071118] font-bold shadow-sm shadow-[#00e676]/20'
                : 'bg-[#0b1620] text-[#7392a7] hover:text-white hover:bg-[#122230] border border-[#162734]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Standard 8 Markets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {filteredMarkets.map((market) => (
          <div
            key={market.symbol}
            onClick={() => onSelectMarket?.(market.symbol)}
            className="p-3 rounded-xl bg-[#0a141d] border border-[#132431] hover:border-[#1d384c] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{market.displayName.replace(' Index', '')}</span>
                      <ChevronRight className="w-3 h-3 text-[#496b80] group-hover:text-[#00e676] transition-colors" />
                    </div>
                    <div className="text-[10px] text-[#55768c] font-mono leading-none">
                      {market.symbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#00e676] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]"></span>
                  <span>Online</span>
                </div>
              </div>

              {/* Price and Last Digit */}
              <div className="mt-2.5 flex items-baseline justify-between">
                <div className="text-sm font-extrabold font-mono text-white tracking-tight">
                  {market.currentPrice ? market.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: market.pipSize || 2 }) : '2,345.67'}
                </div>
                <div className="text-[10px] text-[#6d8b9f]">
                  Last Digit: <span className="font-mono font-bold text-[#00e676]">{market.lastDigit !== undefined ? market.lastDigit : 7}</span>
                </div>
              </div>

              {/* Sparkline Wave */}
              <div className="my-1.5 opacity-90">
                {renderSparkline(market.priceHistory)}
              </div>
            </div>

            {/* Bottom Chips */}
            <div className="flex items-center gap-1 pt-1 border-t border-[#122230] text-[9px] font-mono text-[#69889d] overflow-x-hidden">
              <span className="px-1 py-0.5 rounded bg-[#071118] border border-[#162938]">Rise/Fall</span>
              <span className="px-1 py-0.5 rounded bg-[#071118] border border-[#162938]">HL</span>
              <span className="px-1 py-0.5 rounded bg-[#071118] border border-[#162938]">Touch</span>
              <span className="px-1 py-0.5 rounded bg-[#071118] border border-[#162938]">Ends</span>
              <span className="px-1 py-0.5 rounded bg-[#071118] border border-[#162938]">Digit</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Custom Market 9, Custom Market 10, Add More Markets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Custom Market 9 */}
        <div className="p-3 rounded-xl bg-[#0a141d]/80 border border-[#132431] flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full border border-dashed border-[#345266] flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#345266]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Custom Market 9</div>
              <div className="text-[11px] text-[#55768c]">
                {slot1 ? `${slot1.displayName} (${slot1.symbol})` : 'Not Configured'}
              </div>
              <div className="text-[10px] text-[#426074] mt-0.5">
                {slot1 ? `$${slot1.currentPrice?.toFixed(2)}` : 'Select from Deriv catalogue'}
              </div>
            </div>
          </div>
          <div className="mt-3">
            {configuringSlot === 1 ? (
              <div className="space-y-2">
                <select
                  value={selectedCatalogueSym}
                  onChange={(e) => setSelectedCatalogueSym(e.target.value)}
                  className="w-full text-xs bg-[#071118] border border-[#193040] rounded p-1.5 text-white"
                >
                  <option value="">Select Symbol...</option>
                  {catalogueOptions.map(c => (
                    <option key={c.symbol} value={c.symbol}>{c.displayName} ({c.symbol})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSlot(1)}
                    disabled={!selectedCatalogueSym}
                    className="flex-1 py-1 text-[11px] font-bold rounded bg-[#00e676] text-[#071118] cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfiguringSlot(null)}
                    className="py-1 px-2 text-[11px] rounded bg-[#162734] text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfiguringSlot(1)}
                className="w-full py-1.5 rounded-lg bg-[#071118] hover:bg-[#122230] border border-[#182e3e] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Configure
              </button>
            )}
          </div>
        </div>

        {/* Custom Market 10 */}
        <div className="p-3 rounded-xl bg-[#0a141d]/80 border border-[#132431] flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full border border-dashed border-[#345266] flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#345266]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Custom Market 10</div>
              <div className="text-[11px] text-[#55768c]">
                {slot2 ? `${slot2.displayName} (${slot2.symbol})` : 'Not Configured'}
              </div>
              <div className="text-[10px] text-[#426074] mt-0.5">
                {slot2 ? `$${slot2.currentPrice?.toFixed(2)}` : 'Select from Deriv catalogue'}
              </div>
            </div>
          </div>
          <div className="mt-3">
            {configuringSlot === 2 ? (
              <div className="space-y-2">
                <select
                  value={selectedCatalogueSym}
                  onChange={(e) => setSelectedCatalogueSym(e.target.value)}
                  className="w-full text-xs bg-[#071118] border border-[#193040] rounded p-1.5 text-white"
                >
                  <option value="">Select Symbol...</option>
                  {catalogueOptions.map(c => (
                    <option key={c.symbol} value={c.symbol}>{c.displayName} ({c.symbol})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSlot(2)}
                    disabled={!selectedCatalogueSym}
                    className="flex-1 py-1 text-[11px] font-bold rounded bg-[#00e676] text-[#071118] cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfiguringSlot(null)}
                    className="py-1 px-2 text-[11px] rounded bg-[#162734] text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfiguringSlot(2)}
                className="w-full py-1.5 rounded-lg bg-[#071118] hover:bg-[#122230] border border-[#182e3e] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Configure
              </button>
            )}
          </div>
        </div>

        {/* Add More Markets Wide Card */}
        <div 
          onClick={() => setConfiguringSlot(1)}
          className="p-3 rounded-xl bg-[#0a141d]/80 border border-dashed border-[#182e3e] hover:border-[#00e676]/40 flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#00e676]">
            <PlusCircle className="w-4 h-4" />
            <span>Add More Markets</span>
          </div>
          <div className="text-[11px] text-[#55768c] mt-1">
            Choose from Deriv's live catalogue
          </div>
        </div>
      </div>
    </div>
  );
};
