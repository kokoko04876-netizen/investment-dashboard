// 所有金融指標的計算邏輯

function round(num, decimals) {
  if (num == null || isNaN(num) || !isFinite(num)) return null;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// 計算各時間區間的報酬率（1Y 為總報酬，其餘為年化）
export function calcReturns(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) {
    return { '1y': null, '3y': null, '5y': null, '10y': null };
  }

  const prices = priceHistory.map(p => p.price);
  const n = prices.length;
  const latest = prices[n - 1];

  // 從陣列末尾往前數 N 個月，若資料不足則取最早一筆
  const getPrice = (months) => prices[Math.max(0, n - 1 - months)];

  const annualized = (start, years) => {
    if (!start || start <= 0 || latest <= 0) return null;
    return round((Math.pow(latest / start, 1 / years) - 1) * 100, 1);
  };

  const p1y = getPrice(12);
  return {
    '1y':  p1y  > 0 ? round((latest / p1y  - 1) * 100, 1) : null,
    '3y':  annualized(getPrice(36),  3),
    '5y':  annualized(getPrice(60),  5),
    '10y': annualized(getPrice(120), 10),
  };
}

// 年化波動度：月報酬的標準差 × √12
export function calcVolatility(priceHistory) {
  if (!priceHistory || priceHistory.length < 3) return null;

  const prices = priceHistory.map(p => p.price);
  const monthlyReturns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      monthlyReturns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }
  if (monthlyReturns.length < 2) return null;

  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0)
    / (monthlyReturns.length - 1);
  return round(Math.sqrt(variance) * Math.sqrt(12) * 100, 1);
}

// 最大回撤：從歷史最高點到後續最低點的最大跌幅
export function calcMaxDrawdown(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;

  const prices = priceHistory.map(p => p.price);
  let peak = prices[0];
  let maxDrawdown = 0;

  for (const price of prices) {
    if (price > peak) peak = price;
    const drawdown = (price - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }
  return round(maxDrawdown * 100, 1);
}

// 夏普比率：(5年年化報酬 - 無風險利率) / 年化波動度
export function calcSharpe(ret5y, volatility, riskFreeRate = 2) {
  if (ret5y == null || !volatility || volatility === 0) return null;
  return round((ret5y - riskFreeRate) / volatility, 2);
}

// 彙整所有指標
export function calcAllMetrics(priceHistory) {
  const returns    = calcReturns(priceHistory);
  const volatility = calcVolatility(priceHistory);
  const maxDrawdown = calcMaxDrawdown(priceHistory);
  const sharpe     = calcSharpe(returns['5y'], volatility);
  return { returns, volatility, maxDrawdown, sharpe };
}
