// 每日排程 API：並行抓取所有標的並寫入 Upstash Redis

import { Redis } from '@upstash/redis';
import { ASSETS } from '../../lib/assets';
import { fetchYahoo, fetchCoinGecko } from '../../lib/fetchers';
import { calcAllMetrics } from '../../lib/calculations';

const redis = Redis.fromEnv();

// 告訴 Vercel 此函式最長可執行 60 秒
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 所有標的並行抓取，加快執行速度
  const settled = await Promise.allSettled(
    ASSETS.map(asset =>
      asset.source === 'yahoo'
        ? fetchYahoo(asset.id)
        : fetchCoinGecko(asset.id)
    )
  );

  const assetResults = settled.map((result, i) => {
    const asset = ASSETS[i];
    if (result.status === 'rejected') {
      console.error(`[refresh] ${asset.id} failed:`, result.reason?.message);
      return {
        id:       asset.id,
        name:     asset.name,
        category: asset.category,
        error:    result.reason?.message ?? 'Unknown error',
        returns:  { '1y': null, '3y': null, '5y': null, '10y': null },
        risk:     { volatility: null, maxDrawdown: null, sharpe: null },
        priceHistory: [],
      };
    }

    const priceHistory = result.value;
    const { returns, volatility, maxDrawdown, sharpe } = calcAllMetrics(priceHistory);
    return {
      id:       asset.id,
      name:     asset.name,
      category: asset.category,
      returns,
      risk: { volatility, maxDrawdown, sharpe },
      priceHistory: priceHistory.slice(-120),
    };
  });

  const successCount = assetResults.filter(a => !a.error).length;
  const errors = assetResults
    .filter(a => a.error)
    .map(a => ({ id: a.id, error: a.error }));

  const payload = {
    lastUpdate: new Date().toISOString(),
    assets: assetResults,
  };

  await redis.set('dashboard', payload, { ex: 7 * 24 * 60 * 60 });

  return res.status(200).json({
    success:   true,
    updated:   successCount,
    total:     ASSETS.length,
    timestamp: payload.lastUpdate,
    ...(errors.length > 0 && { errors }),
  });
}
