// 風險指標表：年化波動度、最大回撤、夏普比率

import { CATEGORY_LABELS } from '../lib/assets';

function NumCell({ value, suffix = '%', colorize = false }) {
  if (value == null) {
    return (
      <td className="px-3 py-2 text-center text-gray-600 font-mono text-sm">
        N/A
      </td>
    );
  }
  let color = 'text-gray-200';
  if (colorize) color = value >= 0 ? 'text-emerald-400' : 'text-red-400';

  const decimals = suffix === '' ? 2 : 1;
  return (
    <td className={`px-3 py-2 text-center font-mono text-sm ${color}`}>
      {colorize && value >= 0 ? '+' : ''}{value.toFixed(decimals)}{suffix}
    </td>
  );
}

export default function RiskTable({ assets }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/50">
            <th className="px-3 py-3 text-left text-gray-400 font-medium whitespace-nowrap">類別</th>
            <th className="px-3 py-3 text-left text-gray-400 font-medium whitespace-nowrap">標的</th>
            <th className="px-3 py-3 text-center text-gray-400 font-medium whitespace-nowrap">年化波動度</th>
            <th className="px-3 py-3 text-center text-gray-400 font-medium whitespace-nowrap">最大回撤</th>
            <th className="px-3 py-3 text-center text-gray-400 font-medium whitespace-nowrap">夏普比率(5Y)</th>
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
              <td className="px-3 py-2 text-gray-200 font-medium whitespace-nowrap">
                {asset.name}
              </td>
              {/* 波動度：數值越低越好，但不標色（中性指標） */}
              <NumCell value={asset.risk?.volatility} suffix="%" />
              {/* 最大回撤：負值為紅，越靠近 0 越好 */}
              <NumCell value={asset.risk?.maxDrawdown} suffix="%" colorize />
              {/* 夏普比率：正值為綠，越高越好 */}
              <NumCell value={asset.risk?.sharpe} suffix="" colorize />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
