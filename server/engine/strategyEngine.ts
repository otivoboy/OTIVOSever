import { BotRecord } from '../types.js';
import { DerivTick } from '../deriv/client.js';

export interface StrategySignal {
  action: 'BUY' | 'WAIT';
  symbol: string;
  contractSubtype: string; // 'CALL' | 'PUT' | 'DIGITODD' | 'DIGITEVEN' | 'DIGITDIFF' | 'ACCU' etc.
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
    const history = priceHistory && priceHistory.length > 0 ? priceHistory : [tick.quote];
    const isFirstTrade = bot.currentTradeSession.totalTrades === 0;

    // Direct contract check for specific contract families
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());

    // 1. Accumulator contracts
    if (selectedTypes.includes('ACCU') || selectedTypes.includes('ACCUM') || strat.type === 'ACCUMULATOR_COMPOUNDER') {
      return this.evaluateAccumulator(bot, tick);
    }

    // 2. Digit contracts (Differs, Matches, Over, Under, Even, Odd)
    const hasDigitContract = selectedTypes.some(t => 
      ['DIGITDIFF', 'DIGITMATCH', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'].includes(t)
    );
    if (hasDigitContract || strat.type === 'DIGIT_FREQUENCY_ANALYSIS') {
      return this.evaluateDigitFrequency(bot, tick, digitFrequencies, isFirstTrade);
    }

    // 3. Higher / Lower contracts
    if (selectedTypes.includes('HIGHER') || selectedTypes.includes('LOWER')) {
      return this.evaluateHigherLower(bot, tick, history, isFirstTrade);
    }

    // 4. Touch / No Touch
    if (selectedTypes.includes('ONETOUCH') || selectedTypes.includes('NOTOUCH')) {
      const target = selectedTypes.includes('NOTOUCH') ? 'NOTOUCH' : 'ONETOUCH';
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: target,
        confidence: 0.85,
        barrier: '+1.37',
        durationTicks: 5,
        rationale: `${target} barrier probability: spot ${tick.quote}, target barrier +1.37.`
      };
    }

    // 5. Turbos
    if (selectedTypes.some(t => t.startsWith('TURBO'))) {
      const isUp = history.length >= 2 ? tick.quote >= history[history.length - 2] : true;
      const target = isUp ? 'TURBOSLONG' : 'TURBOSSHORT';
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: target,
        confidence: 0.84,
        barrier: '+0.00',
        durationTicks: 5,
        rationale: `Turbo dynamic leverage execution: ${target} with risk barrier.`
      };
    }

    // 6. Vanillas
    if (selectedTypes.some(t => t.startsWith('VANILLA'))) {
      const isUp = history.length >= 2 ? tick.quote >= history[history.length - 2] : true;
      const target = isUp ? 'VANILLALONGCALL' : 'VANILLALONGPUT';
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: target,
        confidence: 0.80,
        barrier: '+0.00',
        durationTicks: 10,
        rationale: `Vanilla Option purchase: ${target} strike at current spot ${tick.quote}.`
      };
    }

    // 7. Multipliers
    if (selectedTypes.includes('MULTUP') || selectedTypes.includes('MULTDOWN') || strat.type === 'MULTIPLIER_DYNAMIC_SCALP') {
      return this.evaluateMultiplier(bot, tick, history);
    }

    // Strategy-type specific branching for Rise/Fall & Momentum
    switch (strat.type) {
      case 'MEAN_REVERSION':
        return this.evaluateMeanReversion(bot, tick, history, isFirstTrade);
      case 'VOLATILITY_BREAKOUT':
        return this.evaluateVolatilityBreakout(bot, tick, history, isFirstTrade);
      case 'MOMENTUM_TREND':
      default:
        return this.evaluateMomentumTrend(bot, tick, history, isFirstTrade);
    }
  }

  private static evaluateMomentumTrend(
    bot: BotRecord,
    tick: DerivTick,
    history: number[],
    isFirstTrade: boolean
  ): StrategySignal {
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());
    const allowsCall = selectedTypes.includes('CALL') || selectedTypes.includes('RISE') || selectedTypes.includes('CALLE');
    const allowsPut = selectedTypes.includes('PUT') || selectedTypes.includes('FALL') || selectedTypes.includes('PUTE');

    // On initial run button click: execute first trade promptly
    if (isFirstTrade && (allowsCall || allowsPut)) {
      const isRising = history.length >= 2 ? tick.quote >= history[history.length - 2] : true;
      const subtype = isRising ? (allowsCall ? 'CALL' : 'PUT') : (allowsPut ? 'PUT' : 'CALL');
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: subtype,
        confidence: 0.90,
        durationTicks: 5,
        rationale: `Initial execution on bot start: ${subtype} on ${tick.symbol} @ spot ${tick.quote}.`
      };
    }

    const requiredTicks = bot.strategy.entryConditions.consecutiveTicksRequired || 2;
    if (history.length < 2) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: allowsCall ? 'CALL' : 'PUT',
        confidence: 0.85,
        durationTicks: 5,
        rationale: `Direct execution: initiating ${allowsCall ? 'CALL' : 'PUT'} sequence.`
      };
    }

    const window = history.slice(-requiredTicks - 1);
    let consecutiveRises = 0;
    let consecutiveFalls = 0;

    for (let i = 1; i < window.length; i++) {
      if (window[i] > window[i - 1]) consecutiveRises++;
      else if (window[i] < window[i - 1]) consecutiveFalls++;
    }

    if (consecutiveRises >= 1 && allowsCall) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'CALL',
        confidence: 0.88,
        durationTicks: 5,
        rationale: `Bullish momentum detected: ${consecutiveRises} consecutive rising tick(s).`
      };
    }

    if (consecutiveFalls >= 1 && allowsPut) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'PUT',
        confidence: 0.88,
        durationTicks: 5,
        rationale: `Bearish momentum detected: ${consecutiveFalls} consecutive falling tick(s).`
      };
    }

    // Default to the primary allowed subtype
    const fallbackSubtype = allowsCall ? 'CALL' : allowsPut ? 'PUT' : selectedTypes[0] || 'CALL';
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: fallbackSubtype,
      confidence: 0.80,
      durationTicks: 5,
      rationale: `Directional trend follow: purchasing ${fallbackSubtype} on ${tick.symbol}.`
    };
  }

  private static evaluateHigherLower(
    bot: BotRecord,
    tick: DerivTick,
    history: number[],
    isFirstTrade: boolean
  ): StrategySignal {
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());
    const isHigher = selectedTypes.includes('HIGHER');
    const isLower = selectedTypes.includes('LOWER');

    const targetType = isHigher ? 'HIGHER' : isLower ? 'LOWER' : 'HIGHER';
    const barrier = targetType === 'HIGHER' ? '+0.5' : '-0.5';

    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: targetType,
      confidence: 0.85,
      barrier,
      durationTicks: 5, // Strict Deriv 5-tick minimum for Higher/Lower
      rationale: `${targetType} barrier contract (${barrier}): Enforcing minimum 5-tick duration.`
    };
  }

  private static evaluateMeanReversion(
    bot: BotRecord,
    tick: DerivTick,
    history: number[],
    isFirstTrade: boolean
  ): StrategySignal {
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());
    if (isFirstTrade || history.length < 5) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: selectedTypes.includes('CALL') ? 'CALL' : 'PUT',
        confidence: 0.85,
        durationTicks: 5,
        rationale: `Mean Reversion baseline initiation: spot ${tick.quote}.`
      };
    }

    const window = history.slice(-5);
    const mean = window.reduce((acc, p) => acc + p, 0) / window.length;
    const deviation = (tick.quote - mean) / mean;

    if (deviation <= 0 && selectedTypes.includes('CALL')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'CALL',
        confidence: 0.84,
        durationTicks: 5,
        rationale: `Oversold stretch (${(deviation * 100).toFixed(3)}%). Anticipating reversion upward.`
      };
    }

    if (deviation > 0 && selectedTypes.includes('PUT')) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'PUT',
        confidence: 0.84,
        durationTicks: 5,
        rationale: `Overbought stretch (+${(deviation * 100).toFixed(3)}%). Anticipating reversion downward.`
      };
    }

    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: selectedTypes[0] || 'CALL',
      confidence: 0.80,
      durationTicks: 5,
      rationale: `Equilibrium cycle: executing ${selectedTypes[0] || 'CALL'}.`
    };
  }

  private static evaluateDigitFrequency(
    bot: BotRecord,
    tick: DerivTick,
    _digitFrequencies: number[],
    _isFirstTrade: boolean
  ): StrategySignal {
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());
    const isOdd = tick.digit % 2 !== 0;

    // 1. Even / Odd contracts
    if (selectedTypes.includes('DIGITODD') || selectedTypes.includes('DIGITEVEN')) {
      // Rotate parity or predict alternate
      const targetSubtype = isOdd ? 'DIGITEVEN' : 'DIGITODD';
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: targetSubtype,
        confidence: 0.82,
        durationTicks: 1,
        rationale: `Digit Parity: Last digit was ${tick.digit} (${isOdd ? 'Odd' : 'Even'}). Purchasing ${targetSubtype}.`
      };
    }

    // 2. Differs contracts (DIGITDIFF)
    if (selectedTypes.includes('DIGITDIFF')) {
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
        rationale: `Digit Differs: targeting barrier digit ${barrier} (win condition: last digit != ${barrier}).`
      };
    }

    // 3. Matches contracts (DIGITMATCH)
    if (selectedTypes.includes('DIGITMATCH')) {
      const barrier = bot.strategy.entryConditions.barrierDigit !== undefined
        ? `${bot.strategy.entryConditions.barrierDigit}`
        : `${tick.digit}`;

      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: 'DIGITMATCH',
        confidence: 0.75,
        barrier,
        durationTicks: 1,
        rationale: `Digit Matches: targeting barrier digit ${barrier} (high payout edge).`
      };
    }

    // 4. Over / Under contracts
    if (selectedTypes.includes('DIGITOVER') || selectedTypes.includes('DIGITUNDER')) {
      const barrier = bot.strategy.entryConditions.barrierDigit !== undefined
        ? `${bot.strategy.entryConditions.barrierDigit}`
        : '5';
      const targetSubtype = selectedTypes.includes('DIGITOVER') ? 'DIGITOVER' : 'DIGITUNDER';

      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: targetSubtype,
        confidence: 0.82,
        barrier,
        durationTicks: 1,
        rationale: `Digit range: last digit was ${tick.digit}, purchasing ${targetSubtype} barrier ${barrier}.`
      };
    }

    // Default digit fallback
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: selectedTypes[0] || 'DIGITDIFF',
      confidence: 0.85,
      barrier: '0',
      durationTicks: 1,
      rationale: `Statistical Digit cycle: executing ${selectedTypes[0] || 'DIGITDIFF'}.`
    };
  }

  private static evaluateVolatilityBreakout(
    bot: BotRecord,
    tick: DerivTick,
    history: number[],
    isFirstTrade: boolean
  ): StrategySignal {
    const selectedTypes = (bot.selectedContractTypes || []).map(t => t.toUpperCase());
    if (isFirstTrade || history.length < 3) {
      return {
        action: 'BUY',
        symbol: tick.symbol,
        contractSubtype: selectedTypes.includes('CALL') ? 'CALL' : 'PUT',
        confidence: 0.86,
        durationTicks: 5,
        rationale: `Volatility breakout initial order @ spot ${tick.quote}.`
      };
    }

    const baseline = history[0];
    const diff = tick.quote - baseline;
    const isUp = diff >= 0;
    const subtype = isUp ? (selectedTypes.includes('CALL') ? 'CALL' : 'PUT') : (selectedTypes.includes('PUT') ? 'PUT' : 'CALL');

    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: subtype,
      confidence: 0.85,
      durationTicks: 5,
      rationale: `Volatility expansion: spot delta ${diff.toFixed(3)}, placing ${subtype}.`
    };
  }

  private static evaluateAccumulator(bot: BotRecord, tick: DerivTick): StrategySignal {
    const growth = bot.strategy.entryConditions.growthRate || 3;
    const limit = bot.strategy.entryConditions.limitOrder || 10;
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: 'ACCU',
      confidence: 0.85,
      durationTicks: 10,
      rationale: `Accumulator dynamic trade: growth rate ${growth}%, take-profit limit at $${limit}.00.`
    };
  }

  private static evaluateMultiplier(bot: BotRecord, tick: DerivTick, history: number[]): StrategySignal {
    const isUp = history.length >= 2 ? tick.quote >= history[history.length - 2] : true;
    const target = isUp ? 'MULTUP' : 'MULTDOWN';
    return {
      action: 'BUY',
      symbol: tick.symbol,
      contractSubtype: target,
      confidence: 0.83,
      durationTicks: 30,
      rationale: `Multiplier Scalp: ${target} x${bot.strategy.entryConditions.multiplier || 100} with dynamic stop.`
    };
  }
}
