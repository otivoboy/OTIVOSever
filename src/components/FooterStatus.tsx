import React from 'react';
import { CheckCircle2, Database, Clock, Radio, Activity } from 'lucide-react';

interface FooterStatusProps {
  serverOnline?: boolean;
  derivConnected?: boolean;
  dbConnected?: boolean;
  schedulerRunning?: boolean;
  lastHeartbeat?: string;
}

export const FooterStatus: React.FC<FooterStatusProps> = ({
  serverOnline = true,
  derivConnected = true,
  dbConnected = true,
  schedulerRunning = true,
  lastHeartbeat = '2m ago'
}) => {
  return (
    <footer className="h-12 px-6 bg-[#080e14] border-t border-[#121f29] flex items-center justify-between text-xs text-[#6e8d9f]">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {/* Server Status */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#55768c] block leading-none">Server Status</span>
            <span className="text-[11px] font-semibold text-white leading-tight">Online</span>
          </div>
        </div>

        {/* Deriv API */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#55768c] block leading-none">Deriv API</span>
            <span className="text-[11px] font-semibold text-white leading-tight">Connected</span>
          </div>
        </div>

        {/* Database */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#55768c] block leading-none">Database</span>
            <span className="text-[11px] font-semibold text-white leading-tight">Connected</span>
          </div>
        </div>

        {/* Scheduler */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#55768c] block leading-none">Scheduler</span>
            <span className="text-[11px] font-semibold text-white leading-tight">Running</span>
          </div>
        </div>

        {/* Worker Heartbeat */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676]">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-[#55768c] block leading-none">Worker Heartbeat</span>
            <span className="text-[11px] font-semibold text-white leading-tight">{lastHeartbeat}</span>
          </div>
        </div>
      </div>

      {/* Right System Operating Normally badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c1822] border border-[#162734] text-[11px] font-medium text-[#00e676] shrink-0">
        <Activity className="w-3.5 h-3.5 text-[#00e676]" />
        <span>System operating normally</span>
      </div>
    </footer>
  );
};
