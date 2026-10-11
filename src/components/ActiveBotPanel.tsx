import React, { useState } from 'react';
import {
  Bot,
  Pause,
  Play,
  Square,
  ShieldCheck,
  Calendar,
  Clock,
  Globe,
  Plus
} from 'lucide-react';
import { BotRecord } from '../types/index.js';

interface ActiveBotPanelProps {
  bot?: BotRecord;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onEditSchedule?: () => void;
  onQuickRun?: () => void;
}

export const ActiveBotPanel: React.FC<ActiveBotPanelProps> = ({
  bot,
  onPause,
  onResume,
  onStop,
  onEditSchedule,
  onQuickRun
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'stats' | 'logs'>('live');

  if (!bot) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-xl bg-[#0a141d] border border-[#132431] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/20 flex items-center justify-center text-[#00e676] mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Cloud Bot Deployed</h3>
            <p className="text-xs text-[#55768c] mt-1 max-w-[260px] mx-auto">
              Deploy a bot to run 24/7 independently on the persistent cloud trading server.
            </p>
          </div>
          <div className="space-y-2">
            {onQuickRun && (
              <button
                onClick={onQuickRun}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#071118] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-[#071118]" />
                <span>Start Quick Bot (Volatility 50 1s)</span>
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
            <span className="text-xs font-bold text-white">Risk Engine Status</span>
          </div>
          <div className="text-xs text-[#55768c] leading-relaxed">
            Persistent risk guard active. Daily loss cutoffs, stop-losses, and tick validation will automatically enforce risk rules once a bot starts.
          </div>
        </div>
      </div>
    );
  }

  const isRunning = bot.status === 'RUNNING';
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
            <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/35 flex items-center justify-center text-[#00e676] shrink-0">
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

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/30">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#00e676] animate-pulse' : 'bg-[#ffb300]'}`}></span>
            <span>{bot.status}</span>
          </div>
        </div>

        {/* Buttons: Pause / Resume / Stop */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {isRunning ? (
            <button
              onClick={() => onPause(botId)}
              className="py-2 px-3 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#071118] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-[#00e676]/20 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-[#071118]" />
              <span>Pause Bot</span>
            </button>
          ) : (
            <button
              onClick={() => onResume(botId)}
              className="py-2 px-3 rounded-lg bg-[#00e676] hover:bg-[#00c853] text-[#071118] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-[#00e676]/20 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#071118]" />
              <span>{bot.status === 'PAUSED' ? 'Resume Bot' : 'Run Bot'}</span>
            </button>
          )}

          <button
            onClick={() => onStop(botId)}
            className="py-2 px-3 rounded-lg bg-[#071118] hover:bg-[#122230] border border-[#162734] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Stop Bot</span>
          </button>
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
          {/* Risk Management Card */}
          <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                <span className="text-xs font-bold text-white">Risk Management</span>
              </div>
              <span className="text-[10px] font-semibold text-[#00e676] px-2 py-0.5 rounded border border-[#00e676]/30 bg-[#00e676]/5">
                Within Limits
              </span>
            </div>
            <div className="space-y-1.5 text-xs pt-1 font-mono">
              <div className="flex justify-between">
                <span className="text-[#55768c]">Session P/L</span>
                <span className={`font-bold ${session.realizedProfit >= 0 ? 'text-[#00e676]' : 'text-[#ff3d57]'}`}>
                  {session.realizedProfit >= 0 ? '+' : ''}${session.realizedProfit.toFixed(2)}
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
