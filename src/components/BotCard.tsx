import React from 'react';
import { BotRecord } from '../types/index.js';
import {
  Play,
  Pause,
  Square,
  Terminal,
  Trash2,
  Layers,
  Activity,
  Clock
} from 'lucide-react';

interface BotCardProps {
  bot: BotRecord;
  onDeploy: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenLogs: (bot: BotRecord) => void;
}

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  onDeploy,
  onPause,
  onResume,
  onStop,
  onDelete,
  onOpenLogs
}) => {
  const isRunning = bot.status === 'RUNNING';
  const isScheduled = bot.status === 'SCHEDULED';
  const isPaused = bot.status === 'PAUSED';
  const session = bot.currentTradeSession;
  const totalTrades = session.totalTrades;
  const winRate = totalTrades > 0 ? Math.round((session.winCount / totalTrades) * 100) : 0;

  const getStatusBadge = () => {
    switch (bot.status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RUNNING
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3 text-cyan-400" />
            SCHEDULED
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Pause className="w-3 h-3 text-amber-400" />
            PAUSED
          </span>
        );
      case 'RISK_LIMIT_REACHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            CIRCUIT BREAKER
          </span>
        );
      case 'STOPPED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
            STOPPED
          </span>
        );
    }
  };

  const getExecutionStateLabel = () => {
    switch (bot.executionState) {
      case 'WAITING_FOR_SIGNAL':
        return 'Analyzing live tick stream';
      case 'REQUESTING_PROPOSAL':
        return 'Requesting Deriv proposal';
      case 'BUYING':
        return 'Purchasing contract...';
      case 'TRACKING_CONTRACT':
        return `Tracking open contract #${bot.activeContractId || ''}`;
      case 'SETTLING':
        return 'Settling contract payout';
      case 'RISK_CHECK':
        return 'Verifying risk parameters';
      case 'SCHEDULED':
        return `Queued for ${bot.schedule.startDateTime?.slice(11, 16) || 'scheduled window'} UTC`;
      default:
        return bot.executionState.replace(/_/g, ' ');
    }
  };

  return (
    <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/90 hover:border-neutral-700/80 transition-all p-5 flex flex-col justify-between shadow-xl">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                {bot.selectedMarkets.join(', ')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                bot.accountMode === 'real'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {bot.accountMode} ACCOUNT
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5 tracking-tight">
              {bot.name}
            </h3>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Strategy Title & Subtext */}
        <div className="text-xs text-neutral-400 mb-4 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-300 font-medium">{bot.strategy.name}</span>
          <span className="text-neutral-600" aria-hidden="true">|</span>
          <span>{bot.selectedContractTypes.join('/')}</span>
        </div>

        {/* 3 Key Trading Parameters Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 mb-3 text-center">
          <div>
            <div className="text-[10px] uppercase font-semibold text-neutral-500">Stake</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              ${bot.risk.stakeAmount.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-neutral-500">Target Profit</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              +${bot.risk.maxDailyProfit.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-neutral-500">Stop Loss</div>
            <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
              -${bot.risk.maxDailyLoss.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Realized Session P/L & Win Rate Card */}
        <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800/80 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-semibold text-neutral-500">Session Realized P/L</div>
              <div className={`text-xl font-extrabold font-mono tabular-nums ${
                session.realizedProfit > 0
                  ? 'text-emerald-400'
                  : session.realizedProfit < 0
                  ? 'text-rose-400'
                  : 'text-neutral-200'
              }`}>
                {session.realizedProfit >= 0 ? '+' : ''}${session.realizedProfit.toFixed(2)} USD
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-neutral-500">Win Rate</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {winRate}% <span className="text-xs font-normal text-neutral-400">({session.winCount}W / {session.lossCount}L)</span>
              </div>
            </div>
          </div>

          {/* Win / Loss Visual Bar */}
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-2.5 flex">
            <div
              style={{ width: `${winRate}%` }}
              className="bg-emerald-400 h-full transition-all duration-300"
            />
            <div
              style={{ width: `${100 - winRate}%` }}
              className="bg-rose-500 h-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Live Engine State & Last Processed Tick */}
        <div className="p-2.5 rounded-lg bg-neutral-900/50 border border-neutral-800/60 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Worker State:
            </span>
            <span className="font-mono text-emerald-300 font-semibold text-[11px]">
              {getExecutionStateLabel()}
            </span>
          </div>
          {bot.lastProcessedTick && (
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
              <span className="text-neutral-500">Last Tick:</span>
              <span className="text-white">
                {bot.lastProcessedTick.symbol} @ <span className="text-emerald-400 font-bold">{bot.lastProcessedTick.quote}</span> [Digit {bot.lastProcessedTick.digit}]
              </span>
            </div>
          )}
        </div>

        {bot.lastError && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
            {bot.lastError}
          </div>
        )}
      </div>

      {/* Action Controls Toolbar */}
      <div className="mt-4 pt-3.5 border-t border-neutral-800/80 flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={() => onStop(bot.id)}
            className="flex-1 py-2 px-3 text-xs font-extrabold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Bot</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={() => onResume(bot.id)}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-300" />
            <span>Resume Bot</span>
          </button>
        ) : (
          <button
            onClick={() => onDeploy(bot.id)}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-neutral-950" />
            <span>Run Bot</span>
          </button>
        )}

        {(isRunning || isScheduled) && (
          <button
            onClick={() => onStop(bot.id)}
            title="Stop Trading"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-neutral-300" />
          </button>
        )}

        <button
          onClick={() => onOpenLogs(bot)}
          title="Live Cloud Terminal Logs"
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {!isRunning && (
          <button
            onClick={() => onDelete(bot.id)}
            title="Delete Bot"
            className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
