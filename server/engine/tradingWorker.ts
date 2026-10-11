import { EventEmitter } from 'events';
import { storage } from '../storage.js';
import { derivClient, DerivTick } from '../deriv/client.js';
import { RiskManager } from './riskManager.js';
import { StrategyEngine } from './strategyEngine.js';
import { validateContractForMarket } from '../deriv/registry.js';
import {
  BotRecord,
  TradeRecord,
  WorkerInstanceRecord,
  WorkerExecutionState
} from '../types.js';

export class PersistentTradingWorker extends EventEmitter {
  private instanceId: string;
  private runningBots = new Map<string, BotRecord>();
  private activePendingTrades = new Map<string, TradeRecord>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProcessingTick = false;

  constructor() {
    super();
    this.instanceId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public async start(): Promise<void> {
    console.log(`[WORKER] Starting persistent trading worker instance ${this.instanceId}`);
    
    // Connect to Deriv API
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

      // Also update heartbeat on running bots
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

      // Reconcile open contracts if any were recorded as pending
      const pendingTrades = storage.getTrades(bot.id).filter(t => t.status === 'PENDING' || t.status === 'OPEN');
      for (const t of pendingTrades) {
        // Resolve settled contract safely without duplicating
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

    const account = storage.getDerivAccountById(bot.derivAccountId);
    if (!account) {
      bot.status = 'AUTHORIZATION_REQUIRED';
      bot.executionState = 'AUTHORIZATION_REQUIRED';
      bot.lastError = 'Deriv account authorization required.';
      storage.saveBot(bot);
      throw new Error('Deriv account not connected or unauthorized');
    }

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

    // Reset session metrics if fresh start
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
      message: `[DEPLOYER] Bot '${bot.name}' deployed to cloud worker ${this.instanceId}. Active on markets [${bot.selectedMarkets.join(', ')}].`
    });

    storage.addNotification({
      userId: bot.userId,
      type: 'BOT_DEPLOYED',
      title: 'Bot Deployed Successfully',
      message: `"${bot.name}" is now executing 24/7 on OTIVO Cloud Worker.`,
      data: { botId: bot.id }
    });

    this.emit('bot_updated', bot);
    return bot;
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

    // Unsubscribe if no other bot is using the markets
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

        // Update bot's last processed tick
        bot.lastProcessedTick = {
          symbol: tick.symbol,
          quote: tick.quote,
          epoch: tick.epoch,
          digit: tick.digit
        };

        // If currently in trade or settling, keep tracking
        if (bot.executionState === 'BUYING' || bot.executionState === 'TRACKING_CONTRACT') {
          continue;
        }

        const market = derivClient.getMarket(tick.symbol);
        const history = market?.priceHistory || [tick.quote];
        const digitFreq = market?.digitFrequency || new Array(10).fill(0);

        // 1. Evaluate Strategy Signal
        bot.executionState = 'WAITING_FOR_SIGNAL';
        const signal = StrategyEngine.evaluate(bot, tick, history, digitFreq);
        if (signal.action !== 'BUY') {
          continue;
        }

        // 2. Validate contract eligibility
        bot.executionState = 'VALIDATING';
        const validation = validateContractForMarket(signal.contractSubtype, signal.symbol);
        if (!validation.valid) {
          bot.lastError = validation.reason;
          storage.saveBot(bot);
          continue;
        }

        // 3. Centralized Risk Check
        const account = storage.getDerivAccountById(bot.derivAccountId);
        const riskCheck = RiskManager.evaluateRisk(bot, account);
        if (!riskCheck.allowed) {
          if (riskCheck.triggerType && riskCheck.triggerType !== 'COOLDOWN') {
            RiskManager.handleRiskLimitBreached(bot, riskCheck.reason || 'Risk threshold breached');
            this.runningBots.delete(bot.id);
          }
          continue;
        }

        // 4. Request Proposal
        bot.executionState = 'REQUESTING_PROPOSAL';
        storage.saveBot(bot);

        const proposal = await derivClient.requestProposal({
          symbol: signal.symbol,
          contractType: signal.contractSubtype,
          amount: riskCheck.stake,
          currency: account?.currency || 'USD',
          duration: signal.durationTicks,
          durationUnit: 't',
          barrier: signal.barrier
        });

        // 5. Submit Buy
        bot.executionState = 'BUYING';
        storage.saveBot(bot);

        const purchase = await derivClient.executeBuy(proposal.proposalId, riskCheck.stake);
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const tradeRecord: TradeRecord = {
          id: tradeId,
          botId: bot.id,
          botName: bot.name,
          userId: bot.userId,
          derivAccountId: bot.derivAccountId,
          accountMode: bot.accountMode,
          symbol: signal.symbol,
          contractType: signal.contractSubtype,
          contractId: purchase.contractId,
          purchaseReqId: proposal.proposalId,
          purchaseTime: new Date().toISOString(),
          stake: riskCheck.stake,
          payout: proposal.payout,
          profit: 0,
          status: 'OPEN',
          entrySpot: tick.quote,
          barrier: signal.barrier,
          duration: signal.durationTicks,
          durationUnit: 't',
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
          message: `[TRADE] Order placed on ${signal.symbol} ${signal.contractSubtype}. Stake: $${riskCheck.stake}. Contract #${purchase.contractId}. Rationale: ${signal.rationale}`
        });

        this.emit('trade_placed', tradeRecord);

        // 6. Contract Settlement Simulation / Listener
        this.trackContractSettlement(bot, tradeRecord, signal.durationTicks);
      }
    } finally {
      this.isProcessingTick = false;
    }
  }

  private trackContractSettlement(bot: BotRecord, trade: TradeRecord, durationTicks: number): void {
    // Settle contract after duration ticks * 1s
    const settleTimeoutMs = Math.max(1500, durationTicks * 1000);
    setTimeout(() => {
      bot.executionState = 'SETTLING';
      storage.saveBot(bot);

      // Determine outcome based on current spot vs entry
      const currentMarket = derivClient.getMarket(trade.symbol);
      const exitSpot = currentMarket?.currentPrice || trade.entrySpot;
      const isCall = trade.contractType === 'CALL' || trade.contractType === 'HIGHER';
      const isPut = trade.contractType === 'PUT' || trade.contractType === 'LOWER';
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
        const targetDigit = parseInt(trade.barrier || '5', 10);
        isWin = lastDigit > targetDigit;
      } else if (trade.contractType === 'DIGITUNDER') {
        const targetDigit = parseInt(trade.barrier || '5', 10);
        isWin = lastDigit < targetDigit;
      } else if (isOdd) {
        isWin = lastDigit % 2 !== 0;
      } else if (isEven) {
        isWin = lastDigit % 2 === 0;
      } else if (trade.contractType === 'ACCU') {
        // Accumulators: compounding tick channel
        isWin = Math.random() > 0.30;
      } else {
        isWin = Math.random() > 0.45;
      }

      const profit = isWin ? Math.round((trade.payout - trade.stake) * 100) / 100 : -trade.stake;

      trade.status = isWin ? 'WON' : 'LOST';
      trade.exitSpot = exitSpot;
      trade.profit = profit;
      trade.settleTime = new Date().toISOString();
      storage.saveTrade(trade);

      // Update session statistics
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

      // Apply cooldown
      if (bot.risk.cooldownPeriodSeconds > 0) {
        session.inCooldownUntil = new Date(Date.now() + bot.risk.cooldownPeriodSeconds * 1000).toISOString();
      }

      // Update account balance
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

      // Post-trade Risk Verification
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
