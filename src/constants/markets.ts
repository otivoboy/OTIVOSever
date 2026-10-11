import { MarketSymbolInfo, ContractSpecification } from '../types/index.js';

export const DEFAULT_STANDARD_8_MARKETS: MarketSymbolInfo[] = [
  {
    symbol: '1HZ10V',
    displayName: 'Volatility 10 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 3,
    isOpen: true,
    currentPrice: 2410.825,
    lastDigit: 5,
    priceHistory: [2410.5, 2410.7, 2410.6, 2410.8, 2410.825],
    digitFrequency: [3, 4, 6, 5, 5, 8, 4, 5, 6, 4]
  },
  {
    symbol: '1HZ15V',
    displayName: 'Volatility 15 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 893.2045,
    lastDigit: 5,
    priceHistory: [893.1, 893.15, 893.18, 893.2, 893.2045],
    digitFrequency: [4, 5, 3, 6, 4, 7, 5, 4, 6, 6]
  },
  {
    symbol: '1HZ25V',
    displayName: 'Volatility 25 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 3,
    isOpen: true,
    currentPrice: 1542.190,
    lastDigit: 0,
    priceHistory: [1542.0, 1542.1, 1542.15, 1542.18, 1542.19],
    digitFrequency: [7, 5, 4, 5, 5, 4, 6, 5, 5, 4]
  },
  {
    symbol: '1HZ30V',
    displayName: 'Volatility 30 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 720.5412,
    lastDigit: 2,
    priceHistory: [720.45, 720.5, 720.52, 720.53, 720.5412],
    digitFrequency: [4, 4, 8, 5, 6, 4, 5, 5, 4, 5]
  },
  {
    symbol: '1HZ50V',
    displayName: 'Volatility 50 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 412.3851,
    lastDigit: 1,
    priceHistory: [412.3, 412.32, 412.35, 412.37, 412.3851],
    digitFrequency: [5, 9, 4, 5, 4, 6, 5, 4, 4, 4]
  },
  {
    symbol: '1HZ75V',
    displayName: 'Volatility 75 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 3840.1194,
    lastDigit: 4,
    priceHistory: [3839.8, 3839.9, 3840.0, 3840.05, 3840.1194],
    digitFrequency: [4, 5, 5, 4, 8, 5, 5, 6, 4, 4]
  },
  {
    symbol: '1HZ90V',
    displayName: 'Volatility 90 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 1085.6729,
    lastDigit: 9,
    priceHistory: [1085.4, 1085.5, 1085.6, 1085.65, 1085.6729],
    digitFrequency: [4, 4, 5, 5, 5, 5, 4, 5, 5, 8]
  },
  {
    symbol: '1HZ100V',
    displayName: 'Volatility 100 (1s) Index',
    marketGroup: 'Synthetic Indices - 1s Volatility',
    is1sVolatility: true,
    isStandard8: true,
    isConfigurableSlot: false,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 2,
    isOpen: true,
    currentPrice: 5930.48,
    lastDigit: 8,
    priceHistory: [5929.5, 5929.8, 5930.1, 5930.3, 5930.48],
    digitFrequency: [5, 4, 5, 6, 4, 5, 5, 4, 9, 3]
  }
];

