// 提供前端 Dashboard 資料（從 Vercel KV 讀取）

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await kv.get('dashboard');

    if (!data) {
      return res.status(404).json({
        error: 'No data yet',
        hint: 'Please visit /api/refresh to trigger the first data fetch.',
      });
    }

    // 快取 5 分鐘，過期後在背景重新驗證
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[dashboard] KV read error:', err);
    return res.status(500).json({ error: 'Failed to read data from storage' });
  }
}
