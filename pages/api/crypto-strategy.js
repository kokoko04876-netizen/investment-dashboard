// Crypto Strategy API: fetches monthly price data and returns strategy signals

import { fetchYahoo } from '../../lib/fetchers';
import { computeStrategyMetrics } from '../../lib/cryptoStrategy';

const CRYPTO_ASSETS = [
  { id: 'BTC-USD', name: 'Bitcoin',  ticker: 'BTC' },
  { id: 'ETH-USD', name: 'Ethereum', ticker: 'ETH' },
  { id: 'SOL-USD', name: 'Solana',   ticker: 'SOL' },
  { id: 'BNB-USD', name: 'BNB',      ticker: 'BNB' },
];

async function fetchAsset(asset) {
  try {
    const history = await fetchYahoo(asset.id, 3); // 3 years of monthly data
    const metrics = computeStrategyMetrics(history);
    if (!metrics) throw new Error('insufficient data');
    return { ...asset, ...metrics, error: null };
  } catch (err) {
    return {
      ...asset,
      currentPrice: null,
      rsi: null,
      ma3: null,
      ma12: null,
      pctFromMA3: null,
      pctFromMA12: null,
      drawdown12m: null,
      return12m: null,
      signal: { label: 'N/A', tier: 'unknown', dcaMultiplier: 0 },
      error: err.message,
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = await Promise.all(CRYPTO_ASSETS.map(fetchAsset));

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
    return res.status(200).json({
      assets: results,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[crypto-strategy] error:', err);
    return res.status(500).json({ error: 'Failed to fetch strategy data' });
  }
}
