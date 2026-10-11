export type BotStatus =
  | 'DRAFT'
  | 'SAVED'
  | 'QUEUED'
  | 'DEPLOYING'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'AUTHORIZATION_REQUIRED'
  | 'RISK_LIMIT_REACHED';

export type WorkerExecutionState =
  | 'IDLE'
  | 'CONNECTING'
  | 'RECOVERING'
  | 'WAITING_FOR_SIGNAL'
  | 'VALIDATING'
  | 'REQUESTING_PROPOSAL'
  | 'BUYING'
  | 'TRACKING_CONTRACT'
  | 'SETTLING'
  | 'RISK_CHECK'
  | 'WAITING_FOR_NEXT_SIGNAL'
  | 'SCHEDULED'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR'
  | 'AUTHORIZATION_REQUIRED'
  | 'RISK_LIMIT_REACHED';

export type AccountMode = 'demo' | 'real';

export interface DerivAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountMode;
  currency: string;
  balance: number;
  tokenMasked: string;
  isActive: boolean;
  connectedAt: string;
  lastVerifiedAt: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'INVALID';
}

export interface MarketSymbolInfo {
  symbol: string;
  displayName: string;
  marketGroup: string;
  is1sVolatility: boolean;
  isStandard8: boolean;
  isConfigurableSlot: boolean;
  minDurationTicks: number;
  maxDurationTicks: number;
  pipSize: number;
  isOpen: boolean;
  currentPrice?: number;
  lastDigit?: number;
  lastTickTime?: string;
  priceHistory?: number[];
  digitFrequency?: number[];
}

export interface ContractSpecification {
  contractType: string;
  name: string;
  family: string;
  subtypes: string[];
  supportedMarkets: string[];
  minStake: number;
  maxStake: number;
  currencies: string[];
  supportedDurations: {
    unit: 't' | 's' | 'm' | 'h' | 'd';
    min: number;
    max: number;
  }[];
  requiresBarrier: boolean;
  barrierType?: 'offset' | 'absolute' | 'digit';
  allowsEarlyClose: boolean;
}

export type StrategyType =
  | 'MOMENTUM_TREND'
  | 'MEAN_REVERSION'
  | 'DIGIT_FREQUENCY_ANALYSIS'
  | 'VOLATILITY_BREAKOUT'
  | 'ACCUMULATOR_COMPOUNDER'
  | 'MULTIPLIER_DYNAMIC_SCALP'
  | 'HYBRID_FAILOVER_ROTATION';

export interface StrategyConfig {
  type: StrategyType;
  name: string;
  description: string;
  entryConditions: {
    indicator: 'RSI' | 'SMA_CROSS' | 'DIGIT_REPEAT' | 'TICK_MOMENTUM' | 'VOLATILITY_SPIKE';
    threshold: number;
    consecutiveTicksRequired: number;
    targetDigit?: number;
    barrierDigit?: number;
    growthRate?: number;
    limitOrder?: number;
    multiplier?: number;
  };
  filters: {
    avoidTickNoise: boolean;
    maxSpreadPips: number;
    signalExpirationSeconds: number;
  };
  rotationRules?: {
    enabled: boolean;
    switchOnLoss: boolean;
    switchOnWinCount: number;
    targetStrategy?: StrategyType;
    targetContract?: string;
  };
}

export interface RiskConfig {
  stakeType: 'fixed' | 'percentage';
  stakeAmount: number;
  stakePercentage: number;
  maxStake: number;
  maxConcurrentContracts: number;
  maxDailyLoss: number;
  maxDailyProfit: number;
  maxConsecutiveLosses: number;
  maxTradesPerSession: number;
  cooldownPeriodSeconds: number;
  maxAccountDrawdownPercent: number;
  emergencyStopBalanceMin: number;
}

export interface ScheduleConfig {
  type: 'IMMEDIATE' | 'SCHEDULED_WINDOW' | 'RECURRING';
  startDateTime?: string;
  stopDateTime?: string;
  runUntilStopped: boolean;
  timezone: string;
  permittedDays: number[];
  permittedStartHourUtc: number;
  permittedEndHourUtc: number;
  recurringCron?: string;
}

export interface BotRecord {
  id: string;
  userId: string;
  derivAccountId: string;
  name: string;
  description: string;
  accountMode: AccountMode;
  selectedMarkets: string[];
  selectedContractTypes: string[];
  strategy: StrategyConfig;
  risk: RiskConfig;
  schedule: ScheduleConfig;
  status: BotStatus;
  executionState: WorkerExecutionState;
  workerId?: string;
  lastHeartbeat?: string;
  deployedAt?: string;
  startedAt?: string;
  stoppedAt?: string;
  lastProcessedTick?: {
    symbol: string;
    quote: number;
    epoch: number;
    digit: number;
  };
  activeContractId?: string;
  currentTradeSession: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    consecutiveLosses: number;
    realizedProfit: number;
    sessionStartTime: string;
    lastTradeTime?: string;
    inCooldownUntil?: string;
  };
  lastError?: string;
  lastSuccessResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecord {
  id: string;
  botId: string;
  botName: string;
  userId: string;
  derivAccountId: string;
  accountMode: AccountMode;
  symbol: string;
  contractType: string;
  contractId: string;
  purchaseReqId: string;
  purchaseTime: string;
  settleTime?: string;
  stake: number;
  payout: number;
  profit: number;
  status: 'PENDING' | 'OPEN' | 'WON' | 'LOST' | 'CANCELLED';
  entrySpot: number;
  exitSpot?: number;
  barrier?: string;
  duration: number;
  durationUnit: string;
  strategyUsed: string;
  notes?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  botId?: string;
  userId?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'RISK_ALERT' | 'TRADE';
  message: string;
  context?: Record<string, unknown>;
}

export interface WorkerStatusPayload {
  server: {
    status: string;
    uptimeSeconds: number;
    pid: number;
    nodeVersion: string;
    memoryMb: number;
    timeUtc: string;
  };
  worker: {
    activeWorkersCount: number;
    instances: Array<{
      instanceId: string;
      hostname: string;
      pid: number;
      startedAt: string;
      lastHeartbeat: string;
      status: string;
      activeBotsCount: number;
      subscribedSymbols: string[];
      memoryUsageMb: number;
      databaseConnected: boolean;
      derivWsConnected: boolean;
    }>;
    runningBotsCount: number;
    derivWsConnected: boolean;
  };
}

export interface AnalyticsPayload {
  metrics: {
    totalDeployed: number;
    running: number;
    scheduled: number;
    paused: number;
    failed: number;
    totalRealizedPL: number;
    totalSimulatedPL: number;
    activeContracts: number;
    totalTradesCount: number;
    winRate: number;
  };
  activeAccounts: DerivAccount[];
}
