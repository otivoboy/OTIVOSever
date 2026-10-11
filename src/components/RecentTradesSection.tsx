import React from 'react';
import { TradeRecord } from '../types/index.js';

interface RecentTradesSectionProps {
  trades: TradeRecord[];
  onViewAll?: () => void;
}

export const RecentTradesSection: React.FC<RecentTradesSectionProps> = ({ trades, onViewAll }) => {
  const displayTrades = trades.slice(0, 6);

  return (
    <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white">Recent Trades</h3>
          {trades.length > 0 && (
            <button
              onClick={onViewAll}
              className="text-[11px] font-medium text-[#00e676] hover:underline cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        {displayTrades.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#55768c] font-sans">
            No trades taken yet. Connect your Deriv account and start a bot to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[10px] text-[#55768c] uppercase border-b border-[#132431] pb-1">
                  <th className="py-1.5 font-medium">Time</th>
                  <th className="py-1.5 font-medium">Market</th>
                  <th className="py-1.5 font-medium">Contract</th>
                  <th className="py-1.5 font-medium text-right">Stake</th>
                  <th className="py-1.5 font-medium text-center">Result</th>
                  <th className="py-1.5 font-medium text-right">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0e1b26]">
                {displayTrades.map((t) => {
                  const isWon = t.status === 'WON' || t.profit > 0;
                  const timeStr = t.purchaseTime ? new Date(t.purchaseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';
                  return (
                    <tr key={t.id} className="hover:bg-[#0e1a24]/50 transition-colors">
                      <td className="py-1.5 text-neutral-400">{timeStr}</td>
                      <td className="py-1.5 text-white font-semibold">{t.symbol}</td>
                      <td className="py-1.5 text-[#8ba3b4]">{t.contractType}</td>
                      <td className="py-1.5 text-right text-neutral-300">${t.stake?.toFixed(2)}</td>
                      <td className="py-1.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          isWon ? 'text-[#00e676]' : 'text-[#ff3d57]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isWon ? 'bg-[#00e676]' : 'bg-[#ff3d57]'
                          }`}></span>
                          {isWon ? 'Won' : 'Lost'}
                        </span>
                      </td>
                      <td className={`py-1.5 text-right font-bold ${
                        isWon ? 'text-[#00e676]' : 'text-[#ff3d57]'
                      }`}>
                        {t.profit >= 0 ? '+' : ''}${t.profit?.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
