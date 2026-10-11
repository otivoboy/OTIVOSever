import fs from 'fs';
import path from 'path';
import {
  UserAccount,
  DerivAccount,
  BotRecord,
  TradeRecord,
  AuditLogRecord,
  NotificationRecord,
  WorkerInstanceRecord
} from './types.js';

interface DatabaseSchema {
  users: UserAccount[];
  derivAccounts: DerivAccount[];
  bots: BotRecord[];
  trades: TradeRecord[];
  logs: AuditLogRecord[];
  notifications: NotificationRecord[];
  workerInstances: WorkerInstanceRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

export class DurableStorage {
  private memoryState: DatabaseSchema;
  private isSaving = false;
  private savePending = false;

  constructor() {
    this.memoryState = this.loadInitialState();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadInitialState(): DatabaseSchema {
    this.ensureDirectoryExists();
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: (parsed.users || []).filter((u: any) => u.name !== 'Stephen'),
          derivAccounts: (parsed.derivAccounts || []).filter((a: any) => a.accountNumber !== 'CR4829103'),
          bots: (parsed.bots || []).filter((b: any) => b.id !== 'bot_vol_momentum_01'),
          trades: (parsed.trades || []).filter((t: any) => !t.id.startsWith('trade_sample_')),
          logs: parsed.logs || [],
          notifications: parsed.notifications || [],
          workerInstances: parsed.workerInstances || []
        };
      } catch (err) {
        console.error('[STORAGE] Error reading data file, initializing fresh:', err);
      }
    }

    // Default Clean State: No false accounts, bots, trades, or profits
    const initial: DatabaseSchema = {
      users: [
        {
          id: 'user_master_1',
          name: 'Trader',
          email: 'trader@otivo.ai',
          createdAt: new Date().toISOString()
        }
      ],
      derivAccounts: [],
      bots: [],
      trades: [],
      logs: [
        {
          id: 'log_boot_01',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'OTIVO Cloud Worker Storage Engine initialized. Durable state active.'
        }
      ],
      notifications: [
        {
          id: 'notif_init_01',
          userId: 'user_master_1',
          timestamp: new Date().toISOString(),
          type: 'WORKER_RECOVERED',
          title: 'Cloud Worker Online',
          message: 'Persistent backend engine is connected to Deriv API and ready for deployment.',
          read: false
        }
      ],
      workerInstances: []
    };

