import React, { useState } from 'react';
import { TradeRecord, BotRecord } from '../types/index.js';
import { CheckCircle, Clock, XCircle, Search } from 'lucide-react';

interface TradeHistoryTableProps {
  trades: TradeRecord[];
  bots: BotRecord[];
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades, bots }) => {
  const [selectedBotId, setSelectedBotId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = trades.filter(t => {
    if (selectedBotId !== 'ALL' && t.botId !== selectedBotId) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.contractId.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.contractType.toLowerCase().includes(q) ||
        t.botName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bot selector */}
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="text-xs bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Cloud Bots</option>
            {bots.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-3 text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WON">Settled Won</option>
            <option value="LOST">Settled Lost</option>
            <option value="OPEN">Open Tracking</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contract # or market..."
            className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 pl-8 pr-3 text-neutral-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/80 text-neutral-400 font-medium">
                <th className="py-3 px-4">Contract ID</th>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Bot</th>
                <th className="py-3 px-4 text-right">Entry Spot</th>
                <th className="py-3 px-4 text-right">Exit Spot</th>
                <th className="py-3 px-4 text-right">Stake</th>
                <th className="py-3 px-4 text-right">Payout / P/L</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-500 font-sans">
                    No trades match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map(trade => {
                  const isWon = trade.status === 'WON';
                  const isLost = trade.status === 'LOST';
                  const isOpen = trade.status === 'OPEN';
                  return (
                    <tr key={trade.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4 text-neutral-300 font-semibold">
                        #{trade.contractId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold">{trade.symbol}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-neutral-200 bg-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
                          {trade.contractType}
                          {trade.barrier ? ` (${trade.barrier})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-neutral-300 truncate max-w-[140px]">
                        {trade.botName}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-neutral-300">
                        {trade.entrySpot.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-neutral-300">
                        {trade.exitSpot ? trade.exitSpot.toFixed(3) : 'Tracking...'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-neutral-300">
                        ${trade.stake.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {isOpen ? (
                          <span className="text-neutral-400">Tracking...</span>
                        ) : (
                          <span className={`font-bold ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {isWon && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            <CheckCircle className="w-3 h-3" />
                            Won
                          </span>
                        )}
                        {isLost && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                            <XCircle className="w-3 h-3" />
                            Lost
                          </span>
                        )}
                        {isOpen && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            <Clock className="w-3 h-3" />
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-neutral-500 text-[11px]">
                        {new Date(trade.purchaseTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
