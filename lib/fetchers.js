// 資料抓取：Yahoo Finance（股票/ETF/指數）和 CoinGecko（加密貨幣）

import yahooFinance from 'yahoo-finance2';

// 抓取 Yahoo Finance 月線歷史資料
export async function fetchYahoo(symbol, years = 10) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  // yahoo-finance2 會在找不到代號時拋出錯誤
  const result = await yahooFinance.historical(symbol, {
    period1: startDate.toISOString().split('T')[0],
    period2: endDate.toISOString().split('T')[0],
    interval: '1mo',
  });

  if (!result || result.length === 0) {
    throw new Error(`No data returned for ${symbol}`);
  }

  return result
    .filter(item => (item.adjClose ?? item.close) != null)
    .map(item => ({
      date: (item.date instanceof Date ? item.date : new Date(item.date))
        .toISOString().split('T')[0],
      price: item.adjClose ?? item.close,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 抓取 CoinGecko 歷史價格，重採樣為每月第一筆
export async function fetchCoinGecko(coinId, years = 10) {
  const days = years * 365;
  const url =
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart` +
    `?vs_currency=usd&days=${days}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko error ${response.status} for ${coinId}`);
  }

  const data = await response.json();
  if (!data.prices?.length) throw new Error(`Empty price data for ${coinId}`);

  // 每個月只取第一筆（timestamp 為毫秒）
  const monthMap = new Map();
  for (const [ts, price] of data.prices) {
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { date: key + '-01', price });
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