export const DEFAULT_CATALOGUE_OPTIONS: MarketSymbolInfo[] = [
  {
    symbol: 'R_100',
    displayName: 'Volatility 100 Index (Standard 2s)',
    marketGroup: 'Continuous Indices',
    is1sVolatility: false,
    isStandard8: false,
    isConfigurableSlot: true,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 2,
    isOpen: true,
    currentPrice: 2194.20,
    lastDigit: 0
  },
  {
    symbol: 'R_50',
    displayName: 'Volatility 50 Index (Standard 2s)',
    marketGroup: 'Continuous Indices',
    is1sVolatility: false,
    isStandard8: false,
    isConfigurableSlot: true,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 4,
    isOpen: true,
    currentPrice: 249.1240,
    lastDigit: 0
  },
  {
    symbol: '1HZ200V',
    displayName: 'Volatility 200 (1s) Index',
    marketGroup: 'High Volatility 1s',
    is1sVolatility: true,
    isStandard8: false,
    isConfigurableSlot: true,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 2,
    isOpen: true,
    currentPrice: 8421.15,
    lastDigit: 5
  },
  {
    symbol: '1HZ300V',
    displayName: 'Volatility 300 (1s) Index',
    marketGroup: 'High Volatility 1s',
    is1sVolatility: true,
    isStandard8: false,
    isConfigurableSlot: true,
    minDurationTicks: 1,
    maxDurationTicks: 10,
    pipSize: 2,
    isOpen: true,
    currentPrice: 12930.50,
    lastDigit: 0
  }
];

