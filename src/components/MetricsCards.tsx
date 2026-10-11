import React from 'react';
import {
  Bot,
  Play,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  Link2,
  ShieldCheck
} from 'lucide-react';
import { AnalyticsPayload } from '../types/index.js';

interface MetricsCardsProps {
  analytics?: AnalyticsPayload;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ analytics }) => {
  const m = analytics?.metrics || {
    totalDeployed: 0,
    running: 0,
    scheduled: 0,
    failed: 0,
    totalRealizedPL: 0,
    totalSimulatedPL: 0,
    activeContracts: 0,
    totalTradesCount: 0,
    winRate: 0
  };

  const realizedPL = m.totalRealizedPL ?? 0;
  const simulatedPL = m.totalSimulatedPL ?? 0;

  return (
    <div className="space-y-3">
      {/* Row 1: 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Bots */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Total Bots</div>
            <div className="text-xl font-bold font-mono text-white leading-tight mt-0.5">
              {m.totalDeployed ?? 0}
            </div>
          </div>
        </div>

        {/* Running Bots */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] shrink-0">
            <Play className="w-5 h-5 fill-[#00e676]" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Running Bots</div>
            <div className="text-xl font-bold font-mono text-white leading-tight mt-0.5">
              {m.running ?? 0}
            </div>
          </div>
        </div>

        {/* Scheduled Bots */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00b0ff]/15 border border-[#00b0ff]/30 flex items-center justify-center text-[#00b0ff] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Scheduled Bots</div>
            <div className="text-xl font-bold font-mono text-white leading-tight mt-0.5">
              {m.scheduled ?? 0}
            </div>
          </div>
        </div>

        {/* Failed Bots */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#ff3d57]/15 border border-[#ff3d57]/30 flex items-center justify-center text-[#ff3d57] shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Failed Bots</div>
            <div className="text-xl font-bold font-mono text-white leading-tight mt-0.5">
              {m.failed ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Realized P/L */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl ${realizedPL >= 0 ? 'bg-[#00e676]/15 border-[#00e676]/30 text-[#00e676]' : 'bg-[#ff3d57]/15 border-[#ff3d57]/30 text-[#ff3d57]'} border flex items-center justify-center shrink-0`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Total Realized P/L</div>
            <div className={`text-lg font-bold font-mono ${realizedPL >= 0 ? 'text-[#00e676]' : 'text-[#ff3d57]'} leading-tight mt-0.5`}>
              {realizedPL >= 0 ? '+' : ''}${realizedPL.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Simulated P/L */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#7c4dff]/15 border border-[#7c4dff]/30 flex items-center justify-center text-[#b388ff] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Simulated P/L</div>
            <div className={`text-lg font-bold font-mono ${simulatedPL >= 0 ? 'text-[#00e676]' : 'text-[#ff3d57]'} leading-tight mt-0.5`}>
              {simulatedPL >= 0 ? '+' : ''}${simulatedPL.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00b0ff]/15 border border-[#00b0ff]/30 flex items-center justify-center text-[#00b0ff] shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Active Contracts</div>
            <div className="text-xl font-bold font-mono text-white leading-tight mt-0.5">
              {m.activeContracts ?? 0}
            </div>
          </div>
        </div>

        {/* Risk Status */}
        <div className="p-3.5 rounded-xl bg-[#0a141d] border border-[#132431] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#6d8b9f] font-medium leading-tight">Risk Status</div>
            <div className="text-base font-bold text-[#00e676] leading-tight mt-0.5 uppercase tracking-wide">
              {m.failed > 0 ? 'ALERT' : 'SAFE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
