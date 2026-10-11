import React, { useState } from 'react';
import { DerivAccount } from '../types/index.js';
import {
  Cpu,
  Plus,
  LogIn,
  LogOut,
  ChevronDown,
  Check
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accounts: DerivAccount[];
  activeAccount?: DerivAccount;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSwitchAccount: (id: string) => void;
  onOpenAccountModal: () => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  accounts,
  activeAccount,
  isLoggedIn,
  isLoggingIn,
  onLoginClick,
  onLogoutClick,
  onSwitchAccount,
  onOpenAccountModal,
  onOpenCreateModal
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const demoAccounts = accounts.filter(a => a.accountType === 'demo');
  const realAccounts = accounts.filter(a => a.accountType === 'real');

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
              <Cpu className="w-4 h-4" />
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
              className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-1.5"
            >
              <span>OTIVO</span>
              <span className="text-emerald-400 font-semibold">AI BOT</span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                DERIV CLOUD
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 py-5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`transition-colors whitespace-nowrap shrink-0 py-5 cursor-pointer ${
                activeTab === 'markets'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Synthetic Markets
            </button>
            <button
              onClick={() => setActiveTab('worker')}
              className={`transition-colors whitespace-nowrap shrink-0 py-5 cursor-pointer ${
                activeTab === 'worker'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              24/7 Cloud Worker
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`transition-colors whitespace-nowrap shrink-0 py-5 cursor-pointer ${
                activeTab === 'trades'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Trade Ledger
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`transition-colors whitespace-nowrap shrink-0 py-5 cursor-pointer ${
                activeTab === 'risk'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Risk Engine
            </button>
          </nav>

          {/* Zone 3: Account Selector & Login & Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* If Logged In: Account switcher dropdown */}
            {isLoggedIn && activeAccount ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800/80 transition-all text-xs cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activeAccount.accountType === 'real' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <div className="text-left font-mono">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-bold text-white">{activeAccount.accountNumber}</span>
                      <span className={`text-[9px] uppercase font-bold px-1 rounded ${
                        activeAccount.accountType === 'real'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {activeAccount.accountType}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-semibold mt-0.5">
                      ${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeAccount.currency}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                </button>

                {/* Dropdown Menu for Demo / Real Accounts */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between text-neutral-400">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Deriv Client Accounts
                      </span>
                      <button
                        onClick={onOpenAccountModal}
                        className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>

                    {/* Real Accounts Section */}
                    <div className="mt-2">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Real Accounts
                      </div>
                      {realAccounts.length === 0 ? (
                        <div className="px-3 py-1.5 text-neutral-500 text-[11px]">
                          No real account connected
                        </div>
                      ) : (
                        realAccounts.map(acc => (
                          <button
                            key={acc.id}
                            onClick={() => {
                              onSwitchAccount(acc.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                              acc.isActive
                                ? 'bg-emerald-950/40 text-white font-medium border border-emerald-800/40'
                                : 'hover:bg-neutral-800/50 text-neutral-300'
                            }`}
                          >
                            <div>
                              <div className="font-mono font-bold text-white">{acc.accountNumber}</div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {acc.currency}
                              </div>
                            </div>
                            {acc.isActive && <Check className="w-4 h-4 text-emerald-400" />}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Demo Accounts Section */}
                    <div className="mt-2 pt-2 border-t border-neutral-800/80">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        Demo Sandbox Accounts
                      </div>
                      {demoAccounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onSwitchAccount(acc.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                            acc.isActive
                              ? 'bg-amber-950/40 text-white font-medium border border-amber-800/40'
                              : 'hover:bg-neutral-800/50 text-neutral-300'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-white">{acc.accountNumber}</div>
                            <div className="text-[11px] text-neutral-400 font-mono">
                              ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {acc.currency}
                            </div>
                          </div>
                          {acc.isActive && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      ))}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between px-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenAccountModal();
                        }}
                        className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded cursor-pointer"
                      >
                        Account Details
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogoutClick();
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* If Not Logged In: Deriv OAuth Login Button */
              <button
                onClick={onLoginClick}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-[#ff444f] hover:bg-[#ea3943] rounded-lg transition-all shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoggingIn ? 'Connecting...' : 'Log in with Deriv'}</span>
              </button>
            )}

            {/* Primary Action Button: Create Cloud Bot */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-sm shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Cloud Bot</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
