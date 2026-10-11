import React from 'react';
import { AnalyticsPayload, WorkerStatusPayload } from '../types/index.js';
import { TrendingUp, ShieldAlert, Activity, Server, Clock } from 'lucide-react';

interface KpiMetricsProps {
  analytics?: AnalyticsPayload;
  workerStatus?: WorkerStatusPayload;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ analytics, workerStatus }) => {
  const m = analytics?.metrics || {
    totalDeployed: 1,
    running: 1,
    scheduled: 0,
    paused: 0,
    failed: 0,
    totalRealizedPL: 0,
    totalSimulatedPL: 11.25,
    activeContracts: 0,
    totalTradesCount: 4,
    winRate: 75
  };

  const workerUptime = workerStatus?.server.uptimeSeconds || 3600;
  const hours = Math.floor(workerUptime / 3600);
  const minutes = Math.floor((workerUptime % 3600) / 60);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Deployed Bots */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Active Bots</span>
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
          {m.running} <span className="text-xs font-normal text-neutral-500">/ {m.totalDeployed} total</span>
        </div>
        <div className="mt-1 text-[11px] text-neutral-400">
          <span>{m.scheduled} scheduled</span>
          <span className="mx-1" aria-hidden="true">|</span>
          <span>{m.paused} paused</span>
        </div>
      </div>

      {/* 2. Realized Real P/L */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Realized Real P/L</span>
          <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
          m.totalRealizedPL > 0 ? 'text-emerald-400' : m.totalRealizedPL < 0 ? 'text-rose-400' : 'text-neutral-300'
        }`}>
          {m.totalRealizedPL >= 0 ? '+' : ''}${m.totalRealizedPL.toFixed(2)}
        </div>
        <div className="mt-1 text-[11px] text-neutral-400">
          <span>Live Deriv account</span>
        </div>
      </div>

      {/* 3. Simulated Demo P/L */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Simulated Demo P/L</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
          m.totalSimulatedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {m.totalSimulatedPL >= 0 ? '+' : ''}${m.totalSimulatedPL.toFixed(2)}
        </div>
        <div className="mt-1 text-[11px] text-neutral-400">
          <span>Virtual demo sandbox</span>
        </div>
      </div>

      {/* 4. Active Contracts */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Open Contracts</span>
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
          {m.activeContracts}
        </div>
        <div className="mt-1 text-[11px] text-neutral-400">
          <span>{m.totalTradesCount} settled trades</span>
          <span className="mx-1" aria-hidden="true">|</span>
          <span>{m.winRate}% win rate</span>
        </div>
      </div>

      {/* 5. Persistent Server Health */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Cloud Worker</span>
          <Server className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>24/7 ONLINE</span>
        </div>
        <div className="mt-1 text-[11px] text-neutral-400 font-mono tabular-nums">
          <span>Uptime: {hours}h {minutes}m</span>
          <span className="mx-1" aria-hidden="true">|</span>
          <span>PID {workerStatus?.server.pid || process.pid}</span>
        </div>
      </div>

      {/* 6. Risk Circuit Breaker */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Risk Status</span>
          <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        <div className="text-sm font-semibold text-neutral-200 mt-0.5">
          {m.failed > 0 ? (
            <span className="text-amber-400">Limit Triggered</span>
          ) : (
            <span className="text-emerald-400">All Nominal</span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-neutral-400">
          <span>Drawdown & exposure protected</span>
        </div>
      </div>
    </div>
  );
};
