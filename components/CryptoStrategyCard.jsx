// Card displaying strategy metrics for a single crypto asset

import SignalBadge from './SignalBadge';

function MetricRow({ label, value, colorize = false, suffix = '' }) {
  if (value == null) {
    return (
      <div className="flex justify-between items-center py-1.5 border-b border-gray-800/60 last:border-0">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="text-gray-600 font-mono text-xs">N/A</span>
      </div>
    );
  }

  let color = 'text-gray-200';
  if (colorize) color = value >= 0 ? 'text-emerald-400' : 'text-red-400';

  const sign = colorize && value > 0 ? '+' : '';
  const decimals = Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2;

  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-mono text-xs ${color}`}>
        {sign}{Number(value).toFixed(decimals)}{suffix}
      </span>
    </div>
  );
}

function RSIBar({ rsi }) {
  if (rsi == null) return null;
  const pct = Math.min(100, Math.max(0, rsi));
  const barColor =
    rsi < 30 ? 'bg-emerald-500' :
    rsi < 45 ? 'bg-green-500' :
    rsi < 60 ? 'bg-yellow-500' :
    rsi < 75 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Oversold</span>
        <span className="text-gray-400 font-mono font-medium">RSI {rsi}</span>
        <span>Overbought</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 relative">
        {/* Zone markers */}
        <div className="absolute top-0 bottom-0 left-[30%] w-px bg-gray-600/60" />
        <div className="absolute top-0 bottom-0 left-[70%] w-px bg-gray-600/60" />
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CryptoStrategyCard({ asset }) {
  const { name, ticker, currentPrice, rsi, pctFromMA3, pctFromMA12,
          drawdown12m, return12m, signal, dcaMultiplier } = asset;

  const dcaLabel =
    signal.dcaMultiplier >= 2   ? '2× DCA (加倍投入)' :
    signal.dcaMultiplier >= 1.5 ? '1.5× DCA (加碼)' :
    signal.dcaMultiplier >= 1   ? '1× DCA (正常投入)' :
    signal.dcaMultiplier >= 0.5 ? '0.5× DCA (減碼)' :
    '暫停 DCA';

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-base">{name}</h3>
          <span className="text-gray-500 text-xs font-mono">{ticker}-USD</span>
        </div>
        <SignalBadge tier={signal.tier} label={signal.label} />
      </div>

      {/* Current price */}
      <div className="text-2xl font-mono font-bold text-white">
        {currentPrice != null
          ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '—'}
      </div>

      {/* RSI progress bar */}
      <RSIBar rsi={rsi} />

      {/* Metrics */}
      <div className="mt-1">
        <MetricRow label="vs 3-Month MA"  value={pctFromMA3}   colorize suffix="%" />
        <MetricRow label="vs 12-Month MA" value={pctFromMA12}  colorize suffix="%" />
        <MetricRow label="12M Return"     value={return12m}    colorize suffix="%" />
        <MetricRow label="12M Drawdown"   value={drawdown12m}  colorize suffix="%" />
      </div>

      {/* DCA recommendation */}
      <div className="mt-1 rounded-lg bg-gray-800/60 px-3 py-2 flex items-center justify-between">
        <span className="text-gray-400 text-xs">DCA 建議</span>
        <span className="text-gray-200 text-xs font-medium">{dcaLabel}</span>
      </div>

    </div>
  );
}
