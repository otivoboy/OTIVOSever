import React, { useState, useEffect } from 'react';
import { DerivAccount } from '../types/index.js';
import { Cloud, Bell, User, LogIn, ChevronDown, Check, LogOut } from 'lucide-react';

interface HeaderProps {
  accounts: DerivAccount[];
  activeAccount?: DerivAccount;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSwitchAccount: (id: string) => void;
  onOpenAccountModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  activeAccount,
  isLoggedIn,
  isLoggingIn,
  onLoginClick,
  onLogoutClick,
  onSwitchAccount,
  onOpenAccountModal
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[now.getUTCMonth()];
      const day = now.getUTCDate();
      const year = now.getUTCFullYear();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${month} ${day}, ${year} | ${hours}:${minutes}:${seconds} (UTC)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-18 px-6 bg-[#080e14] border-b border-[#121f29] flex items-center justify-between gap-4">
      {/* Left: Platform Title and Cloud Icon */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shrink-0">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-wide text-white flex items-center gap-2">
            OTIVO AI CLOUD DERIV UNIVERSAL BOT
          </h1>
          <p className="text-[11px] text-[#69889d] font-normal leading-tight mt-0.5">
            All Deriv Contract Types <span className="mx-1 text-[#334b5c]">|</span> 8 Volatility 1s Markets (10-100) <span className="mx-1 text-[#334b5c]">|</span> 24/7 Cloud Trading
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Cloud Worker Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1822] border border-[#162a38] text-xs">
          <span className="text-[11px] text-[#69889d]">Cloud Worker</span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#00e676]">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            RUNNING
          </span>
        </div>

        {/* Live UTC Clock */}
        <div className="hidden md:block text-xs font-mono text-[#8ca3b5] tracking-tight whitespace-nowrap">
          {currentTime || 'Apr 26, 2025 | 14:32:18 (UTC)'}
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenAccountModal}
          className="relative p-2 rounded-lg bg-[#0c1822] border border-[#162a38] text-[#8ca3b5] hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff3d57] text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Profile matching dashboard */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#0c1822] border border-[#162a38] hover:border-[#203a4c] transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676] font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                <span>{activeAccount ? activeAccount.accountNumber : 'Trader'}</span>
              </div>
              <div className="text-[10px] text-[#55768c] leading-none mt-0.5">
                {activeAccount?.accountType?.toUpperCase() || 'Pro'} Trader
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5e8299] ml-1" />
          </button>

          {/* Account Details Dropdown */}
          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0b1620] border border-[#193040] shadow-2xl p-2 z-50 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-[#162a38] flex items-center justify-between text-[#8ba4b8]">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Deriv Accounts
                </span>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenAccountModal();
                  }}
                  className="text-[11px] text-[#00e676] hover:underline cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {/* Accounts List */}
              <div className="mt-2 space-y-1">
                {accounts.length === 0 ? (
                  <div className="px-3 py-2 text-neutral-500 text-[11px] text-center">
                    No connected accounts
                  </div>
                ) : (
                  accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSwitchAccount(acc.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                        acc.isActive
                          ? 'bg-[#00e676]/15 text-white font-medium border border-[#00e676]/30'
                          : 'hover:bg-[#122230] text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="font-mono font-bold text-white">{acc.accountNumber}</div>
                        <div className="text-[11px] text-[#00e676] font-mono">
                          ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {acc.currency}
                        </div>
                      </div>
                      {acc.isActive && <Check className="w-4 h-4 text-[#00e676]" />}
                    </button>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2 pt-2 border-t border-[#162a38] space-y-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLoginClick();
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-[#00e676] hover:bg-[#162432] flex items-center gap-1.5 text-[11px] cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Another Account</span>
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogoutClick();
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-rose-400 hover:bg-[#162432] flex items-center gap-1.5 text-[11px] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
