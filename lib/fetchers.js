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

// 抓取 CoinGecko 歷史價格，重採樣為每月第一筆
export async function fetchCoinGecko(coinId, years = 10) {
  const days = years * 365;
  const url =
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart` +
    `?vs_currency=usd&days=${days}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status} for ${coinId}`);

  const data = await res.json();
  if (!data.prices?.length) throw new Error(`Empty price data for ${coinId}`);

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
