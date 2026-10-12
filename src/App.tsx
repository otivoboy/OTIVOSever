import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from './stores/root-store.js';
import { api } from './services/api.js';
import { botEngine } from './lib/botEngine.js';
import {
  BotRecord,
  DerivAccount,
  MarketSymbolInfo,
  ContractSpecification,
  TradeRecord,
  AuditLogRecord,
  WorkerStatusPayload,
  AnalyticsPayload
} from './types/index.js';
import {
  DEFAULT_STANDARD_8_MARKETS,
  DEFAULT_CATALOGUE_OPTIONS,
  DEFAULT_CONTRACTS
} from './constants/markets.js';
import Layout from './components/Layout.js';
import { MetricsCards } from './components/MetricsCards.js';
import { MarketsSection } from './components/MarketsSection.js';
import { ContractsSection } from './components/ContractsSection.js';
import { RecentTradesSection } from './components/RecentTradesSection.js';
import { ActiveBotPanel } from './components/ActiveBotPanel.js';
import { BotWizardModal } from './components/BotWizardModal.js';
import { TradeHistoryTable } from './components/TradeHistoryTable.js';
import { LiveExecutionTerminal } from './components/LiveExecutionTerminal.js';
import { ServerHealthMonitor } from './components/ServerHealthMonitor.js';
import { DerivAccountModal } from './components/DerivAccountModal.js';
import { RiskCenterModal } from './components/RiskCenterModal.js';

