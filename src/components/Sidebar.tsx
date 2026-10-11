import React from 'react';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  TrendingUp,
  FileText,
  Wallet,
  History,
  BarChart2,
  Terminal,
  Settings,
  Shield
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateBot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateBot
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-bots', label: 'My Bots', icon: Bot },
    { id: 'create-bot', label: 'Create Bot', icon: PlusCircle, isAction: true },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'deriv-accounts', label: 'Deriv Accounts', icon: Wallet },
    { id: 'trade-history', label: 'Trade History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 shrink-0 bg-[#080e14] border-r border-[#121f29] flex flex-col justify-between p-4 min-h-screen select-none">
      <div>
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            {/* Emerald Swirl Icon */}
            <svg viewBox="0 0 36 36" className="w-9 h-9 fill-none">
              <circle cx="18" cy="18" r="16" stroke="#00e676" strokeWidth="2.5" strokeDasharray="60 30" strokeLinecap="round" />
              <circle cx="18" cy="18" r="10" stroke="#00b0ff" strokeWidth="2" strokeDasharray="35 25" strokeLinecap="round" />
              <circle cx="18" cy="18" r="4.5" fill="#00e676" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black tracking-wider text-white flex items-center">
              OTIVO <span className="text-[#00e676] ml-1">AI</span>
            </div>
            <div className="text-[8.5px] uppercase tracking-widest text-[#52788e] font-medium leading-none mt-0.5">
              TRADE SMARTER   GROW FASTER
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAction) {
                    onOpenCreateBot();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00e676]/10 text-[#00e676] font-semibold border border-[#00e676]/30 shadow-sm shadow-[#00e676]/10'
                    : 'text-[#87a1b5] hover:text-white hover:bg-[#0d1822]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00e676]' : 'text-[#5d7c92]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#0c1923] to-[#071118] border border-[#162a38] text-center space-y-2 mt-6">
        <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center mx-auto text-[#00e676]">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Trade with Confidence</div>
          <div className="text-[10px] text-[#5e8299] mt-0.5">Powerful. Flexible. 24/7.</div>
        </div>
        <div className="pt-1">
          <span className="inline-block text-[10px] font-bold text-[#00e676] px-2.5 py-1 rounded-md border border-[#00e676]/40 bg-[#00e676]/5">
            OTIVO AI
          </span>
        </div>
      </div>
    </aside>
  );
};
