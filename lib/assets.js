// 11 個監控標的的清單
// 未來要新增/移除標的，只要改這個檔案

export const ASSETS = [
  // ===== 台股 =====
  { id: '2330.TW', name: '台積電',    category: 'tw',     source: 'yahoo' },
  { id: '2308.TW', name: '台達電',    category: 'tw',     source: 'yahoo' },
  { id: '2317.TW', name: '鴻海',      category: 'tw',     source: 'yahoo' },
  // ===== 指數 =====
  { id: '^TWII',   name: '加權指數',  category: 'index',  source: 'yahoo' },
  // ===== 美股 =====
  { id: 'NVDA',    name: 'NVIDIA',    category: 'us',     source: 'yahoo' },
  { id: 'MSFT',    name: 'Microsoft', category: 'us',     source: 'yahoo' },
  { id: 'AAPL',    name: 'Apple',     category: 'us',     source: 'yahoo' },
  { id: 'GOOG',    name: 'Alphabet',  category: 'us',     source: 'yahoo' },
  { id: '^GSPC',   name: 'S&P 500',   category: 'index',  source: 'yahoo' },
  // ===== 加密貨幣（使用 Binance API，免費無需 key）=====
  { id: 'BTCUSDT',  name: 'Bitcoin',  category: 'crypto', source: 'binance' },
  { id: 'ETHUSDT',  name: 'Ethereum', category: 'crypto', source: 'binance' },
];

export const CATEGORY_LABELS = {
  tw:     '台股',
  us:     '美股',
  index:  '指數',
  crypto: '加密貨幣',
};
