import { BotRecord, DerivAccount, RiskConfig } from '../types.js';
import { storage } from '../storage.js';

export interface RiskCheckResult {
  allowed: boolean;
  stake: number;
  reason?: string;
  triggerType?: 'DAILY_LOSS' | 'DAILY_PROFIT' | 'CONSECUTIVE_LOSS' | 'MAX_TRADES' | 'COOLDOWN' | 'DRAWDOWN' | 'EMERGENCY_STOP' | 'INSUFFICIENT_FUNDS';
}

export class RiskManager {
  public static evaluateRisk(bot: BotRecord, account?: DerivAccount): RiskCheckResult {
    const risk = bot.risk;
    const session = bot.currentTradeSession;

    // 1. Account & Funds check
    if (!account) {
      return { allowed: false, stake: 0, reason: 'Deriv account not linked or unavailable.' };
    }

    if (account.balance <= risk.emergencyStopBalanceMin) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'EMERGENCY_STOP',
        reason: `Account balance ($${account.balance}) hit emergency stop threshold ($${risk.emergencyStopBalanceMin}).`
      };
    }

    // 2. Cooldown check
    if (session.inCooldownUntil) {
      const cooldownUntil = new Date(session.inCooldownUntil).getTime();
      const now = Date.now();
      if (now < cooldownUntil) {
        const remainingSec = Math.ceil((cooldownUntil - now) / 1000);
        return {
          allowed: false,
          stake: 0,
          triggerType: 'COOLDOWN',
          reason: `Bot in risk cooldown for ${remainingSec}s following trade settlement.`
        };
      }
    }

    // 3. Max consecutive losses
    if (session.consecutiveLosses >= risk.maxConsecutiveLosses) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'CONSECUTIVE_LOSS',
        reason: `Hit maximum consecutive losses limit (${session.consecutiveLosses}/${risk.maxConsecutiveLosses}).`
      };
    }

    // 4. Max daily loss
    if (session.realizedProfit < 0 && Math.abs(session.realizedProfit) >= risk.maxDailyLoss) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'DAILY_LOSS',
        reason: `Hit maximum daily loss limit (-$${Math.abs(session.realizedProfit).toFixed(2)} / -$${risk.maxDailyLoss}).`
      };
    }

    // 5. Max daily profit (Take-profit target reached)
    if (session.realizedProfit >= risk.maxDailyProfit) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'DAILY_PROFIT',
        reason: `Daily profit target hit (+$${session.realizedProfit.toFixed(2)} / +$${risk.maxDailyProfit}). Protect profits.`
      };
    }

    // 6. Max trades per session
    if (session.totalTrades >= risk.maxTradesPerSession) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'MAX_TRADES',
        reason: `Session trades limit reached (${session.totalTrades}/${risk.maxTradesPerSession}).`
      };
    }

    // 7. Calculate stake based on config
    let calculatedStake = risk.stakeAmount;
    if (risk.stakeType === 'percentage') {
      const pctStake = (account.balance * risk.stakePercentage) / 100;
      calculatedStake = Math.min(pctStake, risk.maxStake);
    }

    // Clamp stake
    calculatedStake = Math.max(0.35, Math.min(calculatedStake, risk.maxStake));
    calculatedStake = Math.round(calculatedStake * 100) / 100;

    if (calculatedStake > account.balance) {
      return {
        allowed: false,
        stake: 0,
        triggerType: 'INSUFFICIENT_FUNDS',
        reason: `Calculated stake ($${calculatedStake}) exceeds account balance ($${account.balance}).`
      };
    }

    return {
      allowed: true,
      stake: calculatedStake
    };
  }

  public static handleRiskLimitBreached(bot: BotRecord, reason: string): void {
    bot.status = 'RISK_LIMIT_REACHED';
    bot.executionState = 'RISK_LIMIT_REACHED';
    bot.lastError = reason;
    storage.saveBot(bot);

    storage.addLog({
      botId: bot.id,
      userId: bot.userId,
      level: 'RISK_ALERT',
      message: `[RISK ENGINE] Circuit breaker triggered on bot '${bot.name}': ${reason}`,
      context: { botId: bot.id, session: bot.currentTradeSession }
    });

    storage.addNotification({
      userId: bot.userId,
      type: 'RISK_LIMIT_HIT',
      title: 'Risk Circuit Breaker Triggered',
      message: `Bot "${bot.name}" paused: ${reason}`,
      data: { botId: bot.id, reason }
    });
  }
}
