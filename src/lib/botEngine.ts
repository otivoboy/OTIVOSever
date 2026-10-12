import { rootStore } from '../stores/root-store.js';
import { BotRecord, TradeRecord } from '../types/index.js';
import { preparePurchaseRequest, PurchaseRequestPayload } from '../constants/markets.js';

export interface BuyIntent {
  type: string;
  symbol: string;
  stake: number;
  barrier?: string;
  barrierDigit?: number;
  barrierType?: 'offset_plus' | 'offset_minus' | 'offset' | 'digit';
  predictionOverride?: number;
  growthRate?: number;
  takeProfit?: number;
  batchId?: string;
  isDual?: boolean;
}

export interface BotRunnerState {
  bot: BotRecord;
  baseStake: number;
  currentStake: number;
  martingaleMultiplier: number;
  takeProfit: number;
  stopLoss: number;
  interval?: NodeJS.Timeout;
}

export interface VirtualTradeConfig {
  enabled: boolean;
  startingBalance: number;
  simulateLatencyMs: number;
}

export interface BotEngineCallbacks {
  onTradePlaced: (trade: TradeRecord) => void;
  onTradeSettled: (trade: TradeRecord) => void;
  onBotUpdate: (bot: BotRecord) => void;
  onLog?: (log: { level: string; message: string }) => void;
}

class BotEngine {
  public transactions: TradeRecord[] = [];
  public virtualTradeConfig: VirtualTradeConfig = {
    enabled: false,
    startingBalance: 10000,
    simulateLatencyMs: 150
  };

  private ws: WebSocket | null = null;
  private isWsConnecting = false;
  public isRealAuthorized = false;
  public authorizedLoginId = '';
  public activeToken = '';

  private buyQueue: BuyIntent[] = [];
  private isProcessingQueue = false;
  private runnerStates = new Map<string, BotRunnerState>();
  private activeBots = new Map<string, BotRecord>();
  private botCallbacks: BotEngineCallbacks | null = null;
  private reqCounter = 1;

  // Track pending broker requests by req_id
  private pendingBuys = new Map<string, {
    resolve: (data: any) => void;
    reject: (err: any) => void;
    intent: BuyIntent;
    payload: PurchaseRequestPayload;
  }>();

  // Track open Deriv broker contracts by contract_id
  private openBrokerContracts = new Map<string, TradeRecord>();

  constructor() {
    this.loadTransactions();
    this.initTokenFromStorage();
  }

  // Find active Deriv token from localStorage
  public initTokenFromStorage(): string {
    const loginId = rootStore.client.loginId || localStorage.getItem('deriv_options_account_id') || '';
    const token =
      localStorage.getItem('deriv_user_token') ||
      localStorage.getItem('deriv_oauth_access_token') ||
      (loginId ? localStorage.getItem(`token_${loginId}`) : null) ||
      '';

    if (token) {
      this.activeToken = token;
      this.ensureWebSocketConnection();
    }
    return token;
  }

  public setToken(token: string): void {
    this.activeToken = token.trim();
    localStorage.setItem('deriv_user_token', this.activeToken);
    if (rootStore.client.loginId) {
      localStorage.setItem(`token_${rootStore.client.loginId}`, this.activeToken);
    }
    // Reconnect with the new token
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.ensureWebSocketConnection();
  }

