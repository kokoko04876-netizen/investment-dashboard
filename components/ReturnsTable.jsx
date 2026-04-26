// 報酬率比較表：11 個標的 × 4 個時間區間

import { CATEGORY_LABELS } from '../lib/assets';

const PERIODS = [
  { key: '1y',  label: '1年' },
  { key: '3y',  label: '3年(年化)' },
  { key: '5y',  label: '5年(年化)' },
  { key: '10y', label: '10年(年化)' },
];

function ReturnCell({ value }) {
  if (value == null) {
    return (
      <td className="px-3 py-2 text-center text-gray-600 font-mono text-sm">
        N/A
      </td>
    );
  }
  const color = value >= 0 ? 'text-emerald-400' : 'text-red-400';
  return (
    <td className={`px-3 py-2 text-center font-mono text-sm ${color}`}>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </td>
  );
}

export default function ReturnsTable({ assets }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm min-w-[540px]">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/50">
            <th className="px-3 py-3 text-left text-gray-400 font-medium whitespace-nowrap">類別</th>
            <th className="px-3 py-3 text-left text-gray-400 font-medium whitespace-nowrap">標的</th>
            {PERIODS.map(p => (
              <th key={p.key} className="px-3 py-3 text-center text-gray-400 font-medium whitespace-nowrap">
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, i) => (
            <tr
              key={asset.id}
              className={`border-b border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
            >
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                {CATEGORY_LABELS[asset.category] ?? asset.category}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="text-gray-200 font-medium">{asset.name}</span>
                <span className="ml-2 text-xs text-gray-600">{asset.id}</span>
              </td>
              {PERIODS.map(p => (
                <ReturnCell key={p.key} value={asset.returns?.[p.key]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
