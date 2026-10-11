import React, { useState } from 'react';
import { Calculator, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RmcCalculator: React.FC = () => {
  const [balance, setBalance] = useState<number>(1000);
  const [baseStake, setBaseStake] = useState<number>(1.00);
  const [multiplier, setMultiplier] = useState<number>(2.1);
  const [maxSteps, setMaxSteps] = useState<number>(6);
  const [payoutRate, setPayoutRate] = useState<number>(95.3); // 95.3% typical for Rise/Fall

  // Calculate martingale progression
  const progression = [];
  let cumLoss = 0;
  for (let step = 1; step <= maxSteps; step++) {
    const stake = step === 1 ? baseStake : Math.round(baseStake * Math.pow(multiplier, step - 1) * 100) / 100;
    cumLoss += stake;
    const grossPayout = Math.round(stake * (1 + payoutRate / 100) * 100) / 100;
    const netProfitOnWin = Math.round((grossPayout - cumLoss) * 100) / 100;
    const balanceRemaining = Math.max(0, Math.round((balance - cumLoss) * 100) / 100);

    progression.push({
      step,
      stake,
      cumLoss,
      grossPayout,
      netProfitOnWin,
      balanceRemaining,
      isAffordable: cumLoss <= balance
    });
  }

  const maxLossRequired = progression[progression.length - 1]?.cumLoss || 0;
  const isSafe = balance >= maxLossRequired;
  const riskRatio = balance > 0 ? Math.round((maxLossRequired / balance) * 100) : 100;

  return (
    <div className="space-y-5 p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Deriv RMC (Risk & Money Management) Calculator
          </h2>
          <p className="text-xs text-[#6e8e9f] mt-0.5">
            Evaluate capital adequacy, calculate Martingale & recovery drawdown, and verify risk parameters.
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
          isSafe 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {isSafe ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          <span>{isSafe ? 'CAPITAL ADEQUATE' : 'CAPITAL INSUFFICIENT'}</span>
          <span className="text-[10px] opacity-75">({riskRatio}% of Balance)</span>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl bg-[#0a141d] border border-[#132431]">
        <div>
          <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
            Account Balance ($)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full bg-[#071118] border border-[#142634] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
            Initial Base Stake ($)
          </label>
          <input
            type="number"
            step="0.1"
            value={baseStake}
            onChange={(e) => setBaseStake(Math.max(0.35, parseFloat(e.target.value) || 0.35))}
            className="w-full bg-[#071118] border border-[#142634] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
            Multiplier (Recovery)
          </label>
          <input
            type="number"
            step="0.05"
            value={multiplier}
            onChange={(e) => setMultiplier(Math.max(1.1, parseFloat(e.target.value) || 1.1))}
            className="w-full bg-[#071118] border border-[#142634] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
            Consecutive Losses
          </label>
          <input
            type="number"
            min="1"
            max="15"
            value={maxSteps}
            onChange={(e) => setMaxSteps(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full bg-[#071118] border border-[#142634] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#55768c] font-semibold uppercase block mb-1">
            Deriv Payout Rate (%)
          </label>
          <input
            type="number"
            step="0.5"
            value={payoutRate}
            onChange={(e) => setPayoutRate(Math.max(1, parseFloat(e.target.value) || 95))}
            className="w-full bg-[#071118] border border-[#142634] rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Progression Table */}
      <div className="rounded-xl bg-[#0a141d] border border-[#132431] overflow-hidden">
        <div className="p-3 border-b border-[#132431] flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Stake Recovery Progression Sequence
          </span>
          <span className="text-[#6e8e9f]">
            Required Capital: <strong className="text-white font-mono">${maxLossRequired.toFixed(2)} USD</strong>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#071118] text-[#55768c] text-[10px] uppercase border-b border-[#132431]">
                <th className="py-2.5 px-4 font-bold">Step</th>
                <th className="py-2.5 px-4 font-bold">Trade Stake</th>
                <th className="py-2.5 px-4 font-bold">Cumulative Risk</th>
                <th className="py-2.5 px-4 font-bold">Gross Win Payout</th>
                <th className="py-2.5 px-4 font-bold">Net Profit on Win</th>
                <th className="py-2.5 px-4 font-bold">Remaining Balance</th>
                <th className="py-2.5 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0e1b26]">
              {progression.map((row) => (
                <tr key={row.step} className={row.isAffordable ? 'hover:bg-[#0e1b26]/50' : 'bg-rose-500/5'}>
                  <td className="py-2 px-4 text-neutral-400 font-bold">#{row.step}</td>
                  <td className="py-2 px-4 font-bold text-white">${row.stake.toFixed(2)}</td>
                  <td className="py-2 px-4 text-amber-400">${row.cumLoss.toFixed(2)}</td>
                  <td className="py-2 px-4 text-neutral-300">${row.grossPayout.toFixed(2)}</td>
                  <td className={`py-2 px-4 font-bold ${row.netProfitOnWin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.netProfitOnWin >= 0 ? '+' : ''}${row.netProfitOnWin.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-neutral-400">${row.balanceRemaining.toFixed(2)}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.isAffordable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {row.isAffordable ? 'SAFE' : 'BUST RISK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
