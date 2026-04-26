// 資料抓取：直接呼叫 Yahoo Finance v8 API 和 CoinGecko

// 抓取 Yahoo Finance 月線歷史資料（直接 HTTP，不依賴第三方套件）
export async function fetchYahoo(symbol, years = 10) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=1mo&range=${years}y`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${symbol}`);

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${symbol}`);

  const timestamps = result.timestamp ?? [];
  // 優先使用調整後收盤價，否則用一般收盤價
  const prices =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close;

  if (!prices || prices.length === 0) throw new Error(`No prices for ${symbol}`);

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: prices[i],
    }))
    .filter(p => p.price != null && p.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 抓取 Binance 月 K 線（免費無需 API key）
// symbol 例如 BTCUSDT、ETHUSDT
export async function fetchBinance(symbol, years = 10) {
  const limit = Math.min(years * 12, 1000); // Binance 最多 1000 根 K 線
  const url =
    `https://api.binance.com/api/v3/klines` +
    `?symbol=${symbol}&interval=1M&limit=${limit}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`Binance HTTP ${res.status} for ${symbol}`);

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Empty kline data for ${symbol}`);
  }

  // Binance kline: [openTime, open, high, low, close, ...]
  return data
    .map(k => ({
      date:  new Date(k[0]).toISOString().split('T')[0],
      price: parseFloat(k[4]), // close price
    }))
    .filter(p => p.price > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}
