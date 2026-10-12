import React, { useState } from 'react';
import {
  DerivAccount,
  MarketSymbolInfo,
  ContractSpecification,
  BotRecord,
  StrategyType
} from '../types/index.js';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

interface BotWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: DerivAccount[];
  markets: MarketSymbolInfo[];
  contracts: ContractSpecification[];
  preselectedMarket?: string;
  onSaveAndDeploy: (botData: Partial<BotRecord>, deployImmediately: boolean) => Promise<void>;
}

export const BotWizardModal: React.FC<BotWizardModalProps> = ({
  isOpen,
  onClose,
  accounts,
  markets,
  preselectedMarket,
  onSaveAndDeploy
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state across 7 steps
  const [botName, setBotName] = useState('OTIVO Universal Synthetic Trader');
  const [description, setDescription] = useState('24/7 Persistent automated execution on Deriv Volatility 1s markets.');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [accountMode, setAccountMode] = useState<'demo' | 'real'>('demo');

  // Step 2: Markets
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
    preselectedMarket ? [preselectedMarket] : ['1HZ10V', '1HZ50V']
  );

  // Step 3: Contract Types
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>(['CALL', 'PUT']);

  // Step 4: Strategy
  const [strategyType, setStrategyType] = useState<StrategyType>('MOMENTUM_TREND');
  const [consecutiveTicks, setConsecutiveTicks] = useState(3);
  const [threshold, setThreshold] = useState(0.15);
  const [avoidNoise, setAvoidNoise] = useState(true);
  const [targetDigit, setTargetDigit] = useState(7);
  const [growthRate, setGrowthRate] = useState(2);
  const [limitOrderTicks, setLimitOrderTicks] = useState(10);
  const [multiplier, setMultiplier] = useState(100);

  // Step 5: Risk
  const [stakeType, setStakeType] = useState<'fixed' | 'percentage'>('fixed');
  const [stakeAmount, setStakeAmount] = useState(2.0);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(2.0);
  const [stakePercentage, setStakePercentage] = useState(1.0);
  const [maxStake, setMaxStake] = useState(25.0);
  const [maxDailyLoss, setMaxDailyLoss] = useState(30.0);
  const [maxDailyProfit, setMaxDailyProfit] = useState(100.0);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(3);
  const [maxTradesPerSession, setMaxTradesPerSession] = useState(25);
  const [cooldownSeconds, setCooldownSeconds] = useState(15);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(5.0);

  // Step 6: Schedule
  const [scheduleType, setScheduleType] = useState<'IMMEDIATE' | 'SCHEDULED_WINDOW' | 'RECURRING'>('IMMEDIATE');
  const [startDateTime, setStartDateTime] = useState('');
  const [stopDateTime, setStopDateTime] = useState('');
  const [runUntilStopped, setRunUntilStopped] = useState(true);
  const [timezone, setTimezone] = useState('UTC');

  if (!isOpen) return null;

  const standard8Markets = markets.filter(m => m.isStandard8);

  const toggleMarket = (sym: string) => {
    if (selectedMarkets.includes(sym)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter(s => s !== sym));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, sym]);
    }
  };

  const selectAllStandard8 = () => {
    setSelectedMarkets(standard8Markets.map(m => m.symbol));
  };

  const handleFinish = async (deployImmediately: boolean) => {
    setIsSubmitting(true);
    try {
      const stratObj = {
        type: strategyType,
        name: strategyType.replace(/_/g, ' '),
        description: `Configured ${strategyType.replace(/_/g, ' ')} rules for 24/7 worker.`,
        entryConditions: {
          indicator: strategyType === 'DIGIT_FREQUENCY_ANALYSIS' ? 'DIGIT_REPEAT' : 'TICK_MOMENTUM',
          threshold,
          consecutiveTicksRequired: consecutiveTicks,
          targetDigit,
          barrierDigit: targetDigit,
          growthRate,
          limitOrder: limitOrderTicks,
          multiplier
        },
        filters: {
          avoidTickNoise: avoidNoise,
          maxSpreadPips: 2,
          signalExpirationSeconds: 15
        },
        rotationRules: {
          enabled: strategyType === 'HYBRID_FAILOVER_ROTATION',
          switchOnLoss: true,
          switchOnWinCount: 3
        }
      };

      const riskObj = {
        stakeType,
        stakeAmount,
        stakePercentage,
        maxStake,
        martingaleMultiplier,
        takeProfit: maxDailyProfit,
        stopLoss: maxDailyLoss,
        maxConcurrentContracts: 1,
        maxDailyLoss,
        maxDailyProfit,
        maxConsecutiveLosses,
        maxTradesPerSession,
        cooldownPeriodSeconds: cooldownSeconds,
        maxAccountDrawdownPercent: maxDrawdownPercent,
        emergencyStopBalanceMin: 10.0
      };

      const scheduleObj = {
        type: scheduleType,
        startDateTime: scheduleType === 'SCHEDULED_WINDOW' && startDateTime ? new Date(startDateTime).toISOString() : undefined,
        stopDateTime: stopDateTime ? new Date(stopDateTime).toISOString() : undefined,
        runUntilStopped,
        timezone,
        permittedDays: [0, 1, 2, 3, 4, 5, 6],
        permittedStartHourUtc: 0,
        permittedEndHourUtc: 23
      };

      await onSaveAndDeploy({
        name: botName,
        description,
        derivAccountId: selectedAccountId,
        accountMode,
        selectedMarkets,
        selectedContractTypes,
        strategy: stratObj as any,
        risk: riskObj as any,
        schedule: scheduleObj as any
      }, deployImmediately);

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Step {step} of 7
            </div>
            <h2 className="text-lg font-bold text-white">
              {step === 1 && '1. Bot Identity & Deriv Account'}
              {step === 2 && '2. Volatility Markets Selection'}
              {step === 3 && '3. Deriv Contract Types'}
              {step === 4 && '4. Strategy Rules & Entry Conditions'}
              {step === 5 && '5. Risk & Capital Protection'}
              {step === 6 && '6. Execution Schedule & Cloud Timing'}
              {step === 7 && '7. Review Configuration & Deploy'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-neutral-950 h-1">
          <div
            className="bg-emerald-400 h-1 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-neutral-200">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Bot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. OTIVO V1s Momentum Scalper"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Select Deriv Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    const acc = accounts.find(a => a.id === e.target.value);
                    if (acc) setAccountMode(acc.accountType);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.accountType.toUpperCase()} - ${acc.balance} {acc.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Execution Mode</div>
                  <div className="text-[11px] text-[#00e676] font-medium">
                    Real Production Deriv Trading
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30">
                  REAL ACCOUNT
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Markets */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Select indices for tick ingestion and trade evaluation:
                </span>
                <button
                  type="button"
                  onClick={selectAllStandard8}
                  className="text-xs text-emerald-400 hover:underline font-medium cursor-pointer"
                >
                  Select All 8 Standard Indices
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {standard8Markets.map(m => {
                  const isChecked = selectedMarkets.includes(m.symbol);
                  return (
                    <button
                      type="button"
                      key={m.symbol}
                      onClick={() => toggleMarket(m.symbol)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-400">{m.symbol}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-xs font-medium text-neutral-200 mt-1 truncate">{m.displayName}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                        ${m.currentPrice?.toFixed(m.pipSize) || 'Live'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Contract Types */}
          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs text-neutral-400 block">
                Choose eligible contract families supported by the official Deriv API:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'CALL_PUT', label: 'Rise / Fall (CALL & PUT)', desc: 'Directional tick trend outcome' },
                  { id: 'DIGITS_ODD_EVEN', label: 'Digits Even / Odd', desc: 'Even or Odd last digit parity' },
                  { id: 'DIGITS_DIFF', label: 'Digits Differs (DIGITDIFF)', desc: '90% statistical edge against targeted digit' },
                  { id: 'DIGITS_OVER_UNDER', label: 'Digits Over / Under', desc: 'Predict last digit range above or below barrier' },
                  { id: 'ACCUMULATORS', label: 'Accumulator Contracts', desc: 'Continuous tick compounding with knockout guard' },
                  { id: 'MULTIPLIERS', label: 'Multipliers (x100 / x200)', desc: 'Amplified tick returns with take-profit exit' }
                ].map(item => {
                  const isSelected = item.id === 'CALL_PUT'
                    ? selectedContractTypes.includes('CALL')
                    : item.id === 'DIGITS_DIFF'
                    ? selectedContractTypes.includes('DIGITDIFF')
                    : item.id === 'DIGITS_ODD_EVEN'
                    ? selectedContractTypes.includes('DIGITODD')
                    : item.id === 'ACCUMULATORS'
                    ? selectedContractTypes.includes('ACCU')
                    : item.id === 'MULTIPLIERS'
                    ? selectedContractTypes.includes('MULTUP')
                    : selectedContractTypes.includes('DIGITOVER');
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'CALL_PUT') setSelectedContractTypes(['CALL', 'PUT']);
                        else if (item.id === 'DIGITS_DIFF') setSelectedContractTypes(['DIGITDIFF']);
                        else if (item.id === 'DIGITS_ODD_EVEN') setSelectedContractTypes(['DIGITODD', 'DIGITEVEN']);
                        else if (item.id === 'DIGITS_OVER_UNDER') setSelectedContractTypes(['DIGITOVER', 'DIGITUNDER']);
                        else if (item.id === 'ACCUMULATORS') setSelectedContractTypes(['ACCU']);
                        else if (item.id === 'MULTIPLIERS') setSelectedContractTypes(['MULTUP', 'MULTDOWN']);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-semibold text-sm text-neutral-200">{item.label}</div>
                      <div className="text-xs text-neutral-400 mt-1">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Contract Specific Inputs */}
              {(selectedContractTypes.includes('DIGITDIFF') ||
                selectedContractTypes.includes('DIGITOVER') ||
                selectedContractTypes.includes('DIGITUNDER')) && (
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      Barrier Digit Input (0 - 9)
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Selected Barrier: {targetDigit}
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTargetDigit(d)}
                        className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          targetDigit === d
                            ? 'bg-emerald-400 text-neutral-950 scale-105'
                            : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {selectedContractTypes.includes('DIGITDIFF')
                      ? 'Differs wins when last digit differs from your barrier digit.'
                      : 'Over wins if last digit > barrier, Under wins if last digit < barrier.'}
                  </p>
                </div>
              )}

              {(selectedContractTypes.includes('CALL') ||
                selectedContractTypes.includes('DIGITODD') ||
                selectedContractTypes.includes('DIGITEVEN')) &&
                !selectedContractTypes.includes('DIGITDIFF') &&
                !selectedContractTypes.includes('DIGITOVER') && (
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {selectedContractTypes.includes('CALL')
                        ? 'Rise / Fall contracts do not require a barrier (evaluates exit spot vs entry spot).'
                        : 'Even / Odd contracts do not require a barrier (evaluates last digit parity).'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    NO BARRIER
                  </span>
                </div>
              )}

              {selectedContractTypes.includes('ACCU') && (
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1">
                        Growth Rate (% per tick)
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setGrowthRate(rate)}
                            className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer ${
                              growthRate === rate
                                ? 'bg-emerald-400 text-neutral-950'
                                : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1">
                        Limit Order (Take-Profit Ticks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={limitOrderTicks}
                        onChange={(e) => setLimitOrderTicks(parseInt(e.target.value, 10) || 10)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Ticks compound continuously until reaching your limit order or hitting the knockout barrier.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Strategy */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Predefined Strategy</label>
                <select
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value as StrategyType)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MOMENTUM_TREND">Adaptive Tick Momentum (Directional Trend Follower)</option>
                  <option value="MEAN_REVERSION">Mean Reversion (Extremes Pullback)</option>
                  <option value="DIGIT_FREQUENCY_ANALYSIS">Statistical Digit Frequency Analysis (Edge Targeting)</option>
                  <option value="VOLATILITY_BREAKOUT">Volatility Breakout Expansion</option>
                  <option value="ACCUMULATOR_COMPOUNDER">Accumulator Compounder (Safe Knockout Guard)</option>
                  <option value="MULTIPLIER_DYNAMIC_SCALP">Multiplier Dynamic Scalper</option>
                  <option value="HYBRID_FAILOVER_ROTATION">Hybrid Strategy Failover & Rotation</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Consecutive Ticks</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={consecutiveTicks}
                    onChange={(e) => setConsecutiveTicks(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Noise Filter</label>
                  <button
                    type="button"
                    onClick={() => setAvoidNoise(!avoidNoise)}
                    className={`w-full p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                      avoidNoise
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {avoidNoise ? 'Filter Active (Suppresses flat ticks)' : 'No Filter'}
                  </button>
                </div>
              </div>
              {strategyType === 'DIGIT_FREQUENCY_ANALYSIS' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Target Barrier Digit (0 - 9)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={targetDigit}
                    onChange={(e) => setTargetDigit(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Risk */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Stake Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.35"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Martingale Factor (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={martingaleMultiplier}
                    onChange={(e) => setMartingaleMultiplier(parseFloat(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Max Stake Cap ($)</label>
                  <input
                    type="number"
                    value={maxStake}
                    onChange={(e) => setMaxStake(parseFloat(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Max Daily Loss ($ Stop Loss)</label>
                  <input
                    type="number"
                    value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-rose-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Max Daily Profit ($ Take Profit)</label>
                  <input
                    type="number"
                    value={maxDailyProfit}
                    onChange={(e) => setMaxDailyProfit(parseFloat(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-emerald-400 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Max Consec. Losses</label>
                  <input
                    type="number"
                    value={maxConsecutiveLosses}
                    onChange={(e) => setMaxConsecutiveLosses(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Max Trades/Session</label>
                  <input
                    type="number"
                    value={maxTradesPerSession}
                    onChange={(e) => setMaxTradesPerSession(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">Cooldown (Seconds)</label>
                  <input
                    type="number"
                    value={cooldownSeconds}
                    onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Schedule */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="text-xs font-bold text-white">Execution Mode: Backend Persistent Worker</div>
                <p className="text-[11px] text-neutral-400">
                  Trading is managed by the cloud worker engine. You can close your browser, switch off your phone, or disconnect at any time.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleType('IMMEDIATE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    scheduleType === 'IMMEDIATE'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Start Immediately</div>
                  <div className="text-[11px] text-neutral-400 mt-1">Deploy and execute right now</div>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('SCHEDULED_WINDOW')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    scheduleType === 'SCHEDULED_WINDOW'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Scheduled Cloud Start</div>
                  <div className="text-[11px] text-neutral-400 mt-1">Start at a future UTC time</div>
                </button>
              </div>
              {scheduleType === 'SCHEDULED_WINDOW' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">Start Date & Time (UTC)</label>
                    <input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">Optional Stop Date & Time</label>
                    <input
                      type="datetime-local"
                      value={stopDateTime}
                      onChange={(e) => setStopDateTime(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Review */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
                <div className="text-sm font-bold text-white mb-2">{botName}</div>
                <div className="grid grid-cols-2 gap-2 text-neutral-400">
                  <div>Markets: <span className="text-white font-mono">{selectedMarkets.join(', ')}</span></div>
                  <div>Contracts: <span className="text-white font-mono">{selectedContractTypes.join(', ')}</span></div>
                  <div>Strategy: <span className="text-white">{strategyType.replace(/_/g, ' ')}</span></div>
                  <div>Mode: <span className="text-emerald-400 font-bold uppercase">{accountMode}</span></div>
                  <div>Stake: <span className="text-white font-mono">${stakeAmount} USD</span></div>
                  <div>Daily Loss Limit: <span className="text-rose-400 font-mono">${maxDailyLoss} USD</span></div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>Deriv Risk Disclosure:</strong> Synthetic index contracts are subject to rapid market fluctuations. The cloud worker will automatically enforce your configured daily loss of ${maxDailyLoss} and ${maxConsecutiveLosses} consecutive loss circuit breaker.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex items-center gap-2">
            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinish(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinish(true)}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Deploy to Cloud Worker</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
