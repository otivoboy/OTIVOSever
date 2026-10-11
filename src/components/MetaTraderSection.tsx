import React from 'react';
import { ExternalLink, Key, Server, Cpu } from 'lucide-react';
import { MetaTrader5Icon } from './MetaTrader5Icon.js';

export const MetaTraderSection: React.FC = () => {
  return (
    <div className="space-y-5 p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <MetaTrader5Icon size={22} />
          Deriv MetaTrader 5 (MT5) Synthetic Indices Hub
        </h2>
        <p className="text-xs text-[#6e8e9f] mt-0.5">
          Connect your Deriv MT5 synthetic indices account to run automated expert advisors and synchronize quotes.
        </p>
      </div>

      {/* Connection Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Trading Server</span>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-400 bg-[#071118] p-2.5 rounded-lg border border-[#142634]">
            Deriv-Server (Real) / Deriv-Demo
          </div>
          <p className="text-[11px] text-[#55768c]">
            Select this server name when configuring your MT5 terminal on Windows, Mac, iOS, or Android.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Key className="w-4 h-4 text-[#00b0ff]" />
            <span>Broker Name</span>
          </div>
          <div className="font-mono text-sm font-bold text-white bg-[#071118] p-2.5 rounded-lg border border-[#142634]">
            Deriv (SVG) LLC
          </div>
          <p className="text-[11px] text-[#55768c]">
            Official licensed broker for synthetic indices, Volatility 1s, and algorithmic deriv contracts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Execution Protocol</span>
          </div>
          <div className="font-mono text-sm font-bold text-purple-400 bg-[#071118] p-2.5 rounded-lg border border-[#142634]">
            FIX 4.4 / WebSocket v3 API
          </div>
          <p className="text-[11px] text-[#55768c]">
            Zero-latency tick feeds synchronized directly with Deriv's high-frequency pricing nodes.
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0c1b26] to-[#08121a] border border-[#162d3e] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Open MT5 WebTrader in Browser</h3>
          <p className="text-xs text-[#6e8e9f] mt-0.5">
            Launch official Deriv MT5 platform directly without installing local client software.
          </p>
        </div>
        <a
          href="https://trade.deriv.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#071118] font-bold text-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <span>Launch Deriv WebTrader</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
