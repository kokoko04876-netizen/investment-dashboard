// Crypto strategy calculation: RSI, moving averages, DCA signals

function round(num, decimals) {
  if (num == null || isNaN(num) || !isFinite(num)) return null;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Wilder's RSI using 14-period smoothed averages
export function calcRSI(prices, period = 14) {
  if (!prices || prices.length < period + 2) return null;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, diff)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return round(100 - 100 / (1 + rs), 1);
}

// Simple moving average over last N entries
export function calcMA(prices, period) {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Percentage distance of current price from a moving average
export function pctFromMA(currentPrice, ma) {
  if (!ma || ma === 0) return null;
  return round(((currentPrice - ma) / ma) * 100, 1);
}

// Determine overall strategy signal from RSI + MA position
export function getSignal(rsi, pctFromMA12) {
  let score = 0;

  if (rsi !== null) {
    if (rsi < 30) score += 2;
    else if (rsi < 42) score += 1;
    else if (rsi > 72) score -= 2;
    else if (rsi > 60) score -= 1;
  }

  if (pctFromMA12 !== null) {
    if (pctFromMA12 < -15) score += 1;
    else if (pctFromMA12 < -5) score += 0.5;
    else if (pctFromMA12 > 40) score -= 1;
    else if (pctFromMA12 > 20) score -= 0.5;
  }

  if (score >= 2.5) return { label: 'Strong Buy', tier: 'strong-buy', dcaMultiplier: 2.0 };
  if (score >= 1)   return { label: 'Buy',         tier: 'buy',        dcaMultiplier: 1.5 };
  if (score >= -0.5) return { label: 'Hold',        tier: 'hold',       dcaMultiplier: 1.0 };
  if (score >= -1.5) return { label: 'Reduce',      tier: 'reduce',     dcaMultiplier: 0.5 };
  return               { label: 'Caution',      tier: 'caution',    dcaMultiplier: 0.0 };
}

// Compute 12-month drawdown (peak-to-trough in most recent 12 months)
export function calcRecentDrawdown(prices) {
  if (!prices || prices.length < 2) return null;
  const recent = prices.slice(-12);
  let peak = recent[0];
  let maxDD = 0;
  for (const p of recent) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return round(maxDD * 100, 1);
}

// Full metrics for one asset given monthly price history
export function computeStrategyMetrics(priceHistory) {
  if (!priceHistory || priceHistory.length < 16) return null;

  const prices = priceHistory.map(h => h.price);
  const currentPrice = prices[prices.length - 1];

  const rsi     = calcRSI(prices);
  const ma3     = calcMA(prices, 3);
  const ma12    = calcMA(prices, 12);
  const pctMA3  = pctFromMA(currentPrice, ma3);
  const pctMA12 = pctFromMA(currentPrice, ma12);
  const drawdown = calcRecentDrawdown(prices);
  const signal  = getSignal(rsi, pctMA12);

  // 12-month return
  const price12mAgo = prices.length >= 13 ? prices[prices.length - 13] : null;
  const return12m = price12mAgo && price12mAgo > 0
    ? round((currentPrice / price12mAgo - 1) * 100, 1)
    : null;

  return {
    currentPrice: round(currentPrice, 2),
    rsi,
    ma3:   round(ma3, 2),
    ma12:  round(ma12, 2),
    pctFromMA3:  pctMA3,
    pctFromMA12: pctMA12,
    drawdown12m: drawdown,
    return12m,
    signal,
  };
}
