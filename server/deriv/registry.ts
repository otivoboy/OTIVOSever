import { MarketSymbolInfo, ContractSpecification } from '../types.js';

// The eight standard Volatility 1-second indices strictly specified by Deriv
export const STANDARD_8_VOLATILITY_1S_MARKETS: MarketSymbolInfo[] = [
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
    lastDigit: 5
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
    lastDigit: 5
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
    lastDigit: 0
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
    lastDigit: 2
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
    lastDigit: 1
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
    lastDigit: 4
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
    lastDigit: 9
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
    lastDigit: 8
  }
];

// Available symbols in Deriv catalogue for the 2 configurable slots
export const DERIV_CATALOGUE_OPTIONS: MarketSymbolInfo[] = [
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

// Complete Contract Registry covering all official Deriv Contract Families
export const CONTRACT_REGISTRY: ContractSpecification[] = [
  {
    contractType: 'RISE_FALL',
    name: 'Rise / Fall',
    family: 'RISE_FALL',
    subtypes: ['CALL', 'PUT'],
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V', 'R_100', 'R_50', '1HZ200V', '1HZ300V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR', 'GBP', 'AUD'],
    supportedDurations: [
      { unit: 't', min: 1, max: 10 },
      { unit: 's', min: 15, max: 86400 },
      { unit: 'm', min: 1, max: 1440 },
      { unit: 'h', min: 1, max: 24 }
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
    contractType: 'TOUCH_NO_TOUCH',
    name: 'Touch / No Touch',
    family: 'TOUCH_NO_TOUCH',
    subtypes: ['ONETOUCH', 'NOTOUCH'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 0.50,
    maxStake: 20000,
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 'm', min: 2, max: 1440 },
      { unit: 'h', min: 1, max: 24 }
    ],
    requiresBarrier: true,
    barrierType: 'offset',
    allowsEarlyClose: false
  },
  {
    contractType: 'ENDS_IN_OUT',
    name: 'Ends In / Ends Out',
    family: 'ENDS_IN_OUT',
    subtypes: ['EXPIRYMISS', 'EXPIRYRANGE'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 0.50,
    maxStake: 10000,
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 'm', min: 2, max: 1440 },
      { unit: 'd', min: 1, max: 365 }
    ],
    requiresBarrier: true,
    barrierType: 'offset',
    allowsEarlyClose: false
  },
  {
    contractType: 'STAYS_IN_GOES_OUT',
    name: 'Stays In / Goes Out',
    family: 'STAYS_IN_GOES_OUT',
    subtypes: ['RANGE', 'UPORDOWN'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 0.50,
    maxStake: 10000,
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
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
    supportedMarkets: ['1HZ10V', '1HZ15V', '1HZ25V', '1HZ30V', '1HZ50V', '1HZ75V', '1HZ90V', '1HZ100V', '1HZ200V', '1HZ300V'],
    minStake: 0.35,
    maxStake: 50000,
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 't', min: 1, max: 10 }
    ],
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
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 't', min: 1, max: 10 }
    ],
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
    currencies: ['USD', 'EUR', 'GBP'],
    supportedDurations: [
      { unit: 't', min: 1, max: 10 }
    ],
    requiresBarrier: true,
    barrierType: 'digit',
    allowsEarlyClose: false
  },
  {
    contractType: 'ACCUMULATORS',
    name: 'Accumulator Contracts',
    family: 'ACCUMULATORS',
    subtypes: ['ACCU'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 1.0,
    maxStake: 1000,
    currencies: ['USD'],
    supportedDurations: [
      { unit: 't', min: 1, max: 1000 }
    ],
    requiresBarrier: false,
    allowsEarlyClose: true
  },
  {
    contractType: 'MULTIPLIERS',
    name: 'Multiplier Contracts',
    family: 'MULTIPLIERS',
    subtypes: ['MULTUP', 'MULTDOWN'],
    supportedMarkets: ['1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'],
    minStake: 1.0,
    maxStake: 2000,
    currencies: ['USD', 'EUR'],
    supportedDurations: [
      { unit: 'm', min: 1, max: 1440 }
    ],
    requiresBarrier: false,
    allowsEarlyClose: true
  },
  {
    contractType: 'RESET_CALL_PUT',
    name: 'Reset Call / Put',
    family: 'RESET',
    subtypes: ['RESETCALL', 'RESETPUT'],
    supportedMarkets: ['1HZ10V', '1HZ50V', '1HZ100V'],
    minStake: 0.5,
    maxStake: 10000,
    currencies: ['USD'],
    supportedDurations: [
      { unit: 't', min: 5, max: 10 }
    ],
    requiresBarrier: false,
    allowsEarlyClose: false
  },
  {
    contractType: 'ASIAN',
    name: 'Asian Up / Down',
    family: 'ASIAN',
    subtypes: ['ASIANU', 'ASIAND'],
    supportedMarkets: ['1HZ10V', '1HZ50V', '1HZ100V'],
    minStake: 0.5,
    maxStake: 10000,
    currencies: ['USD'],
    supportedDurations: [
      { unit: 't', min: 5, max: 10 }
    ],
    requiresBarrier: false,
    allowsEarlyClose: false
  }
];

export function validateContractForMarket(
  contractType: string,
  symbol: string
): { valid: boolean; reason?: string; spec?: ContractSpecification } {
  const spec = CONTRACT_REGISTRY.find(
    c => c.contractType === contractType || c.subtypes.includes(contractType)
  );
  if (!spec) {
    return { valid: false, reason: `Unknown or unverified contract type: ${contractType}` };
  }
  if (!spec.supportedMarkets.includes(symbol)) {
    return {
      valid: false,
      reason: `Market ${symbol} is not eligible for contract ${spec.name}`
    };
  }
  return { valid: true, spec };
}