export default observer(function App() {
  // Application Data State - preloaded with defaults so Netlify NEVER renders a blank screen
  const [accounts, setAccounts] = useState<DerivAccount[]>([]);
  const [markets, setMarkets] = useState<MarketSymbolInfo[]>(DEFAULT_STANDARD_8_MARKETS);
  const [catalogueOptions, setCatalogueOptions] = useState<MarketSymbolInfo[]>(DEFAULT_CATALOGUE_OPTIONS);
  const [contracts, setContracts] = useState<ContractSpecification[]>(DEFAULT_CONTRACTS);
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatusPayload | undefined>();
  const [analytics, setAnalytics] = useState<AnalyticsPayload | undefined>();

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [preselectedMarket, setPreselectedMarket] = useState<string | undefined>();

  const activeAccount = accounts.find(a => a.isActive) || accounts[0];
  const activeBot = bots.find(b => b.status === 'RUNNING') || bots[0];

  // Helper to attach client-side execution loop to guarantee immediate and continuous contract purchases
  const startClientBotExecution = useCallback((botToRun: BotRecord) => {
    botEngine.startBot(botToRun, {
      onTradePlaced: (newTrade) => {
        setTrades(prev => [newTrade, ...prev.filter(t => t.id !== newTrade.id)]);
        api.getAnalytics().then(setAnalytics).catch(() => {});
      },
      onTradeSettled: (settledTrade) => {
        setTrades(prev => [settledTrade, ...prev.filter(t => t.id !== settledTrade.id)]);
        api.getAccounts().then(setAccounts).catch(() => {});
        api.getAnalytics().then(setAnalytics).catch(() => {});
      },
      onBotUpdate: (updated) => {
        setBots(prev => prev.map(b => b.id === updated.id ? updated : b));
      },
      onLog: (newLog) => {
        setLogs(prev => [{
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          level: newLog.level as any,
          message: newLog.message
        }, ...prev]);
      }
    });
  }, []);

  // Initial Fetch
  const loadInitialData = async () => {
    try {
      const [accs, mktsData, ctrs, bts, trds, lgs, wrk, anl] = await Promise.all([
        api.getAccounts(),
        api.getMarkets(),
        api.getContracts(),
        api.getBots(),
        api.getTrades(),
        api.getLogs(),
        api.getWorkerStatus(),
        api.getAnalytics()
      ]);
      setAccounts(accs);
      if (mktsData?.markets && mktsData.markets.length > 0) {
        setMarkets(mktsData.markets);
      }
      if (mktsData?.catalogueOptions && mktsData.catalogueOptions.length > 0) {
        setCatalogueOptions(mktsData.catalogueOptions);
      }
      if (ctrs && ctrs.length > 0) {
        setContracts(ctrs);
      }
      setBots(bts || []);
      setTrades(trds || []);
      setLogs(lgs || []);
      setWorkerStatus(wrk);
      setAnalytics(anl);

      // Sync MobX client store if accounts exist
      if (accs && accs.length > 0) {
        const primary = accs.find(a => a.isActive) || accs[0];
        rootStore.client.setLoginId(primary.accountNumber);
        rootStore.client.setBalance(primary.balance);
        rootStore.client.setCurrency(primary.currency);
        rootStore.client.setIsConnected(true);
      }
    } catch (err) {
      console.warn('[APP] Initial load from remote API failed, operating in client mode:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Connect to Server-Sent Events (SSE) for live ticks and worker events
    let evtSource: EventSource | null = null;
    let localTickInterval: NodeJS.Timeout | null = null;

    try {
      evtSource = new EventSource('/api/events');

      evtSource.addEventListener('tick', (event) => {
        try {
          const tick = JSON.parse(event.data);
          setMarkets(prev => prev.map(m => {
            if (m.symbol === tick.symbol) {
              const hist = m.priceHistory ? [...m.priceHistory] : [];
              hist.push(tick.quote);
              if (hist.length > 50) hist.shift();
              const freq = m.digitFrequency ? [...m.digitFrequency] : new Array(10).fill(0);
              freq[tick.digit] = (freq[tick.digit] || 0) + 1;
              return {
                ...m,
                currentPrice: tick.quote,
                lastDigit: tick.digit,
                priceHistory: hist,
                digitFrequency: freq
              };
            }
            return m;
          }));
        } catch {}
      });

      evtSource.addEventListener('heartbeat', () => {
        api.getWorkerStatus().then(setWorkerStatus).catch(() => {});
        api.getAnalytics().then(setAnalytics).catch(() => {});
      });

      evtSource.addEventListener('bot_updated', (event) => {
        try {
          const updatedBot: BotRecord = JSON.parse(event.data);
          setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
        } catch {}
      });

      evtSource.addEventListener('trade_placed', (event) => {
        try {
          const newTrade: TradeRecord = JSON.parse(event.data);
          setTrades(prev => [newTrade, ...prev.filter(t => t.id !== newTrade.id)]);
        } catch {}
      });

      evtSource.addEventListener('trade_settled', (event) => {
        try {
          const settledTrade: TradeRecord = JSON.parse(event.data);
          setTrades(prev => [settledTrade, ...prev.filter(t => t.id !== settledTrade.id)]);
          api.getAccounts().then(setAccounts).catch(() => {});
          api.getAnalytics().then(setAnalytics).catch(() => {});
        } catch {}
      });

      evtSource.onerror = () => {
        // When SSE cannot connect (e.g. running statically on Netlify without backend proxy)
        // start in-browser simulation so markets, sparklines, and digits continue ticking seamlessly
        if (!localTickInterval) {
          localTickInterval = setInterval(() => {
            setMarkets(prev => prev.map(m => {
              const current = m.currentPrice || 1000;
              const volatilityPct = m.is1sVolatility ? 0.0003 : 0.0001;
              const change = (Math.random() - 0.498) * (current * volatilityPct);
              const nextPrice = parseFloat(Math.max(0.001, current + change).toFixed(m.pipSize || 2));
              const fixedStr = nextPrice.toFixed(m.pipSize || 2);
              const digit = parseInt(fixedStr.slice(-1), 10) || 0;
              const hist = m.priceHistory ? [...m.priceHistory] : [];
              hist.push(nextPrice);
              if (hist.length > 50) hist.shift();
              const freq = m.digitFrequency ? [...m.digitFrequency] : new Array(10).fill(0);
              freq[digit] = (freq[digit] || 0) + 1;
              return {
                ...m,
                currentPrice: nextPrice,
                lastDigit: digit,
                priceHistory: hist,
                digitFrequency: freq
              };
            }));
          }, 1000);
        }
      };
    } catch {
      if (!localTickInterval) {
        localTickInterval = setInterval(() => {
          setMarkets(prev => prev.map(m => {
            const current = m.currentPrice || 1000;
            const change = (Math.random() - 0.498) * (current * 0.0002);
            const nextPrice = parseFloat(Math.max(0.001, current + change).toFixed(m.pipSize || 2));
            const fixedStr = nextPrice.toFixed(m.pipSize || 2);
            const digit = parseInt(fixedStr.slice(-1), 10) || 0;
            return { ...m, currentPrice: nextPrice, lastDigit: digit };
          }));
        }, 1000);
      }
    }

    const logInterval = setInterval(() => {
      api.getLogs().then(setLogs).catch(() => {});
    }, 5000);

    return () => {
      if (evtSource) evtSource.close();
      if (localTickInterval) clearInterval(localTickInterval);
      clearInterval(logInterval);
    };
  }, []);

  // Bot actions
  const handlePause = async (id: string) => {
    try {
      botEngine.pauseBot(id);
      const updated = await api.pauseBot(id);
      setBots(prev => prev.map(b => b.id === id ? updated : b));
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Pause failed');
    }
  };

  const handleResume = async (id: string) => {
    try {
      const updated = await api.resumeBot(id);
      setBots(prev => prev.map(b => b.id === id ? updated : b));
      startClientBotExecution(updated);
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      console.warn('Resume fallback to client bot runner:', err);
      const currentBot = bots.find(b => b.id === id);
      if (currentBot) {
        currentBot.status = 'RUNNING';
        currentBot.executionState = 'BUYING';
        setBots(prev => prev.map(b => b.id === id ? { ...currentBot } : b));
        startClientBotExecution(currentBot);
      }
    }
  };

  const handleStop = async (id: string) => {
    try {
      botEngine.stopBot(id);
      const updated = await api.stopBot(id);
      setBots(prev => prev.map(b => b.id === id ? updated : b));
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      console.warn('Stop fallback to local state:', err);
      const currentBot = bots.find(b => b.id === id);
      if (currentBot) {
        currentBot.status = 'STOPPED';
        currentBot.executionState = 'STOPPED';
        setBots(prev => prev.map(b => b.id === id ? { ...currentBot } : b));
      }
    }
  };

  const handleDeploy = async (id: string) => {
    try {
      const updated = await api.deployBot(id);
      setBots(prev => prev.map(b => b.id === id ? updated : b));
      startClientBotExecution(updated);
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      console.warn('Deploy fallback to client runner:', err);
      const currentBot = bots.find(b => b.id === id);
      if (currentBot) {
        currentBot.status = 'RUNNING';
        currentBot.executionState = 'BUYING';
        setBots(prev => prev.map(b => b.id === id ? { ...currentBot } : b));
        startClientBotExecution(currentBot);
      }
    }
  };

  const handleConfigureSlot = async (slotNumber: 1 | 2, catalogueSymbol: string) => {
    try {
      const updatedMarket = await api.configureMarketSlot(slotNumber, catalogueSymbol);
      setMarkets(prev => {
        const without = prev.filter(m => m.symbol !== updatedMarket.symbol);
        return [...without, updatedMarket];
      });
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Failed to configure slot');
    }
  };

  const handleSaveAndDeploy = async (botData: Partial<BotRecord>, deployImmediately: boolean) => {
    const created = await api.createBot(botData);
    if (deployImmediately) {
      const deployed = await api.deployBot(created.id);
      setBots(prev => [deployed, ...prev]);
      startClientBotExecution(deployed);
    } else {
      setBots(prev => [created, ...prev]);
    }
    api.getAnalytics().then(setAnalytics).catch(() => {});
  };

  // Run a bot immediately with selected contract specifications
  const handleRunBotWithContract = async (params: {
    contractType: string;
    subtypes: string[];
    market: string;
    stake: number;
    barrierDigit?: number;
    growthRate?: number;
    limitOrder?: number;
    martingaleMultiplier?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => {
    const activeAcc = accounts.find(a => a.isActive) || accounts[0];
    const botName = `OTIVO ${params.subtypes[0]} Bot`;
    const botData: Partial<BotRecord> = {
      name: botName,
      description: `Automated 24/7 worker on ${params.market} (${params.subtypes.join(', ')}).`,
      derivAccountId: activeAcc?.id || 'deriv_acc_local',
      accountMode: (activeAcc?.accountType as any) || 'real',
      selectedMarkets: [params.market],
      selectedContractTypes: params.subtypes,
      strategy: {
        type: params.contractType === 'ACCUMULATORS'
          ? 'ACCUMULATOR_COMPOUNDER'
          : params.contractType === 'DIGITS'
          ? 'DIGIT_FREQUENCY_ANALYSIS'
          : 'MOMENTUM_TREND',
        name: `${params.subtypes[0]} Strategy`,
        description: `Real-time execution for ${params.subtypes.join(', ')}`,
        entryConditions: {
          indicator: 'TICK_MOMENTUM',
          threshold: 0.15,
          consecutiveTicksRequired: 2,
          targetDigit: params.barrierDigit,
          barrierDigit: params.barrierDigit,
          growthRate: params.growthRate,
          limitOrder: params.limitOrder
        },
        filters: {
          avoidTickNoise: true,
          maxSpreadPips: 2,
          signalExpirationSeconds: 15
        }
      },
      risk: {
        stakeType: 'fixed',
        stakeAmount: params.stake,
        martingaleMultiplier: params.martingaleMultiplier || 2.0,
        takeProfit: params.takeProfit || 10.0,
        stopLoss: params.stopLoss || 20.0,
        stakePercentage: 1.0,
        maxStake: params.stake * 10,
        maxConcurrentContracts: 1,
        maxDailyLoss: params.stopLoss || 20.0,
        maxDailyProfit: params.takeProfit || 10.0,
        maxConsecutiveLosses: 4,
        maxTradesPerSession: 50,
        cooldownPeriodSeconds: 3,
        maxAccountDrawdownPercent: 10.0,
        emergencyStopBalanceMin: 5.0
      },
      schedule: {
        type: 'IMMEDIATE',
        runUntilStopped: true,
        timezone: 'UTC',
        permittedDays: [0, 1, 2, 3, 4, 5, 6],
        permittedStartHourUtc: 0,
        permittedEndHourUtc: 23
      }
    };

    try {
      const created = await api.createBot(botData);
      const deployed = await api.deployBot(created.id);
      setBots(prev => [deployed, ...prev.filter(b => b.id !== deployed.id)]);
      
      // CRITICAL: Immediately trigger contract purchase!
      startClientBotExecution(deployed);
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      console.warn('Backend launch failed, using client execution mode:', err);
      const localBot: BotRecord = {
        id: `bot_${Date.now()}`,
        userId: 'user_master_1',
        derivAccountId: 'acc_local_1',
        name: botName,
        description: `Automated trading on ${params.market}`,
        accountMode: 'real',
        selectedMarkets: [params.market],
        selectedContractTypes: params.subtypes,
        strategy: botData.strategy as any,
        risk: botData.risk as any,
        schedule: botData.schedule as any,
        status: 'RUNNING',
        executionState: 'BUYING',
        currentTradeSession: {
          totalTrades: 0,
          winCount: 0,
          lossCount: 0,
          consecutiveLosses: 0,
          realizedProfit: 0,
          sessionStartTime: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setBots(prev => [localBot, ...prev.filter(b => b.id !== localBot.id)]);
      startClientBotExecution(localBot);
    }
  };

  const handleQuickRun = () => {
    handleRunBotWithContract({
      contractType: 'RISE_FALL',
      subtypes: ['CALL', 'PUT'],
      market: '1HZ50V',
      stake: 2.0,
      martingaleMultiplier: 2.0,
      takeProfit: 10.0,
      stopLoss: 20.0
    });
  };

  const handleSwitchAccount = async (id: string) => {
    await api.switchAccount(id);
    const updated = await api.getAccounts();
    setAccounts(updated);
    const current = updated.find(a => a.id === id);
    if (current) {
      rootStore.client.setLoginId(current.accountNumber);
      rootStore.client.setBalance(current.balance);
      rootStore.client.setCurrency(current.currency);
      botEngine.initTokenFromStorage();
    }
  };

  const handleConnectAccount = async (params: {
    token: string;
    accountNumber: string;
    accountType: 'demo' | 'real';
    currency?: string;
  }) => {
    botEngine.setToken(params.token);
    const created = await api.connectAccount(params);
    setAccounts(prev => [created, ...prev.map(a => ({ ...a, isActive: false }))]);
    rootStore.client.setLoginId(created.accountNumber);
    rootStore.client.setBalance(created.balance);
    rootStore.client.setCurrency(created.currency);
    rootStore.client.setIsConnected(true);
  };

  const handleDisconnectAccount = async (id: string) => {
    await api.disconnectAccount(id);
    const updated = await api.getAccounts();
    setAccounts(updated);
  };

  const handleResetHistory = () => {
    botEngine.resetHistory();
    setTrades([]);
    api.getAnalytics().then(setAnalytics).catch(() => {});
  };

  const handleUpdateRisk = (botId: string, settings: {
    baseStake?: number;
    martingaleMultiplier?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => {
    if (!botId) return;
    botEngine.updateRiskSettings(botId, settings);
    setBots(prev => prev.map(b => {
      if (b.id === botId) {
        return {
          ...b,
          risk: {
            ...b.risk,
            stakeAmount: settings.baseStake ?? b.risk.stakeAmount,
            martingaleMultiplier: settings.martingaleMultiplier ?? b.risk.martingaleMultiplier,
            takeProfit: settings.takeProfit ?? b.risk.takeProfit,
            stopLoss: settings.stopLoss ?? b.risk.stopLoss
          }
        };
      }
      return b;
    }));
  };

  const isAnyBotRunning = bots.some(b => b.status === 'RUNNING');

  return (
    <Layout>
      <div className="flex-1 p-4 lg:p-5 overflow-y-auto space-y-4">
        {/* Unified Platform View */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left Column (8 / 12 width) */}
          <div className="xl:col-span-8 space-y-4">
            {/* 2 Rows of 4 Metric Cards */}
            <MetricsCards analytics={analytics} />

            {/* Markets Section (Standard 8 + 2 Custom Slots) */}
            <MarketsSection
              markets={markets}
              catalogueOptions={catalogueOptions}
              onConfigureSlot={handleConfigureSlot}
              onSelectMarket={(sym) => {
                setPreselectedMarket(sym);
                setIsWizardOpen(true);
              }}
            />

            {/* Contract Types Section with live barrier/accumulator controls & Run/Red Stop Bot */}
            <ContractsSection
              markets={markets}
              onSelectContract={(_type) => {}}
              onRunBotWithContract={handleRunBotWithContract}
              onStopBot={() => {
                const runningBot = bots.find(b => b.status === 'RUNNING');
                if (runningBot) handleStop(runningBot.id);
                else if (activeBot) handleStop(activeBot.id);
              }}
              isRunning={isAnyBotRunning}
            />

            {/* Recent Trades Table with Reset Button */}
            <RecentTradesSection
              trades={trades}
              onResetHistory={handleResetHistory}
            />
          </div>

          {/* Right Column (4 / 12 width) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Active Bot Panel with Live Trading, Pause, Run / Red Stop Bot, and Martingale/TP/SL Inputs */}
            <ActiveBotPanel
              bot={activeBot}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onEditSchedule={() => setIsWizardOpen(true)}
              onQuickRun={handleQuickRun}
              isRunningAny={isAnyBotRunning}
              onUpdateRisk={(settings) => handleUpdateRisk(activeBot?.id || '', settings)}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />

            {/* Live Cloud Worker Execution Terminal */}
            <div className="p-4 rounded-xl bg-[#0a141d] border border-[#132431] space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Cloud Worker Logs
              </h3>
              <LiveExecutionTerminal logs={logs} />
            </div>
          </div>
        </div>

        {/* Historical Ledger & Server Monitor */}
        <div className="space-y-4 pt-2 border-t border-[#132431]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Trade History & Cloud Server Health
          </h3>
          <TradeHistoryTable
            trades={trades}
            bots={bots}
            onResetHistory={handleResetHistory}
          />
          <ServerHealthMonitor
            status={workerStatus}
            runningBots={bots.filter(b => b.status === 'RUNNING')}
          />
        </div>
      </div>

      {/* Modals */}
      <BotWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        accounts={accounts}
        markets={markets}
        contracts={contracts}
        preselectedMarket={preselectedMarket}
        onSaveAndDeploy={handleSaveAndDeploy}
      />

      <DerivAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accounts={accounts}
        onSwitchAccount={handleSwitchAccount}
        onConnectAccount={handleConnectAccount}
        onDisconnectAccount={handleDisconnectAccount}
      />

      <RiskCenterModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        bots={bots}
        activeAccount={activeAccount}
        onEmergencyStopAll={async () => {
          for (const b of bots.filter(b => b.status === 'RUNNING')) {
            await handleStop(b.id);
          }
          setIsRiskModalOpen(false);
        }}
      />
    </Layout>
  );
});
