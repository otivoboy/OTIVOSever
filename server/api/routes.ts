import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { derivClient } from '../deriv/client.js';
import { tradingWorker } from '../engine/tradingWorker.js';
import { CONTRACT_REGISTRY, DERIV_CATALOGUE_OPTIONS } from '../deriv/registry.js';
import { BotRecord, DerivAccount } from '../types.js';

export const apiRouter = Router();

// Middleware: default user ID
const DEFAULT_USER_ID = 'user_master_1';

// Server-Sent Events (SSE) for Real-Time Dashboard updates
apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial snapshot
  sendEvent('init', {
    markets: derivClient.getAllMarkets(),
    workers: storage.getActiveWorkers(),
    runningBotsCount: tradingWorker.getRunningBots().length
  });

  const onTick = (tick: unknown) => sendEvent('tick', tick);
  const onHeartbeat = (hb: unknown) => sendEvent('heartbeat', hb);
  const onBotUpdated = (bot: unknown) => sendEvent('bot_updated', bot);
  const onTradePlaced = (trade: unknown) => sendEvent('trade_placed', trade);
  const onTradeSettled = (trade: unknown) => sendEvent('trade_settled', trade);

  derivClient.on('tick', onTick);
  tradingWorker.on('heartbeat', onHeartbeat);
  tradingWorker.on('bot_updated', onBotUpdated);
  tradingWorker.on('trade_placed', onTradePlaced);
  tradingWorker.on('trade_settled', onTradeSettled);

  req.on('close', () => {
    derivClient.off('tick', onTick);
    tradingWorker.off('heartbeat', onHeartbeat);
    tradingWorker.off('bot_updated', onBotUpdated);
    tradingWorker.off('trade_placed', onTradePlaced);
    tradingWorker.off('trade_settled', onTradeSettled);
  });
});

// Accounts
apiRouter.get('/accounts', (_req: Request, res: Response) => {
  const accounts = storage.getDerivAccounts(DEFAULT_USER_ID);
  res.json({ success: true, accounts });
});

apiRouter.post('/accounts/connect', (req: Request, res: Response) => {
  const { token, accountNumber, accountType, currency } = req.body;
  if (!token || !accountNumber) {
    return res.status(400).json({ success: false, error: 'Token and account number are required' });
  }

  // Mask token for safe audit/display
  const tokenMasked = token.slice(0, 4) + '***...' + token.slice(-4);
  const isDemo = accountNumber.toUpperCase().startsWith('VR') || accountType === 'demo';

  const newAccount: DerivAccount = {
    id: `acc_${Date.now()}`,
    userId: DEFAULT_USER_ID,
    accountNumber: accountNumber.trim().toUpperCase(),
    accountType: isDemo ? 'demo' : 'real',
    currency: currency || 'USD',
    balance: isDemo ? 10000.0 : 500.0,
    tokenMasked,
    tokenEncrypted: `enc_${Buffer.from(token).toString('base64')}`,
    isActive: true,
    connectedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    status: 'CONNECTED'
  };

  storage.saveDerivAccount(newAccount);
  storage.setActiveDerivAccount(DEFAULT_USER_ID, newAccount.id);

  storage.addLog({
    userId: DEFAULT_USER_ID,
    level: 'INFO',
    message: `Deriv account ${newAccount.accountNumber} (${newAccount.accountType.toUpperCase()}) connected successfully.`
  });

  res.json({ success: true, account: newAccount });
});

apiRouter.post('/accounts/:id/switch', (req: Request, res: Response) => {
  const accountId = req.params.id;
  storage.setActiveDerivAccount(DEFAULT_USER_ID, accountId);
  res.json({ success: true });
});

apiRouter.post('/accounts/:id/disconnect', (req: Request, res: Response) => {
  const accountId = req.params.id;
  const acc = storage.getDerivAccountById(accountId);
  if (acc) {
    acc.status = 'DISCONNECTED';
    acc.isActive = false;
    storage.saveDerivAccount(acc);
  }
  res.json({ success: true });
});

