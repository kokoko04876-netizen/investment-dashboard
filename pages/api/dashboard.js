// 提供前端 Dashboard 資料（從 Upstash Redis 讀取）

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await redis.get('dashboard');

    if (!data) {
      return res.status(404).json({
        error: 'No data yet',
        hint: 'Please visit /api/refresh to trigger the first data fetch.',
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[dashboard] Redis read error:', err);
    return res.status(500).json({ error: 'Failed to read data from storage' });
  }
}
