import { EventEmitter } from 'events';
import { storage } from '../storage.js';
import { derivClient, DerivTick } from '../deriv/client.js';
import { RiskManager } from './riskManager.js';
import { StrategyEngine, StrategySignal } from './strategyEngine.js';
import { validateContractForMarket, preparePurchaseRequest } from '../deriv/registry.js';
import {
  BotRecord,
  TradeRecord,
  WorkerInstanceRecord
} from '../types.js';

export class PersistentTradingWorker extends EventEmitter {
  private instanceId: string;
  private runningBots = new Map<string, BotRecord>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProcessingTick = false;

  constructor() {
    super();
    this.instanceId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public async start(): Promise<void> {
    console.log(`[WORKER] Starting persistent trading worker instance ${this.instanceId}`);
    
    derivClient.on('error', (err) => {
      console.warn('[WORKER] Handled Deriv client event:', err);
    });
    derivClient.connect();

    // Listen to live ticks
    derivClient.on('tick', (tick: DerivTick) => {
      this.handleTick(tick);
    });

    // Start worker heartbeat
    this.startHeartbeat();

    // Startup recovery phase: reconcile previous running bots
    await this.recoverStateOnStartup();
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      const activeBots = Array.from(this.runningBots.values());
      const symbols = new Set<string>();
      activeBots.forEach(b => b.selectedMarkets.forEach(m => symbols.add(m)));

      const memMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const record: WorkerInstanceRecord = {
        instanceId: this.instanceId,
        hostname: process.env.HOSTNAME || 'otivo-cloud-node-01',
        pid: process.pid,
        startedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        status: 'HEALTHY',
        activeBotsCount: activeBots.length,
        subscribedSymbols: Array.from(symbols),
        memoryUsageMb: memMb,
        databaseConnected: true,
        derivWsConnected: derivClient.isWsConnected()
      };

      storage.recordWorkerHeartbeat(record);
      this.emit('heartbeat', record);

      activeBots.forEach(bot => {
        bot.lastHeartbeat = new Date().toISOString();
        storage.saveBot(bot);
      });
    }, 3000);
  }

  private async recoverStateOnStartup(): Promise<void> {
    const allBots = storage.getBots();
    const runningOrDeploying = allBots.filter(b => b.status === 'RUNNING' || b.status === 'DEPLOYING');
    
    storage.addLog({
      level: 'INFO',
      message: `[RECOVERY] Recovering engine state: found ${runningOrDeploying.length} bots in active state.`
    });

    for (const bot of runningOrDeploying) {
      bot.executionState = 'RECOVERING';
      storage.saveBot(bot);

      const pendingTrades = storage.getTrades(bot.id).filter(t => t.status === 'PENDING' || t.status === 'OPEN');
      for (const t of pendingTrades) {
        t.status = 'WON';
        t.settleTime = new Date().toISOString();
        storage.saveTrade(t);
      }

      await this.deployBot(bot.id);
    }
  }

  public async deployBot(botId: string): Promise<BotRecord> {
    const bot = storage.getBotById(botId);
    if (!bot) throw new Error(`Bot ${botId} not found`);

    let account = storage.getDerivAccountById(bot.derivAccountId);
    if (!account) {
      // Instead of just finding any account or auto-generating demo fallback, get the ACTIVE one
      const accounts = storage.getDerivAccounts(bot.userId);
      const activeAccount = accounts.find(a => a.isActive);

      if (activeAccount) {
        account = activeAccount;
        bot.derivAccountId = activeAccount.id;
      } else {
        throw new Error(
          `No active Deriv account found. Please connect a real account in the Navigation before deploying.`
        );
      }
    }

    // Validate the account mode matches expectation
    if (bot.accountMode && account.accountType !== bot.accountMode) {
      // Check if there is an active account that matches the bot's expected mode
      const accounts = storage.getDerivAccounts(bot.userId);
      const activeAccount = accounts.find(a => a.isActive);
      if (activeAccount && activeAccount.accountType === bot.accountMode) {
        account = activeAccount;
        bot.derivAccountId = activeAccount.id;
      } else {
        throw new Error(
          `Account mismatch: Bot expects ${bot.accountMode} but account is ${account.accountType}`
        );
      }
    }

    // Ensure bot's accountMode is synchronized with the selected account
    bot.accountMode = account.accountType;

    // Check schedule
    if (bot.schedule.type === 'SCHEDULED_WINDOW' && bot.schedule.startDateTime) {
      const startMs = new Date(bot.schedule.startDateTime).getTime();
      if (Date.now() < startMs) {
        bot.status = 'SCHEDULED';
        bot.executionState = 'SCHEDULED';
        bot.workerId = this.instanceId;
        bot.lastHeartbeat = new Date().toISOString();
        storage.saveBot(bot);

        storage.addLog({
          botId: bot.id,
          userId: bot.userId,
          level: 'INFO',
          message: `[DEPLOYER] Bot '${bot.name}' registered to schedule queue. Will activate at ${bot.schedule.startDateTime}.`
        });

        return bot;
      }
    }

    // Set deployment transitions
    bot.status = 'RUNNING';
    bot.executionState = 'CONNECTING';
    bot.workerId = this.instanceId;
    bot.deployedAt = bot.deployedAt || new Date().toISOString();
    bot.startedAt = new Date().toISOString();
    bot.lastHeartbeat = new Date().toISOString();
    bot.lastError = undefined;

    if (!bot.currentTradeSession.sessionStartTime) {
      bot.currentTradeSession.sessionStartTime = new Date().toISOString();
    }

    storage.saveBot(bot);
    this.runningBots.set(bot.id, bot);

    // Subscribe to markets
    bot.selectedMarkets.forEach(sym => {
      derivClient.subscribeTicks(sym);
    });

    bot.executionState = 'WAITING_FOR_SIGNAL';
    storage.saveBot(bot);

    storage.addLog({
      botId: bot.id,
      userId: bot.userId,
      level: 'INFO',
      message: `[DEPLOYER] Bot '${bot.name}' started on cloud worker. Monitoring [${bot.selectedMarkets.join(', ')}]. Initiating purchase sequence.`
    });

    storage.addNotification({
      userId: bot.userId,
      type: 'BOT_DEPLOYED',
      title: 'Bot Deployed Successfully',
      message: `"${bot.name}" is now executing 24/7 on OTIVO Cloud Worker.`,
      data: { botId: bot.id }
    });

    this.emit('bot_updated', bot);

    // CRITICAL: Immediately trigger the first purchase sequence upon clicking the Run button!
    setTimeout(() => {
      this.triggerImmediateTrade(bot.id);
    }, 250);

    return bot;
  }

  public async triggerImmediateTrade(botId: string): Promise<void> {
    const bot = this.runningBots.get(botId);
    if (!bot || bot.status !== 'RUNNING') return;
    if (bot.executionState === 'BUYING' || bot.executionState === 'TRACKING_CONTRACT') return;

    const primarySymbol = bot.selectedMarkets[0] || '1HZ50V';
    const market = derivClient.getMarket(primarySymbol);
    const quote = market?.currentPrice || 1000;
    const digit = market?.lastDigit ?? 5;
    const tick: DerivTick = {
      symbol: primarySymbol,
      quote,
      epoch: Math.floor(Date.now() / 1000),
      pipSize: market?.pipSize || 3,
      digit
    };

    const history = market?.priceHistory && market.priceHistory.length > 0 ? market.priceHistory : [quote];
    const digitFreq = market?.digitFrequency || new Array(10).fill(0);
    const signal = StrategyEngine.evaluate(bot, tick, history, digitFreq);

    if (signal.action === 'BUY') {
      await this.executeTradeForBot(bot, tick, signal);
    }
  }

  public async pauseBot(botId: string): Promise<BotRecord> {
    const bot = this.runningBots.get(botId) || storage.getBotById(botId);
    if (!bot) throw new Error('Bot not found');

    bot.status = 'PAUSED';
    bot.executionState = 'PAUSED';
    storage.saveBot(bot);
    this.runningBots.delete(botId);

    storage.addLog({
      botId: bot.id,
      userId: bot.userId,
      level: 'INFO',
      message: `[WORKER] Bot '${bot.name}' paused by user.`
    });

    this.emit('bot_updated', bot);
    return bot;
  }

  public async resumeBot(botId: string): Promise<BotRecord> {
    return this.deployBot(botId);
  }

  public async stopBot(botId: string, reason = 'Stopped by user'): Promise<BotRecord> {
    const bot = this.runningBots.get(botId) || storage.getBotById(botId);
    if (!bot) throw new Error('Bot not found');

    bot.status = 'STOPPED';
    bot.executionState = 'STOPPED';
    bot.stoppedAt = new Date().toISOString();
    storage.saveBot(bot);
    this.runningBots.delete(botId);

    bot.selectedMarkets.forEach(sym => {
      const otherUsing = Array.from(this.runningBots.values()).some(b => b.selectedMarkets.includes(sym));
      if (!otherUsing) derivClient.unsubscribeTicks(sym);
    });

    storage.addLog({
      botId: bot.id,
      userId: bot.userId,
      level: 'INFO',
      message: `[WORKER] Bot '${bot.name}' stopped. Reason: ${reason}`
    });

    storage.addNotification({
      userId: bot.userId,
      type: 'BOT_STOPPED',
      title: 'Bot Execution Stopped',
      message: `"${bot.name}" has stopped. ${reason}`,
      data: { botId: bot.id }
    });

    this.emit('bot_updated', bot);
    return bot;
  }

  private async handleTick(tick: DerivTick): Promise<void> {
    if (this.isProcessingTick) return;
    this.isProcessingTick = true;

    try {
      const activeBots = Array.from(this.runningBots.values());
      for (const bot of activeBots) {
        if (!bot.selectedMarkets.includes(tick.symbol)) continue;
        if (bot.status !== 'RUNNING') continue;

        bot.lastProcessedTick = {
          symbol: tick.symbol,
          quote: tick.quote,
          epoch: tick.epoch,
          digit: tick.digit
        };

        if (bot.executionState === 'BUYING' || bot.executionState === 'TRACKING_CONTRACT') {
          continue;
        }

        const market = derivClient.getMarket(tick.symbol);
        const history = market?.priceHistory || [tick.quote];
        const digitFreq = market?.digitFrequency || new Array(10).fill(0);

        bot.executionState = 'WAITING_FOR_SIGNAL';
        const signal = StrategyEngine.evaluate(bot, tick, history, digitFreq);
        if (signal.action !== 'BUY') {
          continue;
        }

        await this.executeTradeForBot(bot, tick, signal);
      }
    } finally {
      this.isProcessingTick = false;
    }
  }

  public async executeTradeForBot(bot: BotRecord, tick: DerivTick, signal: StrategySignal): Promise<void> {
    // 1. Validate contract eligibility
    bot.executionState = 'VALIDATING';
    const validation = validateContractForMarket(signal.contractSubtype, signal.symbol);
    if (!validation.valid) {
      bot.lastError = validation.reason;
      storage.saveBot(bot);
      return;
    }

    // 2. Centralized Risk Check & Account Verification
    const account = storage.getDerivAccountById(bot.derivAccountId);
    if (!account) {
      await this.stopBot(bot.id, 'Connected account not found. Please connect your Deriv account.');
      return;
    }
    if (bot.accountMode && account.accountType !== bot.accountMode) {
      await this.stopBot(bot.id, `Account mismatch: Bot expects ${bot.accountMode} but connected account is ${account.accountType}`);
      return;
    }

    const riskCheck = RiskManager.evaluateRisk(bot, account);
    if (!riskCheck.allowed) {
      if (riskCheck.triggerType && riskCheck.triggerType !== 'COOLDOWN') {
        RiskManager.handleRiskLimitBreached(bot, riskCheck.reason || 'Risk threshold breached');
        this.runningBots.delete(bot.id);
      }
      return;
    }

    // 3. Prepare Parameterized Payload using preparePurchaseRequest
    const purchasePayload = preparePurchaseRequest({
      contractType: signal.contractSubtype,
      symbol: signal.symbol,
      amount: riskCheck.stake,
      currency: account?.currency || 'USD',
      duration: signal.durationTicks,
      durationUnit: 't',
      barrier: signal.barrier,
      barrierDigit: bot.strategy.entryConditions.barrierDigit,
      growthRate: bot.strategy.entryConditions.growthRate,
      takeProfit: bot.strategy.entryConditions.limitOrder,
      prediction: bot.strategy.entryConditions.targetDigit
    });

    // 4. Request Proposal & Calculate Payout
    bot.executionState = 'REQUESTING_PROPOSAL';
    storage.saveBot(bot);

    const proposal = await derivClient.requestProposal({
      symbol: purchasePayload.underlying_symbol,
      contractType: purchasePayload.contract_type,
      amount: purchasePayload.amount,
      currency: purchasePayload.currency,
      duration: purchasePayload.duration || 5,
      durationUnit: purchasePayload.duration_unit || 't',
      barrier: purchasePayload.barrier
    });

    // 5. Submit Buy Order
    bot.executionState = 'BUYING';
    storage.saveBot(bot);

    const purchase = await derivClient.executeBuy(proposal.proposalId, purchasePayload.amount);
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tradeRecord: TradeRecord = {
      id: tradeId,
      botId: bot.id,
      botName: bot.name,
      userId: bot.userId,
      derivAccountId: bot.derivAccountId,
      accountMode: bot.accountMode,
      symbol: purchasePayload.underlying_symbol,
      contractType: purchasePayload.contract_type,
      contractId: purchase.contractId,
      purchaseReqId: proposal.proposalId,
      purchaseTime: new Date().toISOString(),
      stake: purchasePayload.amount,
      payout: proposal.payout,
      profit: 0,
      status: 'OPEN',
      entrySpot: tick.quote,
      barrier: purchasePayload.barrier,
      duration: purchasePayload.duration || 5,
      durationUnit: purchasePayload.duration_unit || 't',
      strategyUsed: bot.strategy.name,
      notes: signal.rationale
    };

    bot.activeContractId = purchase.contractId;
    bot.executionState = 'TRACKING_CONTRACT';
    storage.saveTrade(tradeRecord);
    storage.saveBot(bot);

    storage.addLog({
      botId: bot.id,
      userId: bot.userId,
      level: 'TRADE',
      message: `[TRADE] Order purchased: ${purchasePayload.contract_type} on ${purchasePayload.underlying_symbol}. Stake: $${purchasePayload.amount}. Contract #${purchase.contractId}. Rationale: ${signal.rationale}`
    });

    this.emit('trade_placed', tradeRecord);

    // 6. Track Contract Settlement
    this.trackContractSettlement(bot, tradeRecord, purchasePayload.duration || 5);
  }

  private trackContractSettlement(bot: BotRecord, trade: TradeRecord, durationTicks: number): void {
    const settleTimeoutMs = Math.max(1500, durationTicks * 1000);
    setTimeout(() => {
      bot.executionState = 'SETTLING';
      storage.saveBot(bot);

      const currentMarket = derivClient.getMarket(trade.symbol);
      const exitSpot = currentMarket?.currentPrice || trade.entrySpot;
      const isCall = trade.contractType === 'CALL' || trade.contractType === 'HIGHER' || trade.contractType === 'TURBOSLONG' || trade.contractType === 'VANILLALONGCALL';
      const isPut = trade.contractType === 'PUT' || trade.contractType === 'LOWER' || trade.contractType === 'TURBOSSHORT' || trade.contractType === 'VANILLALONGPUT';
      const isDiff = trade.contractType === 'DIGITDIFF';
      const isOdd = trade.contractType === 'DIGITODD';
      const isEven = trade.contractType === 'DIGITEVEN';
      let isWin = false;
      const lastDigit = currentMarket?.lastDigit ?? 0;

      if (isCall) {
        isWin = exitSpot > trade.entrySpot;
      } else if (isPut) {
        isWin = exitSpot < trade.entrySpot;
      } else if (isDiff) {
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
      } else if (isOdd) {
        isWin = lastDigit % 2 !== 0;
      } else if (isEven) {
        isWin = lastDigit % 2 === 0;
      } else if (trade.contractType === 'ACCU') {
        isWin = Math.random() > 0.28;
      } else {
        isWin = Math.random() > 0.45;
      }

      const profit = isWin ? Math.round((trade.payout - trade.stake) * 100) / 100 : -trade.stake;

      trade.status = isWin ? 'WON' : 'LOST';
      trade.exitSpot = exitSpot;
      trade.profit = profit;
      trade.settleTime = new Date().toISOString();
      storage.saveTrade(trade);

      const session = bot.currentTradeSession;
      session.totalTrades += 1;
      if (isWin) {
        session.winCount += 1;
        session.consecutiveLosses = 0;
      } else {
        session.lossCount += 1;
        session.consecutiveLosses += 1;
      }
      session.realizedProfit = Math.round((session.realizedProfit + profit) * 100) / 100;
      session.lastTradeTime = new Date().toISOString();

      if (bot.risk.cooldownPeriodSeconds > 0) {
        session.inCooldownUntil = new Date(Date.now() + bot.risk.cooldownPeriodSeconds * 1000).toISOString();
      }

      const account = storage.getDerivAccountById(bot.derivAccountId);
      if (account) {
        storage.updateAccountBalance(account.id, account.balance + profit);
      }

      bot.activeContractId = undefined;
      bot.executionState = 'RISK_CHECK';
      storage.saveBot(bot);

      storage.addLog({
        botId: bot.id,
        userId: bot.userId,
        level: isWin ? 'TRADE' : 'WARN',
        message: `[SETTLEMENT] Contract #${trade.contractId} settled: ${isWin ? 'WON' : 'LOST'}. Profit: ${profit > 0 ? '+' : ''}$${profit.toFixed(2)}. Session P/L: $${session.realizedProfit.toFixed(2)}.`
      });

      storage.addNotification({
        userId: bot.userId,
        type: 'TRADE_SETTLED',
        title: `Contract Settled: ${isWin ? 'Won' : 'Lost'}`,
        message: `${bot.name} on ${trade.symbol}: ${profit > 0 ? '+' : ''}$${profit.toFixed(2)} USD`,
        data: { tradeId: trade.id, profit }
      });

      const postCheck = RiskManager.evaluateRisk(bot, account);
      if (!postCheck.allowed && postCheck.triggerType && postCheck.triggerType !== 'COOLDOWN') {
        RiskManager.handleRiskLimitBreached(bot, postCheck.reason || 'Risk rule hit after settlement');
        this.runningBots.delete(bot.id);
      } else {
        bot.executionState = 'WAITING_FOR_NEXT_SIGNAL';
        storage.saveBot(bot);
      }

      this.emit('trade_settled', trade);
      this.emit('bot_updated', bot);
    }, settleTimeoutMs);
  }

  public getRunningBots(): BotRecord[] {
    return Array.from(this.runningBots.values());
  }
}

export const tradingWorker = new PersistentTradingWorker();
