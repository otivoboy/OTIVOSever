import React, { useState } from 'react';
import { MarketSymbolInfo, BotRecord, ContractSpecification } from '../types/index.js';
import { ChevronRight, Settings, CheckCircle } from 'lucide-react';

interface MarketGridProps {
  markets: MarketSymbolInfo[];
  catalogueOptions: MarketSymbolInfo[];
  bots: BotRecord[];
  contracts: ContractSpecification[];
  onConfigureSlot: (slotNumber: 1 | 2, symbol: string) => Promise<void>;
  onSelectMarketForBot?: (symbol: string) => void;
}

export const MarketGrid: React.FC<MarketGridProps> = ({
  markets,
  catalogueOptions,
  bots,
  onConfigureSlot,
  onSelectMarketForBot
}) => {
  const [configuringSlot, setConfiguringSlot] = useState<1 | 2 | null>(null);
  const [selectedCatalogueSym, setSelectedCatalogueSym] = useState('');

  // Extract standard 8 Volatility 1s markets
  const standard8 = markets.filter(m => m.isStandard8);

  // Extract configurable slots 9 and 10
  const extraSlots = markets.filter(m => m.isConfigurableSlot);
  const slot1 = extraSlots[0];
  const slot2 = extraSlots[1];

  const handleSaveSlot = async (slotNum: 1 | 2) => {
    if (!selectedCatalogueSym) return;
    await onConfigureSlot(slotNum, selectedCatalogueSym);
    setConfiguringSlot(null);
    setSelectedCatalogueSym('');
  };

  // Helper to render mini SVG sparkline
  const renderSparkline = (prices?: number[]) => {
    if (!prices || prices.length < 2) {
      return (
        <div className="h-9 flex items-center justify-center text-[10px] text-neutral-600 font-mono">
          Accumulating ticks...
        </div>
      );
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 160;
    const height = 36;
    const points = prices.map((p, idx) => {
      const x = (idx / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] >= prices[0];
    const strokeColor = isUp ? '#10b981' : '#f43f5e';

    return (
      <svg className="w-full h-9 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Deriv Synthetic Indices (8 Standard 1-Second Indices + 2 Verified Slots)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time WebSocket tick stream, live last-digit extraction, and contract compatibility registry.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live Feed Active</span>
          </div>
          <span aria-hidden="true">|</span>
          <span>1 Tick / Sec Frequency</span>
        </div>
      </div>

      {/* Grid of 10 Cards (Standard 8 + 2 Configurable Slots) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {standard8.map((market) => {
          const activeBotsCount = bots.filter(
            b => b.status === 'RUNNING' && b.selectedMarkets.includes(market.symbol)
          ).length;
          const assignedBots = bots.filter(b => b.selectedMarkets.includes(market.symbol));
          const completedTrades = assignedBots.reduce(
            (acc, b) => acc + b.currentTradeSession.totalTrades, 0
          );

          return (
            <div
              key={market.symbol}
              className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                        {market.symbol}
                      </span>
                      <span className="text-xs text-neutral-400">1s Volatility</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {market.displayName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-neutral-400">Eligible</span>
                  </div>
                </div>

                {/* Price and Last Digit */}
                <div className="my-3 py-2 px-3 rounded-lg bg-neutral-950/80 border border-neutral-800/70 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">Live Spot Price</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-white">
                      {market.currentPrice !== undefined
                        ? market.currentPrice.toFixed(market.pipSize)
                        : 'Connecting...'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase">Last Digit</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                      {market.lastDigit !== undefined ? market.lastDigit : '-'}
                    </div>
                  </div>
                </div>

                {/* Live Sparkline */}
                <div className="my-2">
                  {renderSparkline(market.priceHistory)}
                </div>

                {/* 10-Digit Frequency Mini-Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                    <span>Digit Frequency (0-9)</span>
                    <span className="font-mono">Last 50 ticks</span>
                  </div>
                  <div className="grid grid-cols-10 gap-0.5 h-5 bg-neutral-950 rounded p-0.5 border border-neutral-900">
                    {(market.digitFrequency || new Array(10).fill(0)).map((cnt, d) => {
                      const maxFreq = Math.max(1, ...(market.digitFrequency || [1]));
                      const heightPct = Math.min(100, Math.max(15, (cnt / maxFreq) * 100));
                      const isLast = market.lastDigit === d;
                      return (
                        <div
                          key={d}
                          title={`Digit ${d}: ${cnt} occurrences`}
                          className="h-full flex flex-col justify-end items-center group relative"
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-xs transition-all ${
                              isLast
                                ? 'bg-emerald-400'
                                : cnt > 0
                                ? 'bg-neutral-600 group-hover:bg-neutral-400'
                                : 'bg-neutral-800'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata details */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-1.5 text-xs text-neutral-400">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Active Strategy:</span>
                    <span className="text-neutral-300 font-medium truncate max-w-[150px]">
                      {assignedBots[0]?.strategy.name || 'None Assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Trading Status:</span>
                    <span className={activeBotsCount > 0 ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>
                      {activeBotsCount > 0 ? `${activeBotsCount} Bot Running` : 'Idle / Standby'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Completed Trades:</span>
                    <span className="font-mono tabular-nums text-neutral-300">{completedTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Allowed Durations:</span>
                    <span className="font-mono tabular-nums text-neutral-300">1 - 10 Ticks (1s - 24h)</span>
                  </div>
                </div>
              </div>

              {onSelectMarketForBot && (
                <button
                  onClick={() => onSelectMarketForBot(market.symbol)}
                  className="mt-4 w-full py-1.5 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Build Bot on {market.symbol}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Slot 9: Configurable Slot 1 */}
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                SLOT 9
              </span>
              <span className="text-[11px] text-neutral-400">
                {slot1 ? 'Verified Symbol' : 'Unconfigured'}
              </span>
            </div>
            {slot1 ? (
              <div>
                <h3 className="text-sm font-semibold text-white mt-1">
                  {slot1.displayName}
                </h3>
                <div className="my-3 py-2 px-3 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">Live Spot Price</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-white">
                      {slot1.currentPrice?.toFixed(slot1.pipSize) || 'Pending'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase">Last Digit</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                      {slot1.lastDigit ?? '-'}
                    </div>
                  </div>
                </div>
                <div className="my-2">{renderSparkline(slot1.priceHistory)}</div>
              </div>
            ) : (
              <div className="my-6 text-center py-4">
                <Settings className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-neutral-300">Configurable Slot 9</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-[200px] mx-auto">
                  Populate from official Deriv active-symbol catalogue.
                </p>
              </div>
            )}
          </div>

          <div>
            {configuringSlot === 1 ? (
              <div className="space-y-2 mt-3 pt-3 border-t border-neutral-800">
                <select
                  value={selectedCatalogueSym}
                  onChange={(e) => setSelectedCatalogueSym(e.target.value)}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                >
                  <option value="">Select Verified Symbol...</option>
                  {catalogueOptions.map(c => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.displayName} ({c.symbol})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSlot(1)}
                    disabled={!selectedCatalogueSym}
                    className="flex-1 py-1 px-2 text-xs font-semibold rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 disabled:opacity-50 cursor-pointer"
                  >
                    Verify & Mount
                  </button>
                  <button
                    onClick={() => setConfiguringSlot(null)}
                    className="py-1 px-2 text-xs rounded bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfiguringSlot(1)}
                className="w-full mt-3 py-1.5 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              >
                {slot1 ? 'Reconfigure Slot 9' : 'Configure Slot 9 from Catalogue'}
              </button>
            )}
          </div>
        </div>

        {/* Slot 10: Configurable Slot 2 */}
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                SLOT 10
              </span>
              <span className="text-[11px] text-neutral-400">
                {slot2 ? 'Verified Symbol' : 'Unconfigured'}
              </span>
            </div>
            {slot2 ? (
              <div>
                <h3 className="text-sm font-semibold text-white mt-1">
                  {slot2.displayName}
                </h3>
                <div className="my-3 py-2 px-3 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">Live Spot Price</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-white">
                      {slot2.currentPrice?.toFixed(slot2.pipSize) || 'Pending'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase">Last Digit</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                      {slot2.lastDigit ?? '-'}
                    </div>
                  </div>
                </div>
                <div className="my-2">{renderSparkline(slot2.priceHistory)}</div>
              </div>
            ) : (
              <div className="my-6 text-center py-4">
                <Settings className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-neutral-300">Configurable Slot 10</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-[200px] mx-auto">
                  Populate from official Deriv active-symbol catalogue.
                </p>
              </div>
            )}
          </div>

          <div>
            {configuringSlot === 2 ? (
              <div className="space-y-2 mt-3 pt-3 border-t border-neutral-800">
                <select
                  value={selectedCatalogueSym}
                  onChange={(e) => setSelectedCatalogueSym(e.target.value)}
                  className="w-full text-xs bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white"
                >
                  <option value="">Select Verified Symbol...</option>
                  {catalogueOptions.map(c => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.displayName} ({c.symbol})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSlot(2)}
                    disabled={!selectedCatalogueSym}
                    className="flex-1 py-1 px-2 text-xs font-semibold rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 disabled:opacity-50 cursor-pointer"
                  >
                    Verify & Mount
                  </button>
                  <button
                    onClick={() => setConfiguringSlot(null)}
                    className="py-1 px-2 text-xs rounded bg-neutral-800 text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfiguringSlot(2)}
                className="w-full mt-3 py-1.5 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              >
                {slot2 ? 'Reconfigure Slot 10' : 'Configure Slot 10 from Catalogue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
