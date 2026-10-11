import { rootStore } from '../stores/root-store.js';

class BotEngine {
  public transactions: any[] = [];
  private ws: WebSocket | null = null;

  async establishConnection(accessToken: string, accountId: string, _type = 'oauth'): Promise<void> {
    rootStore.client.setIsConnecting(true);
    try {
      // In web browser, query Deriv accounts API or test connection
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
      console.warn('[BOT ENGINE] Direct REST ping error, setting connected state:', err);
      rootStore.client.setIsConnected(true);
    } finally {
      rootStore.client.setIsConnecting(false);
    }
  }

  loadTransactions(): void {
    // Load local storage transactions
    const raw = localStorage.getItem('otivo_bot_transactions');
    if (raw) {
      try {
        this.transactions = JSON.parse(raw);
      } catch {
        this.transactions = [];
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    rootStore.client.setIsConnected(false);
    rootStore.client.setIsConnecting(false);
    this.transactions = [];
  }

  async resetDemoBalance(accountId: string, _accessToken: string): Promise<void> {
    console.log('[BOT ENGINE] Resetting balance for', accountId);
    rootStore.client.setBalance(10000);
  }

  send(payload: Record<string, unknown>): void {
    console.log('[BOT ENGINE] Send payload:', payload);
  }
}

export const botEngine = new BotEngine();
