import { BotRecord, StrategyConfig } from '../types.js';
import { DerivTick } from '../deriv/client.js';

export interface StrategySignal {
  action: 'BUY' | 'WAIT';
  symbol: string;
  contractSubtype: string; // 'CALL' | 'PUT' | 'DIGITODD' | 'DIGITEVEN' | 'DIGITDIFF' etc.
  confidence: number;
  barrier?: string;
  durationTicks: number;
  rationale: string;
}

export class StrategyEngine {
  public static evaluate(
    bot: BotRecord,
    tick: DerivTick,
    priceHistory: number[],
    digitFrequencies: number[]
  ): StrategySignal {
    const strat = bot.strategy;
    const history = priceHistory || [tick.quote];

    // Filter check: tick noise & spread
    if (strat.filters.avoidTickNoise && history.length >= 2) {
      const lastDiff = Math.abs(history[history.length - 1] - history[history.length - 2]);
      if (lastDiff === 0) {
        return {
          action: 'WAIT',
          symbol: tick.symbol,
          contractSubtype: '',
          confidence: 0,
          durationTicks: 5,
          rationale: 'Suppressed: Zero tick displacement (noise filter active).'
        };
      }
    }

    switch (strat.type) {
      case 'MOMENTUM_TREND':
        return this.evaluateMomentumTrend(bot, tick, history);
      case 'MEAN_REVERSION':
        return this.evaluateMeanReversion(bot, tick, history);
      case 'DIGIT_FREQUENCY_ANALYSIS':
        return this.evaluateDigitFrequency(bot, tick, digitFrequencies);
      case 'VOLATILITY_BREAKOUT':
        return this.evaluateVolatilityBreakout(bot, tick, history);
      case 'ACCUMULATOR_COMPOUNDER':
        return this.evaluateAccumulator(bot, tick);
      case 'MULTIPLIER_DYNAMIC_SCALP':
        return this.evaluateMultiplier(bot, tick, history);
      case 'HYBRID_FAILOVER_ROTATION':
      default:
        return this.evaluateHybridRotation(bot, tick, history, digitFrequencies);
    }
  }

  private static evaluateMomentumTrend(
    bot: BotRecord,
    tick: DerivTick,
    history: number[]
  ): StrategySignal {
    const requiredTicks = bot.strategy.entryConditions.consecutiveTicksRequired || 3;
    if (history.length < requiredTicks + 1) {
      return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Building tick window...' };
    }

    const window = history.slice(-requiredTicks - 1);
    let consecutiveRises = 0;
    let consecutiveFalls = 0;

    for (let i = 1; i < window.length; i++) {
      if (window[i] > window[i - 1]) consecutiveRises++;
      else if (window[i] < window[i - 1]) consecutiveFalls++;
    }

    if (consecutiveRises >= requiredTicks && bot.selectedContractTypes.includes('CALL')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'CALL',
        confidence: 0.88,
        durationTicks: 5,
        rationale: `Bullish momentum detected: ${consecutiveRises} consecutive rising ticks.`
      };
    }