export const DEFAULT_CONTRACTS: ContractSpecification[] = [
  {
    contractType: 'RISE_FALL',
    name: 'Rise / Fall',
    family: 'RISE_FALL',
    subtypes: ['CALL', 'PUT', 'RISE', 'FALL', 'CALLE', 'PUTE', 'RISEE', 'FALLE'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V', 'R_100', 'R_50', '1HZ200V', '1HZ300V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR', 'GBP', 'AUD'],
    supportedDurations: [
      { unit: 't', min: 1, max: 10 },
      { unit: 's', min: 15, max: 86400 }
    ],
    requiresBarrier: false,
    allowsEarlyClose: false
  },
  {
    contractType: 'HIGHER_LOWER',
    name: 'Higher / Lower',
    family: 'HIGHER_LOWER',
    subtypes: ['HIGHER', 'LOWER'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V', 'R_100', 'R_50'],
    minStake: 0.50,
    maxStake: 20000,
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 't', min: 5, max: 10 },
      { unit: 'm', min: 2, max: 1440 }
    ],
    requiresBarrier: true,
    barrierType: 'offset',
    allowsEarlyClose: false
  },
  {
    contractType: 'DIGITS_MATCH_DIFF',
    name: 'Digits Matches / Differs',
    family: 'DIGITS',
    subtypes: ['DIGITMATCH', 'DIGITDIFF'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR'],
    supportedDurations: [{ unit: 't', min: 1, max: 10 }],
    requiresBarrier: true,
    barrierType: 'digit',
    allowsEarlyClose: false
  },
  {
    contractType: 'DIGITS_EVEN_ODD',
    name: 'Digits Even / Odd',
    family: 'DIGITS',
    subtypes: ['DIGITEVEN', 'DIGITODD'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR'],
    supportedDurations: [{ unit: 't', min: 1, max: 10 }],
    requiresBarrier: false,
    allowsEarlyClose: false
  },
  {
    contractType: 'DIGITS_OVER_UNDER',
    name: 'Digits Over / Under',
    family: 'DIGITS',
    subtypes: ['DIGITOVER', 'DIGITUNDER'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR'],
    supportedDurations: [{ unit: 't', min: 1, max: 10 }],
    requiresBarrier: true,
    barrierType: 'digit',
    allowsEarlyClose: false
  },
  {
    contractType: 'ACCUMULATORS',
    name: 'Accumulator Contracts',
    family: 'ACCUMULATORS',
    subtypes: ['ACCU', 'ACCUM'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 1.0,
    maxStake: 1000,
    currencies: ['USD'],
    supportedDurations: [{ unit: 't', min: 1, max: 1000 }],
    requiresBarrier: false,
    allowsEarlyClose: true
  },
  {
    contractType: 'TURBOS',
    name: 'Turbo Contracts',
    family: 'TURBOS',
    subtypes: ['TURBOSLONG', 'TURBOSSHORT'],
    supportedMarkets: ['1HZ10V', '1HZ50V', '1HZ100V'],
    minStake: 1.0,
    maxStake: 2000,
    currencies: ['USD'],
    supportedDurations: [{ unit: 'm', min: 1, max: 1440 }],
    requiresBarrier: true,
    allowsEarlyClose: true
  },
  {
    contractType: 'VANILLAS',
    name: 'Vanilla Options',
    family: 'VANILLAS',
    subtypes: ['VANILLALONGCALL', 'VANILLALONGPUT'],
    supportedMarkets: ['1HZ10V', '1HZ50V', '1HZ100V'],
    minStake: 1.0,
    maxStake: 2000,
    currencies: ['USD'],
    supportedDurations: [{ unit: 's', min: 60, max: 86400 }],
    requiresBarrier: true,
    allowsEarlyClose: true
  },
  {
    contractType: 'TOUCH_NO_TOUCH',
    name: 'Touch / No Touch',
    family: 'TOUCH_NO_TOUCH',
    subtypes: ['ONETOUCH', 'NOTOUCH'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 0.50,
    maxStake: 20000,
    currencies: ['USD'],
    supportedDurations: [{ unit: 'm', min: 2, max: 1440 }],
    requiresBarrier: true,
    allowsEarlyClose: false
  },
  {
    contractType: 'RUN_HIGH_LOW',
    name: 'Run High / Low',
    family: 'RUN_HIGH_LOW',
    subtypes: ['RUNHIGH', 'RUNLOW'],
    supportedMarkets: ['1HZ10V', '1HZ50V', '1HZ100V'],
    minStake: 0.5,
    maxStake: 5000,
    currencies: ['USD'],
    supportedDurations: [{ unit: 't', min: 5, max: 10 }],
    requiresBarrier: false,
    allowsEarlyClose: false
  }
];

export interface PurchaseRequestPayload {
  contract_type: string;
  amount: number;
  basis: 'stake';
  currency: string;
  underlying_symbol: string;
  duration?: number;
  duration_unit?: string;
  barrier?: string;
  growth_rate?: number;
  limit_order?: {
    take_profit?: number;
    stop_loss?: number;
  };
}

export function preparePurchaseRequest(params: {
  contractType: string;
  symbol: string;
  amount: number;
  currency?: string;
  duration?: number;
  durationUnit?: string;
  barrier?: string;
  barrierDigit?: number;
  barrierType?: 'offset_plus' | 'offset_minus' | 'offset' | 'digit';
  growthRate?: number;
  takeProfit?: number;
  prediction?: number;
}): PurchaseRequestPayload {
  const rawType = (params.contractType || 'CALL').toUpperCase();
  const currency = params.currency || 'USD';
  const symbol = params.symbol || '1HZ50V';
  const amount = Math.max(0.35, Math.round(params.amount * 100) / 100);

  // 1. Rise / Fall (CALL, PUT, RISE, FALL, CALLE, PUTE, RISEE, FALLE)
  if (['CALL', 'PUT', 'RISE', 'FALL', 'CALLE', 'PUTE', 'RISEE', 'FALLE'].includes(rawType)) {
    const normalizedType = rawType === 'RISE' ? 'CALL' : rawType === 'FALL' ? 'PUT' : rawType === 'RISEE' ? 'CALLE' : rawType === 'FALLE' ? 'PUTE' : rawType;
    return {
      contract_type: normalizedType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      duration: Math.max(1, params.duration || 1),
      duration_unit: params.durationUnit || 't'
    };
  }

  // 2. Higher / Lower (HIGHER, LOWER)
  if (['HIGHER', 'LOWER'].includes(rawType)) {
    const normalizedType = rawType === 'HIGHER' ? 'CALL' : 'PUT';
    let barrier = params.barrier || (rawType === 'HIGHER' ? '+0.5' : '-0.5');

    // Barrier construction logic:
    // If barrierType is set to 'offset_plus', append + if not present
    if (params.barrierType === 'offset_plus' && !barrier.startsWith('+')) {
      barrier = `+${barrier.replace(/^[+-]/, '')}`;
    } else if (params.barrierType === 'offset_minus' && !barrier.startsWith('-')) {
      barrier = `-${barrier.replace(/^[+-]/, '')}`;
    } else if (!barrier.startsWith('+') && !barrier.startsWith('-')) {
      barrier = rawType === 'HIGHER' ? `+${barrier}` : `-${barrier}`;
    }

    return {
      contract_type: normalizedType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      duration: Math.max(5, params.duration || 5), // Enforce 5-tick minimum duration for Higher/Lower
      duration_unit: params.durationUnit || 't',
      barrier
    };
  }

  // 3. Digit Contracts (DIGITOVER, DIGITUNDER, DIGITMATCH, DIGITDIFF, DIGITEVEN, DIGITODD)
  if (['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITEVEN', 'DIGITODD'].includes(rawType)) {
    let barrier: string | undefined;
    if (rawType === 'DIGITOVER') {
      barrier = params.prediction !== undefined ? `${params.prediction}` : (params.barrier || '1');
    } else if (rawType === 'DIGITUNDER') {
      barrier = params.prediction !== undefined ? `${params.prediction}` : (params.barrier || '8');
    } else if (rawType === 'DIGITMATCH' || rawType === 'DIGITDIFF') {
      barrier = params.prediction !== undefined
        ? `${params.prediction}`
        : params.barrierDigit !== undefined
        ? `${params.barrierDigit}`
        : (params.barrier || (rawType === 'DIGITDIFF' ? '9' : '0'));
    }
    // Note: DIGITEVEN / DIGITODD do not require barrier

    const payload: PurchaseRequestPayload = {
      contract_type: rawType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      duration: 1,
      duration_unit: 't'
    };
    if (barrier !== undefined) {
      payload.barrier = barrier;
    }
    return payload;
  }

  // 4. Accumulator Contracts (ACCU / ACCUM)
  if (rawType === 'ACCU' || rawType === 'ACCUM') {
    const rawGrowth = params.growthRate || 0.03;
    const growthRate = rawGrowth > 1 ? rawGrowth / 100 : rawGrowth;
    const takeProfit = params.takeProfit || 5.00;
    return {
      contract_type: 'ACCU',
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      growth_rate: growthRate,
      limit_order: {
        take_profit: takeProfit
      }
    };
  }

  // 5. Turbos (TURBOSLONG / TURBOSSHORT)
  if (rawType.startsWith('TURBOS')) {
    return {
      contract_type: rawType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      barrier: params.barrier || '+0.00',
      limit_order: {
        take_profit: params.takeProfit || 5.00
      }
    };
  }

  // 6. Vanillas (VANILLALONGCALL / VANILLALONGPUT)
  if (rawType.startsWith('VANILLA')) {
    return {
      contract_type: rawType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      barrier: params.barrier || '+0.00',
      duration: params.duration || 60,
      duration_unit: params.durationUnit || 's'
    };
  }

  // 7. Touch / No Touch (ONETOUCH / NOTOUCH)
  if (rawType === 'ONETOUCH' || rawType === 'NOTOUCH') {
    return {
      contract_type: rawType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      barrier: params.barrier || '+1.37',
      duration: params.duration || 2,
      duration_unit: params.durationUnit || 'm'
    };
  }

  // 8. Run High / Low (RUNHIGH / RUNLOW)
  if (rawType === 'RUNHIGH' || rawType === 'RUNLOW') {
    return {
      contract_type: rawType,
      amount,
      basis: 'stake',
      currency,
      underlying_symbol: symbol,
      duration: Math.max(5, params.duration || 5),
      duration_unit: params.durationUnit || 't'
    };
  }

  // Default fallback (Rise/Fall)
  return {
    contract_type: rawType,
    amount,
    basis: 'stake',
    currency,
    underlying_symbol: symbol,
    duration: params.duration || 1,
    duration_unit: params.durationUnit || 't'
  };
}
