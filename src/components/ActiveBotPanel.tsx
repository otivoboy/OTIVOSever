import React, { useState, useEffect } from 'react';
import {
  Bot,
  Pause,
  Play,
  Square,
  ShieldCheck,
  Calendar,
  Clock,
  Globe,
  Plus,
  Percent,
  Target,
  ShieldAlert,
  DollarSign,
  Key
} from 'lucide-react';
import { BotRecord } from '../types/index.js';
import { botEngine } from '../lib/botEngine.js';

interface ActiveBotPanelProps {
  bot?: BotRecord;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onEditSchedule?: () => void;
  onQuickRun?: () => void;
  isRunningAny?: boolean;
  onUpdateRisk?: (settings: {
    baseStake?: number;
    martingaleMultiplier?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  onOpenAccountModal?: () => void;
}

export const ActiveBotPanel: React.FC<ActiveBotPanelProps> = ({
  bot,
  onPause,
  onResume,
  onStop,
  onEditSchedule,
  onQuickRun,
  isRunningAny = false,
  onUpdateRisk,
  onOpenAccountModal
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'stats' | 'logs'>('live');

  // Interactive Risk Inputs
  const [stakeInput, setStakeInput] = useState<number>(bot?.risk.stakeAmount || 2.0);
  const [martingaleInput, setMartingaleInput] = useState<number>(bot?.risk.martingaleMultiplier || 2.0);
  const [tpInput, setTpInput] = useState<number>(bot?.risk.takeProfit || bot?.risk.maxDailyProfit || 10.0);
  const [slInput, setSlInput] = useState<number>(bot?.risk.stopLoss || bot?.risk.maxDailyLoss || 20.0);
  const [isRiskSaved, setIsRiskSaved] = useState(false);

  // Sync inputs when bot changes
  useEffect(() => {
    if (bot) {
      setStakeInput(bot.risk.stakeAmount || 2.0);
      setMartingaleInput(bot.risk.martingaleMultiplier || 2.0);
      setTpInput(bot.risk.takeProfit || bot.risk.maxDailyProfit || 10.0);
      setSlInput(bot.risk.stopLoss || bot.risk.maxDailyLoss || 20.0);
    }
  }, [bot?.id]);

  const handleApplyRisk = () => {
    if (bot) {
      botEngine.updateRiskSettings(bot.id, {
        baseStake: stakeInput,
        martingaleMultiplier: martingaleInput,
        takeProfit: tpInput,
        stopLoss: slInput
      });
      onUpdateRisk?.({
        baseStake: stakeInput,
        martingaleMultiplier: martingaleInput,
        takeProfit: tpInput,
        stopLoss: slInput
      });
      setIsRiskSaved(true);
      setTimeout(() => setIsRiskSaved(false), 2000);
    }
  };

  const isRunning = bot?.status === 'RUNNING';

  if (!bot) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-[#0a141d] border border-[#132431] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/20 flex items-center justify-center text-[#00e676] mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cloud Bot Engine</h3>
            <p className="text-xs text-[#55768c] mt-1 max-w-[260px] mx-auto">
              Run automated 24/7 contracts on Deriv with custom Martingale, Take Profit, and Stop Loss.
            </p>
          </div>
          <div className="space-y-2">
            {onQuickRun && (
              <button
                onClick={isRunningAny ? () => onStop('') : onQuickRun}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
                  isRunningAny
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-[#071118] shadow-emerald-500/20'
                }`}
              >
                {isRunningAny ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>STOP BOT (RUNNING)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-[#071118]" />
                    <span>Start Quick Bot (Volatility 50 1s)</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onEditSchedule}
              className="w-full py-2.5 px-4 rounded-xl bg-[#122230] hover:bg-[#193246] border border-[#1d3a52] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Configure in Bot Wizard</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00e676]" />
            <span className="text-xs font-bold text-white">Risk & Martingale Engine</span>
          </div>
          <div className="text-xs text-[#55768c] leading-relaxed">
            Automatic stake compounding, profit guards, and emergency loss cutoffs ensure high capital protection.
          </div>
        </div>
      </div>
    );
  }

  const botId = bot.id;
  const session = bot.currentTradeSession || {
    totalTrades: 0,
    winCount: 0,
    lossCount: 0,
    consecutiveLosses: 0,
    realizedProfit: 0
  };

  const winRate = session.totalTrades > 0
    ? Math.round((session.winCount / session.totalTrades) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* 1. Bot Header Card */}
      <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isRunning
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : 'bg-[#00e676]/15 border-[#00e676]/35 text-[#00e676]'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                {bot.name}
              </h2>
              <div className="text-[10px] text-[#5e8095] mt-0.5">
                <span>{bot.strategy.name}</span>
                <span className="mx-1 text-[#2d475a]">|</span>
                <span>{bot.selectedMarkets.join(', ')}</span>
                <span className="mx-1 text-[#2d475a]">|</span>
                <span className="text-[#00e676] font-medium uppercase">
                  {bot.accountMode} Account
                </span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            isRunning
              ? 'text-rose-400 bg-rose-500/15 border-rose-500/35 animate-pulse'
              : 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-rose-400' : 'bg-[#ffb300]'}`}></span>
            <span>{bot.status}</span>
          </div>
        </div>

        {/* Buttons: Run Bot (Green) transforms into STOP BOT (RED) when running */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {isRunning ? (
            <button
              onClick={() => onStop(botId)}
              className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-600/30 cursor-pointer animate-pulse active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>STOP BOT</span>
            </button>
          ) : (
            <button
              onClick={() => onResume(botId)}
              className="py-2.5 px-3 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#071118] font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-[#00e676]/20 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-[#071118]" />
              <span>RUN BOT</span>
            </button>
          )}

          {isRunning ? (
            <button
              onClick={() => onPause(botId)}
              className="py-2.5 px-3 rounded-lg bg-[#071118] hover:bg-[#122230] border border-[#162734] text-neutral-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-neutral-300" />
              <span>Pause Bot</span>
            </button>
          ) : (
            <button
              onClick={() => onStop(botId)}
              className="py-2.5 px-3 rounded-lg bg-[#071118] hover:bg-[#122230] border border-[#162734] text-neutral-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3 fill-neutral-400" />
              <span>Reset State</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="flex border-b border-[#132431] text-xs font-semibold px-2">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'live'
              ? 'border-[#00e676] text-[#00e676]'
              : 'border-transparent text-[#628499] hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full border border-[#00e676] flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-[#00e676]" />
          </span>
          <span>Live Trading</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'stats'
              ? 'border-[#00e676] text-[#00e676]'
              : 'border-transparent text-[#628499] hover:text-white'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'border-[#00e676] text-[#00e676]'
              : 'border-transparent text-[#628499] hover:text-white'
          }`}
        >
          Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {/* Risk, Martingale, TP and SL Editable Inputs */}
          <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                <span className="text-xs font-bold text-white">Risk Controls & Money Management</span>
              </div>
              <button
                type="button"
                onClick={handleApplyRisk}
                className="text-[10px] font-bold text-[#071118] bg-emerald-400 hover:bg-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                {isRiskSaved ? 'Saved!' : 'Apply Risk'}
              </button>
            </div>

            {/* Editable Grid for Stake, Martingale, TP, SL */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Base Stake Input */}
              <div className="p-2 rounded-lg bg-[#071118] border border-[#142634] space-y-1">
                <label className="text-[10px] text-[#55768c] font-semibold uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> Initial Stake
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.35"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(Math.max(0.35, parseFloat(e.target.value) || 0.35))}
                  className="w-full bg-[#0a141d] border border-[#162734] rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Martingale Multiplier Input */}
              <div className="p-2 rounded-lg bg-[#071118] border border-[#142634] space-y-1">
                <label className="text-[10px] text-[#55768c] font-semibold uppercase flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-400" /> Martingale Factor
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={martingaleInput}
                  onChange={(e) => setMartingaleInput(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                  className="w-full bg-[#0a141d] border border-[#162734] rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Take Profit (TP) Input */}
              <div className="p-2 rounded-lg bg-[#071118] border border-[#142634] space-y-1">
                <label className="text-[10px] text-[#55768c] font-semibold uppercase flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" /> Take Profit (TP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={tpInput}
                    onChange={(e) => setTpInput(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-[#0a141d] border border-[#162734] rounded pl-5 pr-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-1.5 top-1 text-emerald-500 font-mono text-xs">$</span>
                </div>
              </div>

              {/* Stop Loss (SL) Input */}
              <div className="p-2 rounded-lg bg-[#071118] border border-[#142634] space-y-1">
                <label className="text-[10px] text-[#55768c] font-semibold uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Stop Loss (SL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={slInput}
                    onChange={(e) => setSlInput(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-[#0a141d] border border-[#162734] rounded pl-5 pr-2 py-1 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute left-1.5 top-1 text-rose-500 font-mono text-xs">$</span>
                </div>
              </div>
            </div>

            {/* Martingale Quick Preset Pills */}
            <div className="flex items-center gap-1 pt-0.5">
              <span className="text-[9px] text-[#55768c] uppercase font-bold shrink-0">Preset:</span>
              {[1.0, 1.5, 2.0, 2.1, 2.5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMartingaleInput(preset);
                    if (bot) {
                      botEngine.updateRiskSettings(bot.id, { martingaleMultiplier: preset });
                    }
                  }}
                  className={`flex-1 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    martingaleInput === preset
                      ? 'bg-emerald-500 text-[#071118]'
                      : 'bg-[#071118] text-neutral-300 hover:bg-[#142634] border border-[#162734]'
                  }`}
                >
                  {preset === 1.0 ? '1x Off' : `${preset}x`}
                </button>
              ))}
            </div>

            {/* Live Session Status */}
            <div className="space-y-1.5 text-xs pt-1.5 border-t border-[#142634] font-mono">
              <div className="flex justify-between">
                <span className="text-[#55768c]">Session Realized P/L</span>
                <span className={`font-bold ${session.realizedProfit >= 0 ? 'text-[#00e676]' : 'text-[#ff3d57]'}`}>
                  {session.realizedProfit >= 0 ? '+' : ''}${session.realizedProfit.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55768c]">Total Trades</span>
                <span className="text-white font-bold">{session.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55768c]">Win / Loss</span>
                <span className="text-white font-bold">{session.winCount}W / {session.lossCount}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55768c]">Consecutive Losses</span>
                <span className="text-white font-bold">{session.consecutiveLosses} / {bot.risk.maxConsecutiveLosses}</span>
              </div>
            </div>
          </div>

          {/* Deriv Real Account Notice / Token Connect helper */}
          {!botEngine.isRealAuthorized && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Deriv Live Broker Authorization</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                To execute live trades with real money on Deriv, provide your API Token in accounts modal.
              </p>
              {onOpenAccountModal && (
                <button
                  type="button"
                  onClick={onOpenAccountModal}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Manage Deriv Accounts & Tokens
                </button>
              )}
            </div>
          )}

          {/* Bot Schedule Card */}
          <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00e676]" />
                <span className="text-xs font-bold text-white">Bot Schedule</span>
              </div>
              <button
                onClick={onEditSchedule}
                className="text-[10px] font-medium text-neutral-300 hover:text-white px-2 py-0.5 rounded bg-[#122230] border border-[#193040] cursor-pointer"
              >
                Edit
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-[#87a1b4]">
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#55768c] shrink-0" />
                <span className="text-[11px] text-[#55768c] w-20">Start Time</span>
                <span className="text-white font-mono text-[11px]">
                  {bot.schedule.startDateTime ? new Date(bot.schedule.startDateTime).toUTCString().slice(0, 22) : 'Immediate'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#55768c] shrink-0" />
                <span className="text-[11px] text-[#55768c] w-20">Stop Time</span>
                <span className="text-white font-mono text-[11px]">
                  {bot.schedule.runUntilStopped ? 'Run Until Stopped' : (bot.schedule.stopDateTime ? new Date(bot.schedule.stopDateTime).toUTCString().slice(0, 22) : 'N/A')}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-3.5 h-3.5 text-[#55768c] shrink-0" />
                <span className="text-[11px] text-[#55768c] w-20">Timezone</span>
                <span className="text-white text-[11px]">{bot.schedule.timezone || 'UTC'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] text-xs text-[#6e8e9f] space-y-2">
          <div className="text-white font-bold">Execution Statistics</div>
          <div>Total Trades: {session.totalTrades}</div>
          <div>Win Rate: {winRate}% ({session.winCount}W / {session.lossCount}L)</div>
          <div>Realized Profit: ${session.realizedProfit.toFixed(2)}</div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="p-3 rounded-xl bg-[#0a141d] border border-[#132431] text-[11px] font-mono text-[#8ca3b5] space-y-1.5 max-h-60 overflow-y-auto">
          <div>Status: {bot.status}</div>
          <div>State: {bot.executionState}</div>
          <div>Markets: {bot.selectedMarkets.join(', ')}</div>
        </div>
      )}
    </div>
  );
};
