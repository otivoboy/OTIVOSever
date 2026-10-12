import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/root-store.js';
import { cn, getUserIdentity } from '../lib/utils.js';
import { botEngine } from '../lib/botEngine.js';
import { useOauth2 } from '../hooks/useOauth2.js';

interface LayoutProps {
  children: React.ReactNode;
}

interface AccountInfo {
  balance: string;
  currency: string;
  loginid: string;
  is_virtual: boolean;
  fullname?: string;
  email?: string;
}

export default observer(function Layout({ children }: LayoutProps) {
  const [isDarkMode] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' GMT');
  const activeAccountType = rootStore.client.accountType;
  const setActiveAccountType = (type: 'real' | 'demo') => rootStore.client.setAccountType(type);
  const isConnected = rootStore.client.isConnected;
  const isConnecting = rootStore.client.isConnecting;
  const setIsConnected = (v: boolean) => rootStore.client.setIsConnected(v);
  const setIsConnecting = (v: boolean) => rootStore.client.setIsConnecting(v);
  const [isSessionActive, setIsSessionActive] = useState(() => {
    return (
      !!localStorage.getItem('deriv_oauth_access_token') ||
      !!localStorage.getItem('deriv_user_token') ||
      !!localStorage.getItem('deriv_api_token')
    );
  });
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(() => {
    const token =
      localStorage.getItem('deriv_oauth_access_token') ||
      localStorage.getItem('deriv_user_token') ||
      localStorage.getItem('deriv_api_token');
    const accId = localStorage.getItem('deriv_options_account_id');
    const accType = localStorage.getItem('deriv_active_account_type') || 'real';
    const balance = localStorage.getItem('deriv_cached_balance') || '0';
    const currency = localStorage.getItem('deriv_cached_currency') || 'USD';
    
    if (accId) {
      return {
        balance,
        currency,
        loginid: accId,
        is_virtual: accType === 'demo',
      };
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Privacy Lock states
  const [savedPassword] = useState(() => {
    return localStorage.getItem('privacy_lock_password') || '';
  });

  // Unlocked state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const isEnabled = localStorage.getItem('privacy_lock_enabled') === 'true';
    const hasPass = !!localStorage.getItem('privacy_lock_password');
    return !(isEnabled && hasPass);
  });

  // Biometrics States
  const [isBiometricRegistered] = useState(() => {
    return localStorage.getItem('privacy_lock_biometric_registered') === 'true';
  });
  const [biometricType, setBiometricType] = useState<'standard' | 'on-display'>(() => {
    return (localStorage.getItem('privacy_lock_biometric_type') as 'standard' | 'on-display') || 'standard';
  });

  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { 
    login: triggerDerivLogin, 
    exchangeCodeForToken,
    fetchAccounts
  } = useOauth2();

  const connectAccount = async (accId: string, type: string) => {
    setError(null);
    try {
      const at =
        localStorage.getItem('deriv_oauth_access_token') ||
        localStorage.getItem('deriv_user_token') ||
        localStorage.getItem('deriv_api_token');

      localStorage.setItem('deriv_options_account_id', accId);
      localStorage.setItem('deriv_active_account_type', type);
      rootStore.client.setLoginId(accId);
      setIsConnecting(true);
      rootStore.client.setIsConnecting(true);

      if (at) {
        if (localStorage.getItem('deriv_oauth_access_token')) {
          await botEngine.establishConnection(at, accId, 'oauth');
        } else {
          botEngine.setToken(at);
        }
      } else {
        botEngine.ensureWebSocketConnection();
      }
      
      setIsSessionActive(true);
      setAccountInfo({
        balance: rootStore.client.balance.toString(),
        currency: rootStore.client.currency,
        loginid: accId,
        is_virtual: type === 'demo',
      });
    } catch (err: any) {
      console.error('Connection error:', err);
      const msg = err.message || '';
      if (
        msg.includes('401') || 
        msg.includes('403') || 
        msg.toLowerCase().includes('expired')
      ) {
        disconnectFromDeriv();
      } else {
        setError(err.message || 'Failed to establish connection');
      }
    } finally {
      setIsConnecting(false);
      rootStore.client.setIsConnecting(false);
    }
  };

  const reconnectOauth = async () => {
    localStorage.removeItem('deriv_legacy_token');
    localStorage.setItem('deriv_connection_type', 'oauth');
    let accId = localStorage.getItem('deriv_options_account_id');
    const at = localStorage.getItem('deriv_oauth_access_token');
    let type = localStorage.getItem('deriv_active_account_type') || 'demo';

    if (at && !isConnecting) {
      try {
        setIsConnecting(true);
        rootStore.client.setIsConnecting(true);
        if (!accId) {
          const accounts = await fetchAccounts(at);
          if (accounts && accounts.length > 0) {
            const firstAcc = accounts[0];
            accId = firstAcc.account_id || firstAcc.id;
            type = firstAcc.account_type || 'demo';
            localStorage.setItem('deriv_options_account_id', accId!);
            localStorage.setItem('deriv_active_account_type', type);
            localStorage.setItem('accountsList', JSON.stringify(accounts));
            rootStore.client.setLoginId(accId!);
          }
        }
        if (accId) {
          await connectAccount(accId, type);
        } else {
          setIsConnecting(false);
          rootStore.client.setIsConnecting(false);
        }
      } catch (err: any) {
        console.error('Reconnect error:', err);
        const msg = err.message || '';
        if (
          msg.includes('401') || 
          msg.includes('403') || 
          msg.toLowerCase().includes('unauthorized') || 
          msg.toLowerCase().includes('token') || 
          msg.toLowerCase().includes('expired')
        ) {
          disconnectFromDeriv();
        } else {
          setError(err.message || 'Failed to reconnect');
        }
        setIsConnecting(false);
        rootStore.client.setIsConnecting(false);
      }
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const returnedState = params.get('state');
      const savedState = sessionStorage.getItem('oauth_state');
      
      if (params.has('code') || params.has('acct1')) {
        if (returnedState && savedState && returnedState !== savedState) {
          setError('Security Error: Auth state mismatch');
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        sessionStorage.removeItem('oauth_state');
      }

      if (params.has('code')) {
        const code = params.get('code')!;
        const verifier = sessionStorage.getItem('pkce_code_verifier');
        
        if (code && verifier) {
          setIsConnecting(true);
          rootStore.client.setIsConnecting(true);
          try {
            const data = await exchangeCodeForToken(code, verifier);
            if (data.access_token) {
              const accounts = await fetchAccounts(data.access_token);
              if (accounts && accounts.length > 0) {
                const firstAcc = accounts[0];
                const accId = firstAcc.account_id || firstAcc.id;
                const accType = firstAcc.account_type || 'demo';
                
                // Persist session
                localStorage.setItem('deriv_oauth_access_token', data.access_token);
                if (data.refresh_token) {
                  localStorage.setItem('deriv_oauth_refresh_token', data.refresh_token);
                }
                localStorage.setItem('deriv_options_account_id', accId);
                localStorage.setItem('deriv_connection_type', 'oauth');
                localStorage.removeItem('deriv_legacy_token');
                rootStore.client.setLoginId(accId);
                localStorage.setItem('deriv_active_account_type', accType);
                localStorage.setItem('accountsList', JSON.stringify(accounts));
                
                setActiveAccountType(accType as 'real' | 'demo');
                setIsSessionActive(true);
                
                await connectAccount(accId, accType);
              }
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (err: any) {
            setError(err.message || 'Token exchange failed');
            setIsConnecting(false);
            rootStore.client.setIsConnecting(false);
          } finally {
            sessionStorage.removeItem('pkce_code_verifier');
          }
        }
      }
    };
    handleAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' GMT');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.removeItem('deriv_legacy_token');
    if (localStorage.getItem('deriv_connection_type') === 'legacy') {
      localStorage.setItem('deriv_connection_type', 'oauth');
    }
    if (isSessionActive && !isConnected && !isConnecting) {
      reconnectOauth();
    }
  }, []);

  const switchAccount = async (type: 'real' | 'demo') => {
    if (type === activeAccountType && isConnected) return;
    const at = localStorage.getItem('deriv_oauth_access_token');
    const accountsJson = localStorage.getItem('accountsList');
    
    if (!at || !accountsJson) {
      setActiveAccountType(type);
      localStorage.setItem('deriv_active_account_type', type);
      setIsAccountDropdownOpen(false);
      botEngine.initTokenFromStorage();
      return;
    }
    let targetAccount: any;
    try {
      const accounts = JSON.parse(accountsJson);
      targetAccount = accounts.find((acc: any) => acc.account_type === type);
    } catch {}

    const accId = targetAccount ? (targetAccount.account_id || targetAccount.id) : (localStorage.getItem('deriv_options_account_id') || 'CR_ACTIVE');
    
    setIsConnecting(true);
    rootStore.client.setIsConnecting(true);
    setIsConnected(false);
    setIsAccountDropdownOpen(false);
    setActiveAccountType(type);
    localStorage.setItem('deriv_options_account_id', accId);
    localStorage.setItem('deriv_active_account_type', type);
    rootStore.client.setLoginId(accId);
    
    botEngine.loadTransactions();
    
    try {
      await connectAccount(accId, type);
    } catch (err: any) {
      console.error('Switch account error:', err);
      setError(err.message || 'Failed to switch account');
      setIsConnecting(false);
      rootStore.client.setIsConnecting(false);
    }
  };

  const disconnectFromDeriv = () => {
    botEngine.disconnect();
    
    localStorage.removeItem('deriv_oauth_access_token');
    localStorage.removeItem('deriv_oauth_refresh_token');
    localStorage.removeItem('deriv_options_account_id');
    localStorage.removeItem('deriv_active_account_type');
    localStorage.removeItem('accountsList');
    localStorage.removeItem('deriv_connection_type');
    localStorage.removeItem('deriv_legacy_token');
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('oauth_state');
    
    setIsSessionActive(false);
    setIsConnected(false);
    setIsConnecting(false);
    setAccountInfo(null);
    rootStore.client.setLoginId('');
    botEngine.transactions = [];
  };

  const resetBalance = async () => {
    botEngine.send({ topup_virtual: 1 });
  };

  return (
    <div className={cn(
      "h-[100dvh] flex flex-col transition-colors duration-300 overflow-hidden",
      isDarkMode ? "bg-[#0e0e0e] text-white theme--dark" : "bg-[#f8f9fa] text-[#2a2e2f]"
    )}>
      {/* Header */}
      <header className="bg-[#151717] px-5 py-2.5 flex justify-between items-center border-b border-[#2d2f2f] shrink-0">
        <div className="flex items-center gap-5">
          <div className="h-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Bot size={20} />
            </div>
            <span className="text-xl lg:text-2xl font-bold title-shine text-white">OTIVO AI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isSessionActive ? (
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center gap-1.5 bg-transparent rounded-lg transition-all"
              >
                <div 
                  onClick={() => {
                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                    if (!isConnected && !isConnecting) {
                      reconnectOauth();
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#2d2f2f]/50 rounded-lg transition-all cursor-pointer group"
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-emerald-400" />
                      <span className="text-xs text-neutral-400">Connecting...</span>
                    </div>
                  ) : (
                    <>
                      {activeAccountType === 'demo' ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <circle cx="100" cy="100" r="90" fill="#89A9AD" />
                            <g fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="80" y1="50" x2="80" y2="150" />
                              <path d="M65,50 H110 C155,50 155,150 110,150 H65" />
                              <line x1="65" y1="83" x2="110" y2="83" />
                              <line x1="65" y1="117" x2="110" y2="117" />
                            </g>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-[#2d2f2f] flex items-center justify-center bg-white">
                          <img 
                            src="https://flagcdn.com/w80/us.png" 
                            alt="USA" 
                            className="w-full h-full object-cover scale-125"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex flex-col items-start leading-none pr-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={rootStore.client.balance}
                            initial={{ opacity: 0.8, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-bold transition-all duration-500 text-[#00a79e]"
                          >
                            {rootStore.client.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {rootStore.client.currency || 'USD'}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                  <ChevronDown size={14} className={cn("text-[#aaaaaa] transition-transform duration-200", isAccountDropdownOpen && "rotate-180")} />
                </div>
              </div>

              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[#151717] border border-[#2d2f2f] rounded-lg shadow-2xl z-[1000] overflow-hidden"
                  >
                    {/* Tabs */}
                    <div className="flex border-b border-[#2d2f2f]">
                      <button 
                        onClick={() => switchAccount('real')}
                        className={cn(
                          "flex-1 py-3 text-sm font-bold transition-colors cursor-pointer",
                          activeAccountType === 'real' ? "text-white border-b-2 border-[#ff444f]" : "text-[#aaaaaa] hover:text-white"
                        )}
                      >
                        Real
                      </button>
                      <button 
                        onClick={() => switchAccount('demo')}
                        className={cn(
                          "flex-1 py-3 text-sm font-bold transition-colors cursor-pointer",
                          activeAccountType === 'demo' ? "text-white border-b-2 border-[#ff444f]" : "text-[#aaaaaa] hover:text-white"
                        )}
                      >
                        Demo
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Accounts
                        </span>
                        <ChevronUp size={14} className="text-[#aaaaaa]" />
                      </div>

                      {isConnected && accountInfo ? (
                        accountInfo.is_virtual ? (
                          <div className="flex items-center justify-between bg-[#2d2f2f]/30 p-3 rounded-lg border border-[#2d2f2f]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                  <circle cx="100" cy="100" r="90" fill="#89A9AD" />
                                  <g fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="80" y1="50" x2="80" y2="150" />
                                    <path d="M65,50 H110 C155,50 155,150 110,150 H65" />
                                    <line x1="65" y1="83" x2="110" y2="83" />
                                    <line x1="65" y1="117" x2="110" y2="117" />
                                  </g>
                                </svg>
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-white truncate">{getUserIdentity()}</span>
                                <span className="text-[10px] text-[#aaaaaa]">{accountInfo.loginid}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                resetBalance();
                                setIsAccountDropdownOpen(false);
                              }}
                              className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Reset balance
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-[#2d2f2f]/30 p-3 rounded-lg border border-[#2d2f2f]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2d2f2f] flex items-center justify-center bg-white">
                                <img 
                                  src="https://flagcdn.com/w80/us.png" 
                                  alt="USA" 
                                  className="w-full h-full object-cover scale-125"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-white truncate">{getUserIdentity()}</span>
                                <span className="text-[10px] text-[#aaaaaa]">{accountInfo.loginid}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-[#00a79e]">
                                {rootStore.client.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {rootStore.client.currency}
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center p-8 bg-[#2d2f2f]/20 rounded-lg border border-dashed border-[#2d2f2f]">
                          <div className="flex flex-col items-center gap-2">
                             <RefreshCw size={20} className={cn("text-emerald-400", (isConnecting || !isConnected) && "animate-spin")} />
                             <span className="text-[10px] uppercase font-black tracking-widest text-[#555]">
                               {isConnecting ? "Stabilizing Link..." : "Link Offline - Reconnecting..."}
                             </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-black/10 border-t border-[#2d2f2f]">
                      <p className="text-[11px] text-[#aaaaaa] text-center">
                        Secure <span className="text-white font-bold">API Matrix</span> active
                      </p>
                    </div>

                    <div className="grid grid-cols-2 border-t border-[#2d2f2f] divide-x divide-[#2d2f2f]">
                      <button 
                        id="balance-dropdown-settings-button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          navigate('/settings');
                        }}
                        className="py-3 text-xs text-[#aaaaaa] hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
                        title="Application & Security Settings"
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button 
                        onClick={disconnectFromDeriv}
                        className="py-3 text-xs text-[#ff444f] hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 relative" ref={loginMenuRef}>
              <a 
                href="https://track.deriv.com/_7AxquF9zNvT1hit6RV3zsGNd7ZgqdRLk/1/"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#ff444f] text-[#ff444f] hover:bg-[#ff444f]/10 px-5 py-2 rounded-lg flex items-center justify-center font-bold transition-all h-10 text-sm uppercase tracking-wide cursor-pointer"
              >
                Sign up
              </a>
              <button 
                onClick={triggerDerivLogin}
                disabled={isConnecting}
                className={cn(
                  "bg-[#ff444f] text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-all hover:bg-[#e63e48] group h-10 shadow-lg shadow-red-500/20 cursor-pointer",
                  isConnecting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isConnecting && <RefreshCw size={18} className="animate-spin mr-2" />}
                <span className="text-sm uppercase tracking-wide">Log in</span>
              </button>
              
              {error && (
                <div className="text-[10px] text-red-500 max-w-[150px] leading-tight animate-pulse bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#151717] px-5 py-2.5 hidden md:flex justify-between items-center border-t border-[#2d2f2f] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]"></div>
          <span className="text-xs text-[#aaaaaa]">{currentDateTime}</span>
        </div>
      </footer>

      {/* Privacy Lock Full-Screen Lock Overlay */}
      <AnimatePresence>
        {!isUnlocked && (
          <div className="fixed inset-0 z-[99999] bg-[#0d0e10] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#15171a] border border-[#222428] rounded-3xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] text-center space-y-6"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <Lock className="w-9 h-9 text-rose-500 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">App Locked</h2>
                <p className="text-xs text-slate-400 max-w-[300px] mx-auto leading-relaxed font-medium">
                  This device is secured by your privacy pin. Enter your password to continue.
                </p>
              </div>

              {unlockError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                  {unlockError}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type={showUnlockPassword ? "text" : "password"}
                    value={unlockPasswordInput}
                    onChange={(e) => setUnlockPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (unlockPasswordInput === savedPassword) {
                          setIsUnlocked(true);
                          setUnlockPasswordInput('');
                          setUnlockError(null);
                        } else {
                          setUnlockError("Incorrect password. Try again.");
                        }
                      }
                    }}
                    placeholder="Enter password..."
                    className="w-full bg-[#0d0f11] border border-[#222428] rounded-xl pl-5 pr-12 py-3.5 text-sm text-white placeholder:text-[#3f434c] focus:outline-none focus:border-rose-500/50 transition-all text-center font-mono font-bold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {showUnlockPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (unlockPasswordInput === savedPassword) {
                      setIsUnlocked(true);
                      setUnlockPasswordInput('');
                      setUnlockError(null);
                    } else {
                      setUnlockError("Incorrect password. Try again.");
                    }
                  }}
                  className="w-full bg-[#ff444f] hover:bg-[#e63e48] text-white py-4 rounded-xl text-xs font-black transition-all shadow-xl shadow-red-500/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock size={14} />
                  UNLOCK APPLICATION
                </button>

                {isBiometricRegistered && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlocked(true);
                    }}
                    className="w-full bg-[#1e2025] hover:bg-[#25282f] border border-[#2f323a] text-slate-200 py-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Fingerprint size={16} className="text-[#00a79e]" />
                    UNLOCK WITH FINGERPRINT
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
