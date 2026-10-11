import React, { useState } from 'react';
import { AuditLogRecord, BotRecord } from '../types/index.js';
import { Terminal } from 'lucide-react';

interface LiveExecutionTerminalProps {
  logs: AuditLogRecord[];
  selectedBot?: BotRecord;
  onClearFilter?: () => void;
}

export const LiveExecutionTerminal: React.FC<LiveExecutionTerminalProps> = ({
  logs,
  selectedBot,
  onClearFilter
}) => {
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'TRADE' | 'RISK_ALERT' | 'WARN'>('ALL');

  const filteredLogs = logs.filter(log => {
    if (selectedBot && log.botId && log.botId !== selectedBot.id) return false;
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    return true;
  });

  return (
    <div className="rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col h-[520px] overflow-hidden shadow-xl">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Persistent Worker Live Execution Log
          </span>
          {selectedBot && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-neutral-500">Filtered on</span>
              <span className="text-xs font-mono text-emerald-400">{selectedBot.name}</span>
              {onClearFilter && (
                <button
                  onClick={onClearFilter}
                  className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'TRADE', 'RISK_ALERT', 'INFO', 'WARN'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Scroll View */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 bg-neutral-950/90 text-neutral-300">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
            Listening for cloud worker events...
          </div>
        ) : (
          filteredLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const isTrade = log.level === 'TRADE';
            const isRisk = log.level === 'RISK_ALERT';
            const isWarn = log.level === 'WARN' || log.level === 'ERROR';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-neutral-900/40 p-1 rounded">
                <span className="text-neutral-500 tabular-nums shrink-0">{time}</span>
                <span className={`text-[10px] font-bold px-1 rounded shrink-0 uppercase ${
                  isTrade
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : isRisk
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : isWarn
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-neutral-900 text-neutral-400'
                }`}>
                  {log.level}
                </span>
                <span className={`flex-1 break-all ${
                  isTrade ? 'text-emerald-300 font-medium' : isRisk ? 'text-rose-300' : 'text-neutral-300'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Status */}
      <div className="px-4 py-2 bg-neutral-900/60 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Durable Cloud Event Stream (Backend Authoritative)</span>
        </div>
        <span className="font-mono tabular-nums">{filteredLogs.length} events logged</span>
      </div>
    </div>
  );
};
