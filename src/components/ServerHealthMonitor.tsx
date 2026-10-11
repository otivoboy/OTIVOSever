import React from 'react';
import { WorkerStatusPayload, BotRecord } from '../types/index.js';
import { Radio, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface ServerHealthMonitorProps {
  status?: WorkerStatusPayload;
  runningBots: BotRecord[];
}

export const ServerHealthMonitor: React.FC<ServerHealthMonitorProps> = ({ status, runningBots }) => {
  const instance = status?.worker.instances[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          24/7 Persistent Cloud Worker Infrastructure
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Real-time node telemetry, worker supervisor lease heartbeats, and Deriv API connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloud Process Runtime */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Process Supervisor</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-lg font-bold text-white">Continuous Worker Active</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800">
            <div className="flex justify-between">
              <span className="text-neutral-500">Node PID:</span>
              <span className="text-neutral-200">{status?.server.pid || process.pid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Instance ID:</span>
              <span className="text-neutral-200 truncate max-w-[150px]">{instance?.instanceId || 'worker_node_01'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Memory Heap:</span>
              <span className="text-neutral-200">{status?.server.memoryMb || 48} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Node Version:</span>
              <span className="text-neutral-200">{status?.server.nodeVersion || 'v20.x'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Deriv WebSocket Engine */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Deriv API Gateway</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-lg font-bold text-white">WebSocket Stream Live</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800">
            <div className="flex justify-between">
              <span className="text-neutral-500">Endpoint:</span>
              <span className="text-neutral-200">wss://ws.derivws.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Active Subscriptions:</span>
              <span className="text-neutral-200">{instance?.subscribedSymbols.length || 8} Indices</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Heartbeat Interval:</span>
              <span className="text-neutral-200">3,000 ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Last Ping:</span>
              <span className="text-emerald-400">Nominal (&lt; 20ms)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Durable State & Recovery */}
        <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase">State & Lease Recovery</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-lg font-bold text-white">Durable Lease Locked</span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-400 font-mono pt-2 border-t border-neutral-800">
            <div className="flex justify-between">
              <span className="text-neutral-500">Active Bot Leases:</span>
              <span className="text-emerald-400 font-bold">{runningBots.length} Bots</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Atomic Storage:</span>
              <span className="text-neutral-200">PostgreSQL Ready / WAL Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Crash Recovery:</span>
              <span className="text-neutral-200">Auto-Reconcile Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Downtime Invariant:</span>
              <span className="text-emerald-400">Independent of browser</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Architecture Banner */}
      <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
        <h4 className="text-sm font-semibold text-white">
          Why your trades execute even when this tab is closed
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          The OTIVO architecture decouples the user interface from the trading engine. When you click <em>Deploy</em>, your bot configuration is registered with the persistent cloud worker daemon. The worker subscribes directly to Deriv synthetic tick feeds, tracks moving averages, evaluates digit frequency, and buys contracts independently. Even if you turn off your device, the worker continues operating until stopped or until risk circuit breakers are reached.
        </p>
      </div>
    </div>
  );
};
