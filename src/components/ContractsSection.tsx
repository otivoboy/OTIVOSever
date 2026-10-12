import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Disc,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Play,
  Square,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingDown as TrendingDownIcon,
  Percent,
  Target,
  ShieldAlert
} from 'lucide-react';
import { MarketSymbolInfo } from '../types/index.js';

interface ContractsSectionProps {
  onSelectContract?: (type: string) => void;
  onRunBotWithContract?: (params: {
    contractType: string;
    subtypes: string[];
    market: string;
    stake: number;
    barrierDigit?: number;
    growthRate?: number;
    limitOrder?: number;
    martingaleMultiplier?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => Promise<void>;
  onStopBot?: () => void;
  isRunning?: boolean;
  markets?: MarketSymbolInfo[];
}

export const ContractsSection: React.FC<ContractsSectionProps> = ({
  onSelectContract,
  onRunBotWithContract,
  onStopBot,
  isRunning = false,
  markets = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeContractId, setActiveContractId] = useState('CALL');

  // Contract specific inputs
  const [barrierDigit, setBarrierDigit] = useState<number>(7);
  const [growthRate, setGrowthRate] = useState<number>(2); // 1-5%
  const [limitOrderTicks, setLimitOrderTicks] = useState<number>(10);
  const [selectedMarket, setSelectedMarket] = useState<string>('1HZ50V');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  // Risk, Martingale, TP and SL inputs
  const [stake, setStake] = useState<number>(2.0);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState<number>(2.0);
  const [takeProfit, setTakeProfit] = useState<number>(10.0);
  const [stopLoss, setStopLoss] = useState<number>(20.0);

  const categories = [
    'All',
    'Rise/Fall',
    'Digit Contracts',
    'Accumulator',
    'Touch/No Touch',
    'Higher/Lower'
  ];

  const contractTiles = [
    { id: 'CALL', label: 'Rise', family: 'RISE_FALL', subtypes: ['CALL'], icon: TrendingUp, cat: 'Rise/Fall', requiresBarrier: false },
    { id: 'PUT', label: 'Fall', family: 'RISE_FALL', subtypes: ['PUT'], icon: TrendingDown, cat: 'Rise/Fall', requiresBarrier: false },
    { id: 'DIGITDIFF', label: 'Differs', family: 'DIGITS', subtypes: ['DIGITDIFF'], icon: Disc, cat: 'Digit Contracts', requiresBarrier: true },
    { id: 'DIGITOVER', label: 'Over', family: 'DIGITS', subtypes: ['DIGITOVER'], icon: ArrowUpRight, cat: 'Digit Contracts', requiresBarrier: true },
    { id: 'DIGITUNDER', label: 'Under', family: 'DIGITS', subtypes: ['DIGITUNDER'], icon: ArrowDownRight, cat: 'Digit Contracts', requiresBarrier: true },
    { id: 'DIGITODD', label: 'Odd', family: 'DIGITS', subtypes: ['DIGITODD'], icon: Disc, cat: 'Digit Contracts', requiresBarrier: false },
    { id: 'DIGITEVEN', label: 'Even', family: 'DIGITS', subtypes: ['DIGITEVEN'], icon: Disc, cat: 'Digit Contracts', requiresBarrier: false },
    { id: 'DIGITMATCH', label: 'Matches', family: 'DIGITS', subtypes: ['DIGITMATCH'], icon: Disc, cat: 'Digit Contracts', requiresBarrier: true },
    { id: 'ACCU', label: 'Accumulator', family: 'ACCUMULATORS', subtypes: ['ACCU'], icon: Zap, cat: 'Accumulator', requiresBarrier: false, isAccu: true },
    { id: 'NOTOUCH', label: 'No Touch', family: 'TOUCH_NO_TOUCH', subtypes: ['NOTOUCH'], icon: ShieldCheck, cat: 'Touch/No Touch', requiresBarrier: false },
    { id: 'HIGHER', label: 'Higher', family: 'HIGHER_LOWER', subtypes: ['HIGHER'], icon: ArrowUpRight, cat: 'Higher/Lower', requiresBarrier: false },
    { id: 'LOWER', label: 'Lower', family: 'HIGHER_LOWER', subtypes: ['LOWER'], icon: ArrowDownRight, cat: 'Higher/Lower', requiresBarrier: false }
  ];

  const filteredContracts = contractTiles.filter(c => {
    if (selectedCategory === 'All') return true;
    return c.cat === selectedCategory;
  });

  const activeTile = contractTiles.find(c => c.id === activeContractId) || contractTiles[0];

  const handleLaunch = async () => {
    if (!onRunBotWithContract) {
      onSelectContract?.(activeContractId);
      return;
    }
    setIsLaunching(true);
    try {
      await onRunBotWithContract({
        contractType: activeTile.family,
        subtypes: activeTile.subtypes,
        market: selectedMarket,
        stake,
        barrierDigit: activeTile.requiresBarrier ? barrierDigit : undefined,
        growthRate: activeTile.isAccu ? growthRate : undefined,
        limitOrder: activeTile.isAccu ? limitOrderTicks : undefined,
        martingaleMultiplier,
        takeProfit,
        stopLoss
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <span>Deriv Contract Execution Engine</span>
          <span className="text-[11px] font-normal text-[#5c7e94]">(Configure & Run)</span>
        </h3>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              TRADING ACTIVE
            </span>
          )}
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Selected: {activeTile.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Left Categories List */}
        <div className="sm:w-28 shrink-0 flex sm:flex-col gap-1 text-[11px] font-medium border-b sm:border-b-0 sm:border-r border-[#132431] pb-2 sm:pb-0 sm:pr-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-left px-2 py-1.5 rounded transition-colors whitespace-nowrap truncate cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-[#071118] font-bold'
                  : 'text-[#6d8d9f] hover:text-white hover:bg-[#101e2b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Tiles Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {filteredContracts.map(item => {
            const Icon = item.icon;
            const isSelected = activeContractId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveContractId(item.id);
                  onSelectContract?.(item.id);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between items-center text-center ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-[#071118] border-[#142634] text-[#8fa3b2] hover:border-emerald-500/30'
                }`}
              >
                <div className="w-full flex items-center justify-between">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-[#4f7084]'}`} />
                  {item.requiresBarrier && (
                    <span className="text-[8px] font-mono px-1 rounded bg-[#132431] text-amber-400">
                      0-9
                    </span>
                  )}
                  {item.isAccu && (
                    <span className="text-[8px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">
                      %
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold mt-2 truncate w-full">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Contract Parameter Configuration Box */}
      <div className="p-3.5 rounded-xl bg-[#071118] border border-[#142634] space-y-3">
        <div className="flex items-center justify-between border-b border-[#132431] pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {activeTile.label} Contract Parameters
            </span>
          </div>
          <span className="text-[10px] text-[#55768c]">
            Family: <strong className="text-neutral-300 font-mono">{activeTile.family}</strong>
          </span>
        </div>

        {/* 1. Differs & Over/Under: Barrier Digit Input 0-9 */}
        {activeTile.requiresBarrier && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>Barrier Digit Input (0 - 9)</span>
                <span className="text-[#55768c] font-normal text-[10px]">
                  {activeTile.id === 'DIGITDIFF' ? '- Win if last digit != barrier' : '- Over wins if > barrier, Under wins if < barrier'}
                </span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Current Barrier: {barrierDigit}
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => setBarrierDigit(digit)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    barrierDigit === digit
                      ? 'bg-emerald-500 text-[#071118] scale-105 shadow-md shadow-emerald-500/20'
                      : 'bg-[#0d1c26] text-neutral-300 hover:bg-[#152e3e] border border-[#142634]'
                  }`}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Rise/Fall & Even/Odd: Clarify No Barrier Needed */}
        {!activeTile.requiresBarrier && !activeTile.isAccu && (
          <div className="p-2.5 rounded-lg bg-[#0a1622] border border-[#142634] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#8aa2b2]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {activeTile.family === 'RISE_FALL'
                  ? 'No barrier required for Rise/Fall. Evaluates directional Exit Spot vs Entry Spot.'
                  : 'No barrier required for Even/Odd. Evaluates last tick parity (Even: 0,2,4,6,8 | Odd: 1,3,5,7,9).'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              ZERO BARRIER
            </span>
          </div>
        )}

        {/* 3. Accumulators: Growth Rate & Limit Order Inputs */}
        {activeTile.isAccu && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white flex items-center justify-between">
                <span>Growth Rate (%)</span>
                <span className="text-emerald-400 font-mono">{growthRate}%</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGrowthRate(rate)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      growthRate === rate
                        ? 'bg-emerald-500 text-[#071118]'
                        : 'bg-[#0d1c26] text-neutral-300 hover:bg-[#152e3e] border border-[#142634]'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white flex items-center justify-between">
                <span>Limit Order (Max Ticks Take-Profit)</span>
                <span className="text-emerald-400 font-mono">{limitOrderTicks} Ticks</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((ticks) => (
                  <button
                    key={ticks}
                    type="button"
                    onClick={() => setLimitOrderTicks(ticks)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      limitOrderTicks === ticks
                        ? 'bg-emerald-500 text-[#071118]'
                        : 'bg-[#0d1c26] text-neutral-300 hover:bg-[#152e3e] border border-[#142634]'
                    }`}
                  >
                    {ticks} T
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. MARTINGALE, TAKE PROFIT (TP), STOP LOSS (SL) CONFIGURATION STRIP */}
        <div className="p-3 rounded-lg bg-[#0a151f] border border-[#162938] space-y-2">
          <div className="text-[11px] font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Risk Strategy: Martingale & Profit Protections
            </span>
            <span className="text-[10px] text-[#55768c]">Auto Money Management</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Martingale Multiplier Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#7392a5] font-semibold uppercase flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-400" /> Martingale Factor
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{martingaleMultiplier}x</span>
              </div>
              <div className="space-y-1">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  value={martingaleMultiplier}
                  onChange={(e) => setMartingaleMultiplier(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                  className="w-full bg-[#071118] border border-[#142634] rounded-lg px-2 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                />
                <div className="flex gap-1">
                  {[1.0, 1.5, 2.0, 2.5].map((multiplier) => (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => setMartingaleMultiplier(multiplier)}
                      className={`flex-1 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer transition-all ${
                        martingaleMultiplier === multiplier
                          ? 'bg-emerald-500 text-[#071118]'
                          : 'bg-[#0d1c26] text-neutral-300 hover:bg-[#142a3a] border border-[#162734]'
                      }`}
                    >
                      {multiplier === 1.0 ? 'Off' : `${multiplier}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Take Profit (TP) Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#7392a5] font-semibold uppercase flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" /> Take Profit (TP)
                </label>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">+${takeProfit.toFixed(2)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-[#071118] border border-[#142634] rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                />
                <DollarSign className="w-3 h-3 text-emerald-500 absolute left-2 top-2" />
              </div>
            </div>

            {/* Stop Loss (SL) Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#7392a5] font-semibold uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Stop Loss (SL)
                </label>
                <span className="text-[10px] font-mono text-rose-400 font-bold">-${stopLoss.toFixed(2)}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-[#071118] border border-[#142634] rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-500 font-bold"
                />
                <DollarSign className="w-3 h-3 text-rose-500 absolute left-2 top-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Execution Strip: Market + Stake + Dynamic Run / Red Stop Button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#132431]">
          {/* Market Selection */}
          <div>
            <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
              Trading Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-[#0a141d] border border-[#142634] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            >
              {markets.length > 0 ? (
                markets.map(m => (
                  <option key={m.symbol} value={m.symbol}>
                    {m.symbol} ({m.displayName})
                  </option>
                ))
              ) : (
                <>
                  <option value="1HZ10V">1HZ10V - Volatility 10 (1s)</option>
                  <option value="1HZ50V">1HZ50V - Volatility 50 (1s)</option>
                  <option value="1HZ100V">1HZ100V - Volatility 100 (1s)</option>
                </>
              )}
            </select>
          </div>

          {/* Stake Input */}
          <div>
            <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
              Initial Stake ($ USD)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0.35"
                value={stake}
                onChange={(e) => setStake(Math.max(0.35, parseFloat(e.target.value) || 0.35))}
                className="w-full bg-[#0a141d] border border-[#142634] rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <DollarSign className="w-3.5 h-3.5 text-[#55768c] absolute left-2 top-2" />
            </div>
          </div>

          {/* Action: Run Bot or RED Stop Bot Button */}
          <div className="flex items-end">
            {isRunning ? (
              <button
                type="button"
                onClick={onStopBot}
                className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>STOP BOT (RUNNING)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isLaunching}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#071118] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#071118]" />
                <span>{isLaunching ? 'STARTING...' : `RUN BOT WITH ${activeTile.label.toUpperCase()}`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