    this.saveStateImmediately(initial);
    return initial;
  }

  private saveStateImmediately(state: DatabaseSchema) {
    try {
      this.ensureDirectoryExists();
      const tmpPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DATA_FILE);
    } catch (err) {
      console.error('[STORAGE] Atomic save failed:', err);
    }
  }

  private persist() {
    if (this.isSaving) {
      this.savePending = true;
      return;
    }
    this.isSaving = true;
    try {
      this.ensureDirectoryExists();
      const tmpPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.memoryState, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DATA_FILE);
    } catch (err) {
      console.error('[STORAGE] Persist error:', err);
    } finally {
      this.isSaving = false;
      if (this.savePending) {
        this.savePending = false;
        this.persist();
      }
    }
  }

  // User queries
  public getUsers(): UserAccount[] {
    return [...this.memoryState.users];
  }

  public getUserById(id: string): UserAccount | undefined {
    return this.memoryState.users.find(u => u.id === id);
  }

  // Account queries
  public getDerivAccounts(userId?: string): DerivAccount[] {
    if (userId) {
      return this.memoryState.derivAccounts.filter(a => a.userId === userId);
    }
    return [...this.memoryState.derivAccounts];
  }

  public getDerivAccountById(id: string): DerivAccount | undefined {
    return this.memoryState.derivAccounts.find(a => a.id === id);
  }

  public saveDerivAccount(account: DerivAccount): DerivAccount {
    const idx = this.memoryState.derivAccounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      this.memoryState.derivAccounts[idx] = account;
    } else {
      this.memoryState.derivAccounts.push(account);
    }
    this.persist();
    return account;
  }

  public setActiveDerivAccount(userId: string, accountId: string): void {
    this.memoryState.derivAccounts.forEach(acc => {
      if (acc.userId === userId) {
        acc.isActive = acc.id === accountId;
      }
    });
    this.persist();
  }

  public updateAccountBalance(accountId: string, newBalance: number): void {
    const acc = this.memoryState.derivAccounts.find(a => a.id === accountId);
    if (acc) {
      acc.balance = Math.round(newBalance * 100) / 100;
      acc.lastVerifiedAt = new Date().toISOString();
      this.persist();
    }
  }

  // Bots queries
  public getBots(userId?: string): BotRecord[] {
    if (userId) {
      return this.memoryState.bots.filter(b => b.userId === userId);
    }
    return [...this.memoryState.bots];
  }

  public getBotById(id: string): BotRecord | undefined {
    return this.memoryState.bots.find(b => b.id === id);
  }

  public saveBot(bot: BotRecord): BotRecord {
    const idx = this.memoryState.bots.findIndex(b => b.id === bot.id);
    bot.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.memoryState.bots[idx] = bot;
    } else {
      this.memoryState.bots.push(bot);
    }
    this.persist();
    return bot;
  }

  public deleteBot(id: string): boolean {
    const idx = this.memoryState.bots.findIndex(b => b.id === id);
    if (idx >= 0) {
      this.memoryState.bots.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // Trades queries
  public getTrades(botId?: string): TradeRecord[] {
    if (botId) {
      return this.memoryState.trades.filter(t => t.botId === botId);
    }
    return [...this.memoryState.trades].sort((a, b) => 
       new Date(b.purchaseTime).getTime() - new Date(a.purchaseTime).getTime()
    );
  }

  public saveTrade(trade: TradeRecord): TradeRecord {
    const idx = this.memoryState.trades.findIndex(t => t.id === trade.id);
    if (idx >= 0) {
      this.memoryState.trades[idx] = trade;
    } else {
      this.memoryState.trades.push(trade);
    }
    this.persist();
    return trade;
  }

  // Audit Logs
  public addLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): AuditLogRecord {
    const record: AuditLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.memoryState.logs.unshift(record);
    // Keep last 1000 logs
    if (this.memoryState.logs.length > 1000) {
      this.memoryState.logs = this.memoryState.logs.slice(0, 1000);
    }
    this.persist();
    return record;
  }

  public getLogs(botId?: string, limit = 100): AuditLogRecord[] {
    let logs = this.memoryState.logs;
    if (botId) {
      logs = logs.filter(l => l.botId === botId);
    }
    return logs.slice(0, limit);
  }

  // Notifications
  public addNotification(entry: Omit<NotificationRecord, 'id' | 'timestamp' | 'read'>): NotificationRecord {
    const notif: NotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...entry
    };
    this.memoryState.notifications.unshift(notif);
    if (this.memoryState.notifications.length > 200) {
      this.memoryState.notifications = this.memoryState.notifications.slice(0, 200);
    }
    this.persist();
    return notif;
  }

  public getNotifications(userId?: string): NotificationRecord[] {
    if (userId) {
      return this.memoryState.notifications.filter(n => n.userId === userId);
    }
    return [...this.memoryState.notifications];
  }

  public markNotificationsRead(userId?: string): void {
    this.memoryState.notifications.forEach(n => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    this.persist();
  }

  // Worker Instance Heartbeat & lease management
  public recordWorkerHeartbeat(worker: WorkerInstanceRecord): void {
    const idx = this.memoryState.workerInstances.findIndex(w => w.instanceId === worker.instanceId);
    if (idx >= 0) {
      this.memoryState.workerInstances[idx] = worker;
    } else {
      this.memoryState.workerInstances.push(worker);
    }
    this.persist();
  }

  public getActiveWorkers(): WorkerInstanceRecord[] {
    const twoMinutesAgo = Date.now() - 120000;
    return this.memoryState.workerInstances.filter(w => {
      const hb = new Date(w.lastHeartbeat).getTime();
      return hb > twoMinutesAgo;
    });
  }
}

export const storage = new DurableStorage();
