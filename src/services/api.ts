import {
  BotRecord,
  DerivAccount,
  MarketSymbolInfo,
  ContractSpecification,
  TradeRecord,
  AuditLogRecord,
  WorkerStatusPayload,
  AnalyticsPayload
} from '../types/index.js';

const BASE_URL = '/api';

export const api = {
  // Accounts
  async getAccounts(): Promise<DerivAccount[]> {
    const res = await fetch(`${BASE_URL}/accounts`);
    const data = await res.json();
    return data.accounts || [];
  },

  async connectAccount(params: {
    token: string;
    accountNumber: string;
    accountType: 'demo' | 'real';
    currency?: string;
  }): Promise<DerivAccount> {
    const res = await fetch(`${BASE_URL}/accounts/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to connect account');
    return data.account;
  },

  async switchAccount(id: string): Promise<void> {
    await fetch(`${BASE_URL}/accounts/${id}/switch`, { method: 'POST' });
  },

  async disconnectAccount(id: string): Promise<void> {
    await fetch(`${BASE_URL}/accounts/${id}/disconnect`, { method: 'POST' });
  },

  // Markets & Contracts
  async getMarkets(): Promise<{ markets: MarketSymbolInfo[]; catalogueOptions: MarketSymbolInfo[] }> {
    const res = await fetch(`${BASE_URL}/markets`);
    const data = await res.json();
    return { markets: data.markets || [], catalogueOptions: data.catalogueOptions || [] };
  },

  async configureMarketSlot(slotNumber: 1 | 2, catalogueSymbol: string): Promise<MarketSymbolInfo> {
    const res = await fetch(`${BASE_URL}/markets/configure-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotNumber, catalogueSymbol })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to configure market slot');
    return data.market;
  },

  async getContracts(): Promise<ContractSpecification[]> {
    const res = await fetch(`${BASE_URL}/contracts`);
    const data = await res.json();
    return data.contracts || [];
  },

  // Bots
  async getBots(): Promise<BotRecord[]> {
    const res = await fetch(`${BASE_URL}/bots`);
    const data = await res.json();
    return data.bots || [];
  },

  async createBot(botData: Partial<BotRecord>): Promise<BotRecord> {
    const res = await fetch(`${BASE_URL}/bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create bot');
    return data.bot;
  },

  async deployBot(id: string): Promise<BotRecord> {
    const res = await fetch(`${BASE_URL}/bots/${id}/deploy`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to deploy bot');
    return data.bot;
  },

  async pauseBot(id: string): Promise<BotRecord> {
    const res = await fetch(`${BASE_URL}/bots/${id}/pause`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to pause bot');
    return data.bot;
  },

  async resumeBot(id: string): Promise<BotRecord> {
    const res = await fetch(`${BASE_URL}/bots/${id}/resume`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to resume bot');
    return data.bot;
  },

  async stopBot(id: string): Promise<BotRecord> {
    const res = await fetch(`${BASE_URL}/bots/${id}/stop`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to stop bot');
    return data.bot;
  },

  async deleteBot(id: string): Promise<void> {
    await fetch(`${BASE_URL}/bots/${id}`, { method: 'DELETE' });
  },

  // Trades & Logs
  async getTrades(botId?: string): Promise<TradeRecord[]> {
    const url = botId ? `${BASE_URL}/trades?botId=${botId}` : `${BASE_URL}/trades`;
    const res = await fetch(url);
    const data = await res.json();
    return data.trades || [];
  },

  async getLogs(botId?: string, limit = 150): Promise<AuditLogRecord[]> {
    const url = botId ? `${BASE_URL}/bots/${botId}/logs?limit=${limit}` : `${BASE_URL}/logs?limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.logs || [];
  },

  // Health & Analytics
  async getWorkerStatus(): Promise<WorkerStatusPayload> {
    const res = await fetch(`${BASE_URL}/worker/status`);
    return await res.json();
  },

  async getAnalytics(): Promise<AnalyticsPayload> {
    const res = await fetch(`${BASE_URL}/analytics`);
    return await res.json();
  }
};
