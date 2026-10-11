import { makeAutoObservable } from 'mobx';

class ClientStore {
  accountType: 'real' | 'demo' = (localStorage.getItem('deriv_active_account_type') as 'real' | 'demo') || 'real';
  isConnected: boolean = !!localStorage.getItem('deriv_oauth_access_token');
  isConnecting: boolean = false;
  balance: number = parseFloat(localStorage.getItem('deriv_cached_balance') || '0.00');
  currency: string = localStorage.getItem('deriv_cached_currency') || 'USD';
  loginId: string = localStorage.getItem('deriv_options_account_id') || '';

  constructor() {
    makeAutoObservable(this);
  }

  setAccountType(type: 'real' | 'demo') {
    this.accountType = type;
    localStorage.setItem('deriv_active_account_type', type);
  }

  setIsConnected(connected: boolean) {
    this.isConnected = connected;
  }

  setIsConnecting(connecting: boolean) {
    this.isConnecting = connecting;
  }

  setBalance(balance: number) {
    this.balance = balance;
    localStorage.setItem('deriv_cached_balance', balance.toString());
  }

  setCurrency(currency: string) {
    this.currency = currency;
    localStorage.setItem('deriv_cached_currency', currency);
  }

  setLoginId(loginId: string) {
    this.loginId = loginId;
    localStorage.setItem('deriv_options_account_id', loginId);
  }
}

export class RootStore {
  client: ClientStore;

  constructor() {
    this.client = new ClientStore();
  }
}

export const rootStore = new RootStore();
