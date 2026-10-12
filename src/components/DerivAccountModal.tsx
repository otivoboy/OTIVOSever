import React, { useState } from 'react';
import { DerivAccount } from '../types/index.js';
import { X, Wallet, Check, Plus, AlertCircle, Trash2 } from 'lucide-react';

interface DerivAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: DerivAccount[];
  onSwitchAccount: (id: string) => Promise<void>;
  onConnectAccount: (params: {
    token: string;
    accountNumber: string;
    accountType: 'demo' | 'real';
    currency?: string;
  }) => Promise<void>;
  onDisconnectAccount: (id: string) => Promise<void>;
}

export const DerivAccountModal: React.FC<DerivAccountModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSwitchAccount,
  onConnectAccount,
  onDisconnectAccount
}) => {
  const [token, setToken] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'demo' | 'real'>('real');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !accountNumber) {
      setError('Please provide your Deriv API token and Account Number');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConnectAccount({
        token,
        accountNumber,
        accountType,
        currency
      });
      setToken('');
      setAccountNumber('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Deriv Accounts & Authorization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Active Accounts List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Connected Accounts
            </h3>
            <div className="space-y-2">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    acc.isActive
                      ? 'bg-neutral-950 border-emerald-500/50 shadow-sm'
                      : 'bg-neutral-950/60 border-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{acc.accountNumber}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        acc.accountType === 'demo'
                          ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                          : 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                      }`}>
                        {acc.accountType}
                      </span>
                      {acc.isActive && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono tabular-nums text-neutral-400 mt-1">
                      Balance: ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {acc.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!acc.isActive && (
                      <button
                        onClick={() => onSwitchAccount(acc.id)}
                        className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => onDisconnectAccount(acc.id)}
                      title="Disconnect Account"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connect New Account Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connect New Deriv Account</span>
            </h3>
            {error && (
              <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountType('real')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  accountType === 'real'
                    ? 'bg-emerald-500 text-[#071118]'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Real Account (CR...)
              </button>
              <button
                type="button"
                onClick={() => setAccountType('demo')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  accountType === 'demo'
                    ? 'bg-amber-500 text-[#071118]'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Demo Account (VRTC...)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Account Number ({accountType === 'real' ? 'CR...' : 'VRTC...'})
                </label>
                <input
                  type="text"
                  placeholder={accountType === 'real' ? 'e.g. CR123456' : 'e.g. VRTC123456'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Account Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="USD"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white uppercase font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">API Token</label>
              <input
                type="password"
                placeholder="Paste your Deriv API token (read/trade scopes)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Generated via Deriv.com &rarr; Account Settings &rarr; API Token. Tokens are securely encrypted on the backend.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Verifying with Deriv...' : 'Authorize & Connect'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