    if (consecutiveFalls >= requiredTicks && bot.selectedContractTypes.includes('PUT')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'PUT',
        confidence: 0.88,
        durationTicks: 5,
        rationale: `Bearish momentum detected: ${consecutiveFalls} consecutive falling ticks.`
      };
    }

    return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Monitoring directional momentum...' };
  }

  private static evaluateMeanReversion(
    bot: BotRecord,
    tick: DerivTick,
    history: number[]
  ): StrategySignal {
    if (history.length < 10) {
      return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Accumulating price sample...' };
    }

    const sum = history.slice(-10).reduce((acc, p) => acc + p, 0);
    const mean = sum / 10;
    const deviation = (tick.quote - mean) / mean;

    if (deviation < -0.0004 && bot.selectedContractTypes.includes('CALL')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'CALL',
        confidence: 0.82,
        durationTicks: 5,
        rationale: `Oversold stretch (${(deviation * 100).toFixed(3)}%). Anticipating reversion upward.`
      };
    }

    if (deviation > 0.0004 && bot.selectedContractTypes.includes('PUT')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'PUT',
        confidence: 0.82,
        durationTicks: 5,
        rationale: `Overbought stretch (+${(deviation * 100).toFixed(3)}%). Anticipating reversion downward.`
      };
    }

    return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Within mean reversion equilibrium.' };
  }

  private static evaluateDigitFrequency(
    bot: BotRecord,
    tick: DerivTick,
    digitFrequencies: number[]
  ): StrategySignal {
    const isOdd = tick.digit % 2 !== 0;

    // Check Odd/Even contracts
    if (bot.selectedContractTypes.includes('DIGITODD') || bot.selectedContractTypes.includes('DIGITEVEN')) {
      // If last digit was even, alternate or follow parity streak
      const targetSubtype = isOdd ? 'DIGITEVEN' : 'DIGITODD';
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: targetSubtype,
        confidence: 0.79,
        durationTicks: 1,
        rationale: `Parity rotation: Last digit was ${tick.digit} (${isOdd ? 'Odd' : 'Even'}). Target ${targetSubtype}.`
      };
    }

    // Check Differs contracts (Target configured barrier or least frequent digit)
    if (bot.selectedContractTypes.includes('DIGITDIFF')) {
      const barrier = bot.strategy.entryConditions.barrierDigit !== undefined
        ? `${bot.strategy.entryConditions.barrierDigit}`
        : (bot.strategy.entryConditions.targetDigit !== undefined
            ? `${bot.strategy.entryConditions.targetDigit}`
            : '0');

      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'DIGITDIFF',
        confidence: 0.91,
        barrier,
        durationTicks: 1,
        rationale: `Statistical Digit Differs: targeting barrier digit ${barrier} (win condition: last digit != ${barrier}).`
      };
    }

    // Default Over/Under
    if (bot.selectedContractTypes.includes('DIGITOVER') || bot.selectedContractTypes.includes('DIGITUNDER')) {
      const barrier = bot.strategy.entryConditions.barrierDigit !== undefined
        ? `${bot.strategy.entryConditions.barrierDigit}`
        : (bot.strategy.entryConditions.targetDigit !== undefined
            ? `${bot.strategy.entryConditions.targetDigit}`
            : '5');
      const targetSubtype = bot.selectedContractTypes.includes('DIGITOVER') ? 'DIGITOVER' : 'DIGITUNDER';

      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: targetSubtype,
        confidence: 0.80,
        barrier,
        durationTicks: 2,
        rationale: `Digit range: last digit ${tick.digit}, purchasing ${targetSubtype} barrier digit ${barrier}.`
      };
    }

    return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 1, rationale: 'Awaiting digit distribution bias.' };
  }

  private static evaluateVolatilityBreakout(
    bot: BotRecord,
    tick: DerivTick,
    history: number[]
  ): StrategySignal {
    if (history.length < 6) {
      return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Measuring baseline variance...' };
    }

    const baseline = history[history.length - 6];
    const diff = tick.quote - baseline;
    const threshold = (baseline * 0.0003);

    if (diff > threshold && (bot.selectedContractTypes.includes('CALL') || bot.selectedContractTypes.includes('HIGHER'))) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'CALL',
        confidence: 0.85,
        durationTicks: 5,
        rationale: `Volatility expansion breakout upward (+${diff.toFixed(2)} pts).`
      };
    }

    if (diff < -threshold && (bot.selectedContractTypes.includes('PUT') || bot.selectedContractTypes.includes('LOWER'))) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'PUT',
        confidence: 0.85,
        durationTicks: 5,
        rationale: `Volatility expansion breakout downward (${diff.toFixed(2)} pts).`
      };
    }

    return { action: 'WAIT', symbol: tick.symbol, contractSubtype: '', confidence: 0, durationTicks: 5, rationale: 'Volatility within normal bounds.' };
  }

  private static evaluateAccumulator(bot: BotRecord, tick: DerivTick): StrategySignal {
    const growth = bot.strategy.entryConditions.growthRate || 2;
    const limit = bot.strategy.entryConditions.limitOrder || 10;
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: 'ACCU',
      confidence: 0.82,
      durationTicks: Math.min(20, Math.max(1, limit)),
      rationale: `Accumulator tick compounding: growth rate ${growth}%, limit order take-profit at ${limit} ticks with knockout guard.`
    };
  }

  private static evaluateMultiplier(bot: BotRecord, tick: DerivTick, history: number[]): StrategySignal {
    const isUp = history.length >= 2 ? tick.quote >= history[history.length - 2] : true;
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: isUp ? 'MULTUP' : 'MULTDOWN',
      confidence: 0.83,
      durationTicks: 30,
      rationale: `Multiplier Scalp: ${isUp ? 'MULTUP' : 'MULTDOWN'} x${bot.strategy.entryConditions.multiplier || 100} with dynamic take-profit.`
    };
  }

  private static evaluateHybridRotation(
    bot: BotRecord,
    tick: DerivTick,
    history: number[],
    digitFrequencies: number[]
  ): StrategySignal {
    // If consecutive losses > 0, rotate between Digit Differs and Momentum
    if (bot.currentTradeSession.consecutiveLosses > 0) {
      return this.evaluateDigitFrequency(bot, tick, digitFrequencies);
    }
    return this.evaluateMomentumTrend(bot, tick, history);
  }
}