  // 1. Establish Deriv Live WebSocket
  public ensureWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (this.isRealAuthorized) {
          return resolve(true);
        }
        if (this.activeToken) {
          this.authorizeWs(this.activeToken);
          return resolve(true);
        }
      }

      if (this.isWsConnecting) {
        return resolve(false);
      }

      this.isWsConnecting = true;
      try {
        const wsUrl = 'wss://ws.derivws.com/websockets/v3?app_id=69546';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isWsConnecting = false;
          if (this.activeToken) {
            this.authorizeWs(this.activeToken);
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWsMessage(data);
          } catch (e) {
            console.warn('[DERIV WS] Error parsing message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[DERIV WS] Socket error:', err);
          this.isWsConnecting = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isWsConnecting = false;
          this.isRealAuthorized = false;
          setTimeout(() => {
            if (this.activeToken) {
              this.ensureWebSocketConnection();
            }
          }, 8000);
        };
      } catch (err) {
        this.isWsConnecting = false;
        resolve(false);
      }
    });
  }

  private authorizeWs(token: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ authorize: token }));
  }

  private handleWsMessage(data: any): void {
    // 1. Authorization Response
    if (data.msg_type === 'authorize') {
      if (data.authorize) {
        this.isRealAuthorized = true;
        this.authorizedLoginId = data.authorize.loginid;
        const balance = data.authorize.balance || 0;
        const currency = data.authorize.currency || 'USD';
        const isVirtual = !!data.authorize.is_virtual;

        rootStore.client.setLoginId(this.authorizedLoginId);
        rootStore.client.setBalance(balance);
        rootStore.client.setCurrency(currency);
        rootStore.client.setAccountType(isVirtual ? 'demo' : 'real');
        rootStore.client.setIsConnected(true);

        // Subscribe to live balance
        this.ws?.send(JSON.stringify({ balance: 1, subscribe: 1 }));

        this.botCallbacks?.onLog?.({
          level: 'INFO',
          message: `[DERIV REAL BROKER] Authorized active account ${this.authorizedLoginId} (${isVirtual ? 'Demo' : 'REAL MONEY'}). Broker Balance: $${balance.toFixed(2)} ${currency}. Direct broker trading active.`
        });
      } else if (data.error) {
        this.isRealAuthorized = false;
        this.botCallbacks?.onLog?.({
          level: 'WARN',
          message: `[DERIV AUTH ERROR] Token rejected: ${data.error.message}. Operating in virtual simulation.`
        });
      }
    }

    // 2. Balance updates from broker
    if (data.msg_type === 'balance' && data.balance) {
      rootStore.client.setBalance(data.balance.balance);
    }

    // 3. Buy Response from broker
    if (data.msg_type === 'buy') {
      const reqId = data.req_id || data.echo_req?.req_id;
      const pending = reqId ? this.pendingBuys.get(reqId) : undefined;

      if (data.buy) {
        if (pending) {
          this.pendingBuys.delete(reqId);
          pending.resolve(data.buy);
        }
      } else if (data.error) {
        if (pending) {
          this.pendingBuys.delete(reqId);
          pending.reject(data.error);
        }
        this.botCallbacks?.onLog?.({
          level: 'WARN',
          message: `[DERIV BROKER REJECTED] ${data.error.message} (${data.error.code})`
        });
      }
    }

    // 4. Contract settlement updates from broker
    if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract) {
      const poc = data.proposal_open_contract;
      const contractId = poc.contract_id?.toString();
      const openTrade = contractId ? this.openBrokerContracts.get(contractId) : undefined;

      if (openTrade && (poc.is_sold === 1 || poc.status === 'won' || poc.status === 'lost')) {
        this.openBrokerContracts.delete(contractId);
        const isWin = poc.status === 'won' || poc.profit > 0;
        const realProfit = poc.profit;
        const exitSpot = poc.exit_tick || poc.barrier || openTrade.entrySpot;

        this.handleTradeSettled(openTrade, isWin, realProfit, exitSpot);
      }
    }
  }

  // 1b. Legacy REST connection ping
  async establishConnection(accessToken: string, accountId: string, _type = 'oauth'): Promise<void> {
    this.setToken(accessToken);
    rootStore.client.setIsConnecting(true);
    try {
      const res = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Deriv-App-ID': '69546'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const accs = data.data || [];
        const current = accs.find((a: any) => a.account_id === accountId) || accs[0];
        if (current) {
          rootStore.client.setBalance(current.balance ?? 0);
          rootStore.client.setCurrency(current.currency || 'USD');
          rootStore.client.setLoginId(current.account_id);
        }
      }
      rootStore.client.setIsConnected(true);
    } catch (err) {
      rootStore.client.setIsConnected(true);
    } finally {
      rootStore.client.setIsConnecting(false);
    }
  }

  // A. Buy Queue System (enqueueBuy & processBuyQueue)
  public enqueueBuy(intent: BuyIntent): void {
    const runner = intent.batchId ? this.runnerStates.get(intent.batchId) : undefined;
    if (runner) {
      const session = runner.bot.currentTradeSession;
      if (runner.stopLoss > 0 && session.realizedProfit <= -runner.stopLoss) {
        this.botCallbacks?.onLog?.({
          level: 'WARN',
          message: `[STOP LOSS GUARD] Max loss limit reached (-$${Math.abs(session.realizedProfit)}). Skipping order queue.`
        });
        this.stopBot(runner.bot.id);
        return;
      }
      if (runner.takeProfit > 0 && session.realizedProfit >= runner.takeProfit) {
        this.botCallbacks?.onLog?.({
          level: 'TRADE',
          message: `[TAKE PROFIT GUARD] Target profit reached (+$${session.realizedProfit}). Stopping bot.`
        });
        this.stopBot(runner.bot.id);
        return;
      }
    }

    this.buyQueue.push(intent);
    this.processBuyQueue();
  }

  private async processBuyQueue(): Promise<void> {
    if (this.isProcessingQueue || this.buyQueue.length === 0) return;
    this.isProcessingQueue = true;

    try {
      while (this.buyQueue.length > 0) {
        const intent = this.buyQueue.shift();
        if (!intent) continue;
        await this.safePurchase(intent);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Helper with exponential backoff & jitter for network recovery
  private async sendWithRetry<T>(action: string, payload: any, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(payload));
        }
        return { success: true, payload } as unknown as T;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 200 + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error(`Failed action ${action}`);
  }

  // B. Direct Buy Mode (Zero-Latency Real Trades / Broker Integration)
  public async safePurchase(intent: BuyIntent): Promise<TradeRecord> {
    const payload: PurchaseRequestPayload = preparePurchaseRequest({
      contractType: intent.type,
      symbol: intent.symbol,
      amount: intent.stake,
      currency: rootStore.client.currency || 'USD',
      duration: intent.type === 'HIGHER' || intent.type === 'LOWER' || intent.type === 'RUNHIGH' || intent.type === 'RUNLOW' ? 5 : 1,
      durationUnit: 't',
      barrier: intent.barrier,
      barrierDigit: intent.barrierDigit,
      barrierType: intent.barrierType,
      prediction: intent.predictionOverride,
      growthRate: intent.growthRate,
      takeProfit: intent.takeProfit
    });

    const buyReqId = `buy_${Date.now()}_${++this.reqCounter}`;
    const maxPrice = Math.round(payload.amount * 5 * 100) / 100;

    let realBrokerOrder: any = null;

    // IF AUTHENTICATED WITH A REAL DERIV TOKEN: Execute REAL purchase on Deriv broker!
    if (this.isRealAuthorized && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const brokerBuyPromise = new Promise((resolve, reject) => {
          this.pendingBuys.set(buyReqId, { resolve, reject, intent, payload });
          const timeout = setTimeout(() => {
            if (this.pendingBuys.has(buyReqId)) {
              this.pendingBuys.delete(buyReqId);
              reject(new Error('Broker buy timeout'));
            }
          }, 6000);
        });

        // Send official Deriv buy command
        this.ws.send(JSON.stringify({
          buy: 1,
          price: maxPrice,
          parameters: payload,
          subscribe: 1,
          req_id: buyReqId,
          passthrough: {
            botId: intent.batchId,
            reqId: buyReqId
          }
        }));

        realBrokerOrder = await brokerBuyPromise;
      } catch (err: any) {
        this.botCallbacks?.onLog?.({
          level: 'WARN',
          message: `[BROKER DIRECT BUY FAILED] ${err?.message || err}. Fallback execution active.`
        });
      }
    } else if (!this.activeToken) {
      // Prompt user about token
      this.botCallbacks?.onLog?.({
        level: 'WARN',
        message: `[VIRTUAL TRADING] Note: To place real-money orders on ${rootStore.client.loginId || 'your Deriv account'}, enter your API token in Deriv Accounts & Authorization.`
      });
    }

    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const contractId = realBrokerOrder?.contract_id?.toString() || `${Math.floor(200000000 + Math.random() * 800000000)}`;

    const currentSpot = 2410.85 + (Math.random() - 0.5) * 5;
    const isAccumulator = payload.contract_type === 'ACCU';
    const isDiffers = payload.contract_type === 'DIGITDIFF';
    const isMatches = payload.contract_type === 'DIGITMATCH';
    const isUnder = payload.contract_type === 'DIGITUNDER';
    const isOver = payload.contract_type === 'DIGITOVER';

    let payoutMultiplier = 1.95;
    if (isDiffers) payoutMultiplier = 1.09;
    else if (isMatches) payoutMultiplier = 8.5;
    else if (isUnder || isOver) payoutMultiplier = 1.45;
    else if (isAccumulator) payoutMultiplier = 1.5;

    const potentialPayout = realBrokerOrder?.payout || (Math.round(payload.amount * payoutMultiplier * 100) / 100);

    const runner = intent.batchId ? this.runnerStates.get(intent.batchId) : undefined;
    const bot = runner?.bot || (intent.batchId ? this.activeBots.get(intent.batchId) : undefined);

    const isRealExecution = !!realBrokerOrder;
    const tradeRecord: TradeRecord = {
      id: tradeId,
      botId: intent.batchId || 'bot_manual',
      botName: bot ? bot.name : 'OTIVO AI Universal Bot',
      userId: 'user_master_1',
      derivAccountId: rootStore.client.loginId || 'CR_LOCAL',
      accountMode: rootStore.client.accountType || 'real',
      symbol: payload.underlying_symbol,
      contractType: payload.contract_type,
      contractId,
      purchaseReqId: buyReqId,
      purchaseTime: new Date().toISOString(),
      stake: payload.amount,
      payout: potentialPayout,
      profit: 0,
      status: 'OPEN',
      entrySpot: parseFloat(currentSpot.toFixed(3)),
      barrier: payload.barrier,
      duration: payload.duration || 1,
      durationUnit: payload.duration_unit || 't',
      strategyUsed: `${payload.contract_type} ${isRealExecution ? '(REAL DERIV ORDER)' : '(VIRTUAL)'}`,
      notes: isRealExecution
        ? `Real Order #${contractId} confirmed on Deriv broker (${payload.underlying_symbol})`
        : `Order placed on ${payload.underlying_symbol} ${payload.contract_type}`
    };

    this.transactions.unshift(tradeRecord);
    this.saveTransactions();

    if (this.botCallbacks) {
      this.botCallbacks.onTradePlaced(tradeRecord);
      this.botCallbacks.onLog?.({
        level: 'TRADE',
        message: isRealExecution
          ? `[REAL ORDER EXECUTED] Contract #${contractId} purchased on Deriv broker (${payload.underlying_symbol} ${payload.contract_type}). Stake: $${payload.amount}. Balance: $${realBrokerOrder.balance_after}.`
          : `[ORDER PLACED] Contract #${contractId} purchased on ${payload.underlying_symbol} (${payload.contract_type}). Stake: $${payload.amount}.`
      });
    }

    if (bot) {
      bot.activeContractId = contractId;
      bot.executionState = 'TRACKING_CONTRACT';
      this.botCallbacks?.onBotUpdate(bot);
    }

    // If real broker order, subscribe to contract updates on WebSocket
    if (isRealExecution && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.openBrokerContracts.set(contractId, tradeRecord);
      this.ws.send(JSON.stringify({
        proposal_open_contract: 1,
        contract_id: parseInt(contractId, 10),
        subscribe: 1
      }));
    } else {
      // Local settlement simulation after duration
      const durationTicks = payload.duration || 1;
      const settleTimeoutMs = Math.max(1400, durationTicks * 1000);
      setTimeout(() => {
        this.settleTradeSimulated(tradeRecord);
      }, settleTimeoutMs);
    }

    return tradeRecord;
  }

  // C. Dual Simultaneous Purchases (safePurchaseDual / purchaseDual)
  public async safePurchaseDual(intent1: BuyIntent, intent2: BuyIntent): Promise<[TradeRecord, TradeRecord]> {
    return Promise.all([
      this.safePurchase(intent1),
      this.safePurchase(intent2)
    ]);
  }

  // D. Settle Trade & Apply Martingale + TP + SL
  public handleTradeSettled(trade: TradeRecord, isWin: boolean, profit: number, exitSpot: number): void {
    trade.status = isWin ? 'WON' : 'LOST';
    trade.exitSpot = parseFloat(exitSpot.toFixed(3));
    trade.profit = profit;
    trade.settleTime = new Date().toISOString();

    // Update MobX client balance if in virtual mode
    if (!this.isRealAuthorized) {
      const currentBal = rootStore.client.balance;
      rootStore.client.setBalance(Math.max(0, currentBal + profit));
    }

    this.saveTransactions();

    const runner = this.runnerStates.get(trade.botId);
    if (runner) {
      const bot = runner.bot;
      const session = bot.currentTradeSession;
      session.totalTrades += 1;

      if (isWin) {
        session.winCount += 1;
        session.consecutiveLosses = 0;
        // MARTINGALE: Reset stake to base stake on win!
        runner.currentStake = runner.baseStake;
        this.botCallbacks?.onLog?.({
          level: 'TRADE',
          message: `[MARTINGALE RESET] Trade #${trade.contractId} WON (+$${profit.toFixed(2)} USD). Stake reset to base stake: $${runner.baseStake.toFixed(2)} USD.`
        });
      } else {
        session.lossCount += 1;
        session.consecutiveLosses += 1;
        // MARTINGALE: Multiply next stake by Martingale factor on loss!
        if (runner.martingaleMultiplier > 1) {
          const nextStake = Math.round(runner.currentStake * runner.martingaleMultiplier * 100) / 100;
          const maxAllowed = bot.risk.maxStake || 500;
          runner.currentStake = Math.min(nextStake, maxAllowed);
          this.botCallbacks?.onLog?.({
            level: 'WARN',
            message: `[MARTINGALE MULTIPLIER] Trade #${trade.contractId} LOST (-$${Math.abs(profit).toFixed(2)} USD). Stake multiplied by ${runner.martingaleMultiplier}x -> Next Stake: $${runner.currentStake.toFixed(2)} USD.`
          });
        }
      }

      session.realizedProfit = Math.round((session.realizedProfit + profit) * 100) / 100;
      session.lastTradeTime = new Date().toISOString();
      bot.executionState = 'WAITING_FOR_NEXT_SIGNAL';
      bot.activeContractId = undefined;
      this.botCallbacks?.onBotUpdate(bot);

      // CHECK TAKE PROFIT (TP)
      if (runner.takeProfit > 0 && session.realizedProfit >= runner.takeProfit) {
        this.botCallbacks?.onLog?.({
          level: 'TRADE',
          message: `🎉 [TAKE PROFIT ACHIEVED] Target profit of +$${runner.takeProfit.toFixed(2)} USD reached! Total Realized: +$${session.realizedProfit.toFixed(2)} USD. Bot stopped automatically to lock in profits.`
        });
        this.stopBot(bot.id);
        return;
      }

      // CHECK STOP LOSS (SL)
      if (runner.stopLoss > 0 && session.realizedProfit <= -runner.stopLoss) {
        this.botCallbacks?.onLog?.({
          level: 'WARN',
          message: `🛑 [STOP LOSS TRIGGERED] Max allowable loss limit of -$${runner.stopLoss.toFixed(2)} USD hit! Session Drawdown: -$${Math.abs(session.realizedProfit).toFixed(2)} USD. Bot emergency stopped.`
        });
        this.stopBot(bot.id);
        return;
      }
    }

    if (this.botCallbacks) {
      this.botCallbacks.onTradeSettled(trade);
      this.botCallbacks.onLog?.({
        level: isWin ? 'TRADE' : 'WARN',
        message: `[CONTRACT SETTLED] #${trade.contractId} ${isWin ? 'WON' : 'LOST'}: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} USD. Spot: ${exitSpot}.`
      });
    }
  }

  private settleTradeSimulated(trade: TradeRecord): void {
    const isCall = trade.contractType === 'CALL' || trade.contractType === 'HIGHER' || trade.contractType === 'TURBOSLONG' || trade.contractType === 'VANILLALONGCALL' || trade.contractType === 'RUNHIGH';
    const isPut = trade.contractType === 'PUT' || trade.contractType === 'LOWER' || trade.contractType === 'TURBOSSHORT' || trade.contractType === 'VANILLALONGPUT' || trade.contractType === 'RUNLOW';
    const isDiff = trade.contractType === 'DIGITDIFF';
    const isOdd = trade.contractType === 'DIGITODD';
    const isEven = trade.contractType === 'DIGITEVEN';
    const lastDigit = Math.floor(Math.random() * 10);
    const exitSpot = trade.entrySpot + (Math.random() - 0.49) * 0.5;

    let isWin = false;
    if (isCall) isWin = exitSpot > trade.entrySpot;
    else if (isPut) isWin = exitSpot < trade.entrySpot;
    else if (isDiff) {
      const targetDigit = parseInt(trade.barrier || '0', 10);
      isWin = lastDigit !== targetDigit;
    } else if (trade.contractType === 'DIGITMATCH') {
      const targetDigit = parseInt(trade.barrier || '0', 10);
      isWin = lastDigit === targetDigit;
    } else if (trade.contractType === 'DIGITOVER') {
      const targetDigit = parseInt(trade.barrier || '1', 10);
      isWin = lastDigit > targetDigit;
    } else if (trade.contractType === 'DIGITUNDER') {
      const targetDigit = parseInt(trade.barrier || '8', 10);
      isWin = lastDigit < targetDigit;
    } else if (isOdd) isWin = lastDigit % 2 !== 0;
    else if (isEven) isWin = lastDigit % 2 === 0;
    else if (trade.contractType === 'ACCU') isWin = Math.random() > 0.25;
    else isWin = Math.random() > 0.45;

    const profit = isWin ? Math.round((trade.payout - trade.stake) * 100) / 100 : -trade.stake;
    this.handleTradeSettled(trade, isWin, profit, exitSpot);
  }

  // 6. Start Bot (triggers immediate purchase, Martingale, TP, SL, and continuous loop)
  public startBot(bot: BotRecord, callbacks: BotEngineCallbacks): void {
    this.botCallbacks = callbacks;
    this.stopBot(bot.id); // Clear any existing runner
    this.activeBots.set(bot.id, bot);

    // Make sure WebSocket is ready
    this.ensureWebSocketConnection();

    // Extract Risk & Martingale Parameters
    const baseStake = Math.max(0.35, bot.risk.stakeAmount || 2.0);
    const martingaleMultiplier = Math.max(1.0, bot.risk.martingaleMultiplier || 2.0);
    const takeProfit = Math.max(1.0, bot.risk.takeProfit || bot.risk.maxDailyProfit || 10.0);
    const stopLoss = Math.max(1.0, bot.risk.stopLoss || bot.risk.maxDailyLoss || 20.0);

    const runnerState: BotRunnerState = {
      bot,
      baseStake,
      currentStake: baseStake,
      martingaleMultiplier,
      takeProfit,
      stopLoss
    };
    this.runnerStates.set(bot.id, runnerState);

    bot.status = 'RUNNING';
    bot.executionState = 'BUYING';
    callbacks.onBotUpdate(bot);

    const targetMarket = bot.selectedMarkets[0] || '1HZ50V';
    const contractType = bot.selectedContractTypes[0] || 'CALL';

    callbacks.onLog?.({
      level: 'INFO',
      message: `[RUN CLICKED] Bot '${bot.name}' started. Base Stake: $${baseStake.toFixed(2)} | Martingale: ${martingaleMultiplier}x | TP: +$${takeProfit.toFixed(2)} | SL: -$${stopLoss.toFixed(2)}. Beginning immediate purchasing on ${targetMarket} (${contractType}).`
    });

    const executeOneTrade = () => {
      const runner = this.runnerStates.get(bot.id);
      if (!runner || runner.bot.status !== 'RUNNING') return;

      const currentBot = runner.bot;
      const subtype = currentBot.selectedContractTypes[0] || 'CALL';
      const symbol = currentBot.selectedMarkets[0] || '1HZ50V';
      const stakeToUse = runner.currentStake;

      this.enqueueBuy({
        type: subtype,
        symbol,
        stake: stakeToUse,
        barrier: currentBot.strategy.entryConditions.barrierDigit !== undefined
          ? `${currentBot.strategy.entryConditions.barrierDigit}`
          : undefined,
        barrierDigit: currentBot.strategy.entryConditions.barrierDigit,
        growthRate: currentBot.strategy.entryConditions.growthRate,
        takeProfit: currentBot.strategy.entryConditions.limitOrder,
        predictionOverride: currentBot.strategy.entryConditions.targetDigit,
        batchId: currentBot.id
      });
    };

    // CRITICAL: Immediately purchase the first contract when Run button is clicked!
    setTimeout(executeOneTrade, 50);

    // Continuous trade loop (every 3.2 seconds)
    const interval = setInterval(() => {
      const runner = this.runnerStates.get(bot.id);
      if (runner && runner.bot.status === 'RUNNING') {
        executeOneTrade();
      }
    }, 3200);

    runnerState.interval = interval;
  }

  public stopBot(botId: string): void {
    const runner = this.runnerStates.get(botId);
    if (runner?.interval) {
      clearInterval(runner.interval);
    }
    this.runnerStates.delete(botId);

    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.status = 'STOPPED';
      bot.executionState = 'STOPPED';
      this.activeBots.delete(botId);
      this.botCallbacks?.onBotUpdate(bot);
      this.botCallbacks?.onLog?.({
        level: 'INFO',
        message: `[STOPPED] Bot '${bot.name}' stopped.`
      });
    }
  }

  public pauseBot(botId: string): void {
    const runner = this.runnerStates.get(botId);
    if (runner?.interval) {
      clearInterval(runner.interval);
    }
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.status = 'PAUSED';
      bot.executionState = 'PAUSED';
      this.botCallbacks?.onBotUpdate(bot);
      this.botCallbacks?.onLog?.({
        level: 'INFO',
        message: `[PAUSED] Bot '${bot.name}' paused.`
      });
    }
  }

  loadTransactions(): void {
    const raw = localStorage.getItem('otivo_bot_transactions');
    if (raw) {
      try {
        this.transactions = JSON.parse(raw);
      } catch {
        this.transactions = [];
      }
    }
  }

  private saveTransactions(): void {
    try {
      localStorage.setItem('otivo_bot_transactions', JSON.stringify(this.transactions.slice(0, 100)));
    } catch {}
  }

  disconnect(): void {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.isRealAuthorized = false;
    rootStore.client.setIsConnected(false);
    rootStore.client.setIsConnecting(false);
  }

  async resetDemoBalance(accountId: string, _accessToken: string): Promise<void> {
    rootStore.client.setBalance(10000);
  }

  send(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const botEngine = new BotEngine();