// Markets
apiRouter.get('/markets', (_req: Request, res: Response) => {
  const markets = derivClient.getAllMarkets();
  res.json({
    success: true,
    markets,
    catalogueOptions: DERIV_CATALOGUE_OPTIONS
  });
});

apiRouter.post('/markets/configure-slot', (req: Request, res: Response) => {
  const { slotNumber, catalogueSymbol } = req.body;
  if (slotNumber !== 1 && slotNumber !== 2) {
    return res.status(400).json({ success: false, error: 'slotNumber must be 1 or 2' });
  }

  const configured = derivClient.configureExtraSlot(slotNumber, catalogueSymbol);
  if (!configured) {
    return res.status(400).json({ success: false, error: 'Catalogue symbol not found in active catalog' });
  }

  res.json({ success: true, market: configured });
});

// Contracts
apiRouter.get('/contracts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    contracts: CONTRACT_REGISTRY
  });
});

// Bots CRUD
apiRouter.get('/bots', (_req: Request, res: Response) => {
  const bots = storage.getBots(DEFAULT_USER_ID);
  res.json({ success: true, bots });
});

apiRouter.post('/bots', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.derivAccountId || !data.selectedMarkets || data.selectedMarkets.length === 0) {
    return res.status(400).json({ success: false, error: 'Name, account, and markets are required' });
  }

  let account = storage.getDerivAccountById(data.derivAccountId);
  if (!account) {
    const existingAccounts = storage.getDerivAccounts();
    if (existingAccounts.length > 0) {
      account = existingAccounts.find(a => a.isActive) || existingAccounts[0];
    } else {
      account = storage.saveDerivAccount({
        id: data.derivAccountId || `deriv_acc_${Date.now()}`,
        userId: DEFAULT_USER_ID,
        accountNumber: 'CR' + Math.floor(1000000 + Math.random() * 9000000),
        accountType: data.accountMode || 'real',
        currency: 'USD',
        balance: 10000,
        tokenMasked: 'oauth_session',
        tokenEncrypted: 'session_active',
        isActive: true,
        connectedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        status: 'CONNECTED'
      });
    }
  }

  const newBot: BotRecord = {
    id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: DEFAULT_USER_ID,
    derivAccountId: account.id,
    name: data.name,
    description: data.description || '',
    accountMode: account.accountType,
    selectedMarkets: data.selectedMarkets,
    selectedContractTypes: data.selectedContractTypes || ['CALL', 'PUT'],
    strategy: data.strategy,
    risk: data.risk,
    schedule: data.schedule,
    status: 'SAVED',
    executionState: 'IDLE',
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

  storage.saveBot(newBot);

  storage.addLog({
    botId: newBot.id,
    userId: DEFAULT_USER_ID,
    level: 'INFO',
    message: `Bot '${newBot.name}' configuration created and validated.`
  });

  res.json({ success: true, bot: newBot });
});

