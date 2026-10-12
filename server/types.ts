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

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DerivAccount {
  id: string;
  userId: string;
  accountNumber: string; // e.g. VRTC123456 or CR123456
  accountType: AccountMode;
  currency: string;
  balance: number;
  tokenMasked: string;
  tokenEncrypted: string;
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
  digitFrequency?: number[]; // digits 0-9 counts
}

export type ContractFamily =
  | 'RISE_FALL'
  | 'HIGHER_LOWER'
  | 'TOUCH_NO_TOUCH'
  | 'ENDS_IN_OUT'
  | 'STAYS_IN_GOES_OUT'
  | 'DIGITS'
  | 'ACCUMULATORS'
  | 'MULTIPLIERS'
  | 'TURBOS'
  | 'VANILLAS'
  | 'RUN_HIGH_LOW'
  | 'ASIAN'
  | 'RESET'
  | 'LOOKBACK';

export interface ContractSpecification {
  contractType: string;
  name: string;
  family: ContractFamily;
  subtypes: string[]; // e.g. ['CALL', 'PUT'], ['DIGITMATCH', 'DIGITDIFF'], etc.
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
    barrierDigit?: number; // 0-9 for Differs, Over/Under, Matches
    growthRate?: number; // for accumulators e.g. 1% - 5%
    limitOrder?: number; // for accumulators: max ticks or profit target
    multiplier?: number; // for multipliers e.g. 100, 200
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
  stakePercentage: number; // e.g. 1% of balance capped
  maxStake: number;
  martingaleMultiplier?: number;
  takeProfit?: number;
  stopLoss?: number;
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
  startDateTime?: string; // ISO UTC
  stopDateTime?: string; // ISO UTC
  runUntilStopped: boolean;
  timezone: string;
  permittedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  permittedStartHourUtc: number; // 0-23
  permittedEndHourUtc: number; // 0-23
  recurringCron?: string;
}

export interface BotRecord {
  id: string;
  userId: string;
  derivAccountId: string;
  name: string;
  description: string;
  accountMode: AccountMode;
  selectedMarkets: string[]; // e.g. ["1HZ10V", "1HZ50V"]
  selectedContractTypes: string[]; // e.g. ["CALL", "PUT"]
  strategy: StrategyConfig;
  risk: RiskConfig;
  schedule: ScheduleConfig;
  status: BotStatus;
  executionState: WorkerExecutionState;
  // Runtime worker telemetry
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

export interface WorkerInstanceRecord {
  instanceId: string;
  hostname: string;
  pid: number;
  startedAt: string;
  lastHeartbeat: string;
  status: 'HEALTHY' | 'DEGRADED' | 'SHUTTING_DOWN';
  activeBotsCount: number;
  subscribedSymbols: string[];
  memoryUsageMb: number;
  databaseConnected: boolean;
  derivWsConnected: boolean;
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

export interface NotificationRecord {
  id: string;
  userId: string;
  timestamp: string;
  type:
    | 'BOT_DEPLOYED'
    | 'SCHEDULE_STARTED'
    | 'BOT_PAUSED'
    | 'BOT_STOPPED'
    | 'TRADE_OPENED'
    | 'TRADE_SETTLED'
    | 'RISK_LIMIT_HIT'
    | 'AUTH_EXPIRED'
    | 'WORKER_RECOVERED'
    | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
}
