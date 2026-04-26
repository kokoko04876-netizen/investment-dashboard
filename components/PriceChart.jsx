// 走勢圖：可切換查看任一標的的 10 年月線圖

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

function fmtDate(str) {
  // "2016-04-01" → "2016-04"
  return str ? str.slice(0, 7) : '';
}

function fmtPrice(v) {
  if (v == null) return '';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  if (v >= 1)         return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm shadow-lg">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-emerald-400 font-mono">{fmtPrice(payload[0].value)}</p>
    </div>
  );
}

export default function PriceChart({ assets }) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? '');
  const selected = assets.find(a => a.id === selectedId);

  const chartData = (selected?.priceHistory ?? []).map(p => ({
    date:  fmtDate(p.date),
    price: p.price,
  }));

  return (
    <div className="rounded-xl border border-gray-800 p-4">
      {/* 標的切換按鈕 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {assets.map(asset => (
          <button
            key={asset.id}
            onClick={() => setSelectedId(asset.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedId === asset.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {asset.name}
          </button>
        ))}
      </div>

      {/* 圖表標題 */}
      <div className="mb-3">
        <span className="text-gray-200 font-medium">{selected?.name}</span>
        <span className="ml-2 text-gray-500 text-sm">{selected?.id}</span>
        <span className="ml-2 text-gray-600 text-xs">10年月線</span>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={fmtPrice}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-600">
          此標的暫無走勢資料
        </div>
      )}
    </div>
  );
}
