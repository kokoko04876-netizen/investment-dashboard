// 每日排程 API：抓取所有標的資料並寫入 Upstash Redis
// Vercel Cron 每日 UTC 00:00（台灣時間 08:00）以 GET 呼叫此路由

import { Redis } from '@upstash/redis';
import { ASSETS } from '../../lib/assets';
import { fetchYahoo, fetchCoinGecko } from '../../lib/fetchers';
import { calcAllMetrics } from '../../lib/calculations';

// Redis.fromEnv() 自動讀取 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // 允許 GET（Vercel Cron 預設）和 POST（手動測試）
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = [];
  let successCount = 0;

  for (const asset of ASSETS) {
    try {
      const priceHistory =
        asset.source === 'yahoo'
          ? await fetchYahoo(asset.id)
          : await fetchCoinGecko(asset.id);

      const { returns, volatility, maxDrawdown, sharpe } = calcAllMetrics(priceHistory);

      results.push({
        id:       asset.id,
        name:     asset.name,
        category: asset.category,
        returns,
        risk: { volatility, maxDrawdown, sharpe },
        priceHistory: priceHistory.slice(-120),
      });
      successCount++;
    } catch (err) {
      console.error(`[refresh] ${asset.id} failed:`, err.message);
      results.push({
        id:       asset.id,
        name:     asset.name,
        category: asset.category,
        error:    err.message,
        returns:  { '1y': null, '3y': null, '5y': null, '10y': null },
        risk:     { volatility: null, maxDrawdown: null, sharpe: null },
        priceHistory: [],
      });
    }

    // 每筆請求間停頓 600ms，避免觸發 rate limit
    await new Promise(r => setTimeout(r, 600));
  }

  const payload = {
    lastUpdate: new Date().toISOString(),
    assets: results,
  };

  // 存入 Redis，TTL 7 天
  await redis.set('dashboard', payload, { ex: 7 * 24 * 60 * 60 });

  return res.status(200).json({
    success:   true,
    updated:   successCount,
    total:     ASSETS.length,
    timestamp: payload.lastUpdate,
  });
}