apiRouter.get('/bots/:id', (req: Request, res: Response) => {
  const bot = storage.getBotById(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  res.json({ success: true, bot });
});

apiRouter.patch('/bots/:id', (req: Request, res: Response) => {
  const bot = storage.getBotById(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  Object.assign(bot, req.body, { updatedAt: new Date().toISOString() });
  storage.saveBot(bot);
  res.json({ success: true, bot });
});

apiRouter.delete('/bots/:id', async (req: Request, res: Response) => {
  const botId = req.params.id;
  const bot = storage.getBotById(botId);
  if (bot && (bot.status === 'RUNNING' || bot.status === 'DEPLOYING')) {
    await tradingWorker.stopBot(botId, 'Bot deleted');
  }
  storage.deleteBot(botId);
  res.json({ success: true });
});

// Bot Lifecycle Controls
apiRouter.post('/bots/:id/deploy', async (req: Request, res: Response) => {
  try {
    const bot = await tradingWorker.deployBot(req.params.id);
    res.json({ success: true, bot });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deployment failed';
    res.status(500).json({ success: false, error: message });
  }
});

apiRouter.post('/bots/:id/pause', async (req: Request, res: Response) => {
  try {
    const bot = await tradingWorker.pauseBot(req.params.id);
    res.json({ success: true, bot });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pause failed';
    res.status(500).json({ success: false, error: message });
  }
});

apiRouter.post('/bots/:id/resume', async (req: Request, res: Response) => {
  try {
    const bot = await tradingWorker.resumeBot(req.params.id);
    res.json({ success: true, bot });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resume failed';
    res.status(500).json({ success: false, error: message });
  }
});

apiRouter.post('/bots/:id/stop', async (req: Request, res: Response) => {
  try {
    const bot = await tradingWorker.stopBot(req.params.id, 'Stopped via API');
    res.json({ success: true, bot });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stop failed';
    res.status(500).json({ success: false, error: message });
  }
});

apiRouter.get('/bots/:id/status', (req: Request, res: Response) => {
  const bot = storage.getBotById(req.params.id);
  if (!bot) return res.status(404).json({ success: false, error: 'Bot not found' });
  res.json({
    success: true,
    status: bot.status,
    executionState: bot.executionState,
    lastHeartbeat: bot.lastHeartbeat,
    lastProcessedTick: bot.lastProcessedTick,
    activeContractId: bot.activeContractId,
    session: bot.currentTradeSession
  });
});

apiRouter.get('/bots/:id/trades', (req: Request, res: Response) => {
  const trades = storage.getTrades(req.params.id);
  res.json({ success: true, trades });
});

apiRouter.get('/bots/:id/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  const logs = storage.getLogs(req.params.id, limit);
  res.json({ success: true, logs });
});

// Trades general
apiRouter.get('/trades', (req: Request, res: Response) => {
  const botId = req.query.botId as string;
  const trades = storage.getTrades(botId);
  res.json({ success: true, trades });
});

// Analytics & Overview
apiRouter.get('/analytics', (_req: Request, res: Response) => {
  const bots = storage.getBots();
  const trades = storage.getTrades();
  const accounts = storage.getDerivAccounts();

  const totalDeployed = bots.length;
  const running = bots.filter(b => b.status === 'RUNNING').length;
  const scheduled = bots.filter(b => b.status === 'SCHEDULED').length;
  const paused = bots.filter(b => b.status === 'PAUSED').length;
  const failed = bots.filter(b => b.status === 'FAILED' || b.status === 'RISK_LIMIT_REACHED').length;

  const realTrades = trades.filter(t => t.accountMode === 'real');
  const demoTrades = trades.filter(t => t.accountMode === 'demo');

  const totalRealizedPL = realTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const totalSimulatedPL = demoTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const activeContracts = trades.filter(t => t.status === 'OPEN').length;

  res.json({
    success: true,
    metrics: {
      totalDeployed,
      running,
      scheduled,
      paused,
      failed,
      totalRealizedPL: Math.round(totalRealizedPL * 100) / 100,
      totalSimulatedPL: Math.round(totalSimulatedPL * 100) / 100,
      activeContracts,
      totalTradesCount: trades.length,
      winRate: trades.length > 0
        ? Math.round((trades.filter(t => t.status === 'WON').length / trades.length) * 100)
        : 0
    },
    activeAccounts: accounts
  });
});

// Worker & Server Health Status
apiRouter.get('/worker/status', (_req: Request, res: Response) => {
  const activeWorkers = storage.getActiveWorkers();
  const runningBots = tradingWorker.getRunningBots();

  res.json({
    success: true,
    server: {
      status: 'ONLINE',
      uptimeSeconds: Math.round(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timeUtc: new Date().toISOString()
    },
    worker: {
      activeWorkersCount: activeWorkers.length,
      instances: activeWorkers,
      runningBotsCount: runningBots.length,
      derivWsConnected: derivClient.isWsConnected()
    }
  });
});

// Logs & Notifications
apiRouter.get('/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 200;
  const logs = storage.getLogs(undefined, limit);
  res.json({ success: true, logs });
});

apiRouter.get('/notifications', (_req: Request, res: Response) => {
  const notifications = storage.getNotifications(DEFAULT_USER_ID);
  res.json({ success: true, notifications });
});

apiRouter.post('/notifications/read', (_req: Request, res: Response) => {
  storage.markNotificationsRead(DEFAULT_USER_ID);
  res.json({ success: true });
});
