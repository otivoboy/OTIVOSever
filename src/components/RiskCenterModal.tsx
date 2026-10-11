import React from 'react';
import { BotRecord, DerivAccount } from '../types/index.js';
import { ShieldAlert, AlertOctagon, CheckCircle2, Square } from 'lucide-react';

interface RiskCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bots: BotRecord[];
  activeAccount?: DerivAccount;
  onEmergencyStopAll: () => Promise<void>;
}

export const RiskCenterModal: React.FC<RiskCenterModalProps> = ({
  isOpen,
  onClose,
  bots,
  onEmergencyStopAll
}) => {
  if (!isOpen) return null;

  const runningBots = bots.filter(b => b.status === 'RUNNING');
  const totalOpenStake = runningBots.reduce((acc, b) => acc + b.risk.stakeAmount, 0);
  const totalMaxDailyLoss = bots.reduce((acc, b) => acc + b.risk.maxDailyLoss, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Centralized Capital Protection</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-lg"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Emergency Kill Switch */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              <span>Emergency Cloud Kill-Switch</span>
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Instantly halts all active background workers across all synthetic markets. Prevents any new proposal or buy orders while monitoring active contracts to completion.
            </p>
            <button
              onClick={onEmergencyStopAll}
              disabled={runningBots.length === 0}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Halt All {runningBots.length} Running Bots Now</span>
            </button>
          </div>

          {/* Aggregate Risk Invariants */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Aggregate Exposure & Safety Limits
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Active Exposure</div>
                <div className="text-base font-mono font-bold text-white mt-1">
                  ${totalOpenStake.toFixed(2)} USD
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-500">Max Aggregate Loss Cap</div>
                <div className="text-base font-mono font-bold text-rose-400 mt-1">
                  ${totalMaxDailyLoss.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>

          {/* Active Protection Policies */}
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2 p-2 rounded bg-neutral-950/50 border border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Post-trade cooldown enforced to eliminate emotional revenge trading.</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-neutral-950/50 border border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Consecutive loss circuit breaker triggers automatic worker freeze.</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-neutral-950/50 border border-neutral-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Separate demo/real accounting guarantees virtual tests never place real orders.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
