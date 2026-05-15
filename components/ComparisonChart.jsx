// 投資標的比較圖表元件（太空銀河風 · 1Y/3Y/5Y/10Y）
// 可獨立使用，或由 pages/index.js 傳入真實 data prop

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ── 標的設定 ─────────────────────────────────────────────────────
const ASSET_CONFIG = {
  '2330.TW': { name: '台積電',    color: '#ef4444', category: 'tw' },
  '2308.TW': { name: '台達電',    color: '#f97316', category: 'tw' },
  '2317.TW': { name: '鴻海',      color: '#eab308', category: 'tw' },
  '^TWII':   { name: '加權指數',  color: '#a855f7', category: 'index' },
  'NVDA':    { name: 'NVIDIA',    color: '#22c55e', category: 'us' },
  'MSFT':    { name: 'Microsoft', color: '#06b6d4', category: 'us' },
  'AAPL':    { name: 'Apple',     color: '#e5e7eb', category: 'us' },
  'GOOG':    { name: 'Alphabet',  color: '#3b82f6', category: 'us' },
  '^GSPC':   { name: 'S&P 500',  color: '#ec4899', category: 'index' },
  'BTC-USD': { name: 'Bitcoin',   color: '#f7931a', category: 'crypto' },
  'ETH-USD': { name: 'Ethereum',  color: '#627eea', category: 'crypto' },
};

const CATEGORIES = {
  tw:     { label: '台股',     ids: ['2330.TW', '2308.TW', '2317.TW'] },
  index:  { label: '指數',     ids: ['^TWII', '^GSPC'] },
  us:     { label: '美股',     ids: ['NVDA', 'MSFT', 'AAPL', 'GOOG'] },
  crypto: { label: '加密貨幣', ids: ['BTC-USD', 'ETH-USD'] },
};

const RANGES = ['1Y', '3Y', '5Y', '10Y'];
const RANGE_DAYS   = { '1Y': 365, '3Y': 1095, '5Y': 1825, '10Y': 3650 };
const RANGE_LABELS = { '1Y': '近 1 年', '3Y': '近 3 年', '5Y': '近 5 年', '10Y': '近 10 年' };

// ── Mock data（備用，每個標的不同趨勢）───────────────────────────
function generateMock(idx) {
  const drifts  = [0.010, 0.005, 0.004, 0.003, 0.018, 0.008, 0.007, 0.007, 0.006, 0.022, 0.015];
  const drift   = drifts[idx % drifts.length];
  const pts     = [];
  let   price   = 50 + idx * 25;
  const now     = new Date();
  const start   = new Date(now);
  start.setFullYear(start.getFullYear() - 10);
  start.setDate(1);
  let d = new Date(start);
  while (d <= now) {
    price *= 1 + drift + (Math.random() - 0.5) * 0.09;
    if (price < 1) price = 1;
    pts.push({ date: d.toISOString().split('T')[0], price });
    const nx = new Date(d);
    nx.setMonth(nx.getMonth() + 1);
    d = nx;
  }
  return pts;
}

// ── Helpers ──────────────────────────────────────────────────────
function round(n, d) {
  if (n == null || isNaN(n) || !isFinite(n)) return null;
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

function sliceByRange(history, range) {
  const days   = RANGE_DAYS[range];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const sliced = history.filter(p => new Date(p.date) >= cutoff);
  return sliced.length >= 2 ? sliced : history.slice(-24);
}

function calcMetrics(sliced, riskFreeRate) {
  if (!sliced || sliced.length < 2) return null;
  const base = sliced[0].price;
  const last = sliced[sliced.length - 1].price;

  // 累積報酬率序列
  const series = sliced.map(p => ({
    date: p.date,
    r: round((p.price / base - 1) * 100, 2),
  }));
  const rets  = series.map(s => s.r);
  const maxR  = Math.max(...rets);
  const minR  = Math.min(...rets);
  const finalR = rets[rets.length - 1];

  // 年化報酬率（以實際天數計算）
  const ms          = new Date(sliced[sliced.length - 1].date) - new Date(sliced[0].date);
  const actualDays  = ms / 86400000 || 1;
  const annualized  = (Math.pow(last / base, 365 / actualDays) - 1) * 100;

  // 月線對數報酬 → 年化波動度（×√12）
  const logR = [];
  for (let i = 1; i < sliced.length; i++) {
    if (sliced[i - 1].price > 0 && sliced[i].price > 0)
      logR.push(Math.log(sliced[i].price / sliced[i - 1].price));
  }
  let vol = 0;
  if (logR.length > 1) {
    const mean     = logR.reduce((a, b) => a + b, 0) / logR.length;
    const variance = logR.reduce((a, b) => a + (b - mean) ** 2, 0) / logR.length;
    vol = Math.sqrt(variance) * Math.sqrt(12) * 100;
  }

  // 最大回撤
  let peak = sliced[0].price, maxDD = 0;
  for (const p of sliced) {
    if (p.price > peak) peak = p.price;
    const dd = (p.price - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  const sharpe = vol > 0 ? (annualized - riskFreeRate) / vol : 0;

  return {
    series,
    maxReturn:    round(maxR, 1),
    minReturn:    round(minR, 1),
    finalReturn:  round(finalR, 1),
    annualized:   round(annualized, 1),
    volatility:   round(vol, 1),
    maxDrawdown:  round(maxDD * 100, 1),
    sharpe:       round(sharpe, 2),
    startDate:    sliced[0].date,
  };
}

function fmtDate(dateStr, range) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (range === '10Y') return `${d.getFullYear()}`;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Stars 背景 ────────────────────────────────────────────────────
function Stars() {
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: (i * 17.3 + 7.1) % 100,
      y: (i * 23.7 + 13.3) % 100,
      size: 0.5 + (i % 5) * 0.4,
      opacity: 0.2 + (i % 7) * 0.1,
    }))
  , []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left:   `${s.x}%`,
          top:    `${s.y}%`,
          width:  `${s.size}px`,
          height: `${s.size}px`,
          borderRadius: '50%',
          background: 'white',
          opacity: s.opacity,
          boxShadow: `0 0 ${s.size * 3}px rgba(255,255,255,0.8)`,
        }} />
      ))}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(2,6,23,0.94)',
      border: '1px solid rgba(148,163,184,0.25)',
      borderRadius: 8,
      padding: '10px 14px',
      backdropFilter: 'blur(12px)',
      minWidth: 160,
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{fmtDate(label, range)}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color, fontSize: 12 }}>{ASSET_CONFIG[p.dataKey]?.name ?? p.dataKey}</span>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 13,
            color: (p.value ?? 0) >= 0 ? '#fbbf24' : '#f87171',
          }}>
            {(p.value ?? 0) >= 0 ? '+' : ''}{(p.value ?? 0).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 指標格子 ─────────────────────────────────────────────────────
function StatItem({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ color: color ?? '#e5e7eb', fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>
        {value ?? 'N/A'}
      </div>
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────────────
export default function ComparisonChart({
  data           = {},
  defaultSelected = ['NVDA', 'BTC-USD'],
  defaultRange    = '5Y',
  riskFreeRate    = 2,
}) {
  const [selected, setSelected] = useState(defaultSelected);
  const [range,    setRange]    = useState(defaultRange);

  // 合併真實資料 + mock（真實優先）
  const allData = useMemo(() => {
    const KEYS = Object.keys(ASSET_CONFIG);
    const result = {};
    KEYS.forEach((id, idx) => {
      result[id] = (data[id] && data[id].length > 5) ? data[id] : generateMock(idx);
    });
    return result;
  }, [data]);

  // 每個選中標的的切片 + 指標
  const metricsMap = useMemo(() => {
    const map = {};
    for (const id of selected) {
      const history = allData[id] ?? [];
      const sliced  = sliceByRange(history, range);
      map[id] = { sliced, metrics: calcMetrics(sliced, riskFreeRate) };
    }
    return map;
  }, [selected, range, allData, riskFreeRate]);

  // 合併成圖表資料（以日期為 key）
  const chartData = useMemo(() => {
    const dateMap = {};
    for (const id of selected) {
      const series = metricsMap[id]?.metrics?.series ?? [];
      for (const pt of series) {
        if (!dateMap[pt.date]) dateMap[pt.date] = { date: pt.date };
        dateMap[pt.date][id] = pt.r;
      }
    }
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [metricsMap, selected]);

  const rangeStartDate = metricsMap[selected[0]]?.sliced?.[0]?.date ?? '';
  const today          = new Date().toISOString().split('T')[0];

  // 最佳 / 最弱（用於總結）
  const summary = useMemo(() => {
    let best = null, worst = null;
    for (const id of selected) {
      const fr = metricsMap[id]?.metrics?.finalReturn ?? null;
      if (fr == null) continue;
      if (best  === null || fr > (metricsMap[best]?.metrics?.finalReturn  ?? -Infinity)) best  = id;
      if (worst === null || fr < (metricsMap[worst]?.metrics?.finalReturn ??  Infinity)) worst = id;
    }
    return { best, worst };
  }, [metricsMap, selected]);

  const toggleAsset = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.length <= 1 ? prev : prev.filter(x => x !== id);
      return prev.length >= 4 ? [...prev.slice(1), id] : [...prev, id];
    });
  };

  // ── 共用毛玻璃卡片樣式
  const glass = {
    background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 12,
    padding: '16px 20px',
  };

  return (
    <div style={{
      position: 'relative',
      background: 'radial-gradient(ellipse at 30% 10%, #1e1b4b 0%, #020617 45%), radial-gradient(ellipse at 80% 85%, #4c1d95 0%, #020617 55%)',
      borderRadius: 16,
      padding: 24,
      overflow: 'hidden',
      fontFamily: '"Noto Sans TC", system-ui, sans-serif',
    }}>
      <Stars />

      {/* ── 標題列 ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(16px, 3vw, 26px)', fontWeight: 900, letterSpacing: -0.5, color: '#e5e7eb', lineHeight: 1.3 }}>
            {selected.map((id, i) => (
              <span key={id}>
                {i > 0 && <span style={{ color: '#475569' }}> vs </span>}
                <span style={{
                  color: ASSET_CONFIG[id]?.color ?? '#e5e7eb',
                  textShadow: `0 0 18px ${ASSET_CONFIG[id]?.color ?? '#fff'}70`,
                }}>
                  {id}
                </span>
              </span>
            ))}
            <span style={{ color: '#94a3b8', fontWeight: 400 }}> 報酬率比較</span>
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
            報酬率（基準日 {rangeStartDate} = 0%）
          </p>
        </div>

        {/* 資訊卡 */}
        <div style={{ ...glass, padding: '10px 14px', fontSize: 12, color: '#94a3b8', lineHeight: 1.9 }}>
          <div style={{ color: '#e5e7eb', fontWeight: 600 }}>期間：{RANGE_LABELS[range]}</div>
          <div>{rangeStartDate} ~ {today}</div>
          <div>樣本：{chartData.length} 筆月線資料</div>
        </div>
      </div>

      {/* ── 時間區間切換器 ────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, marginBottom: 20 }}>
        {RANGES.map(r => {
          const active = r === range;
          return (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 20,
                border: active ? 'none' : '1px solid rgba(148,163,184,0.25)',
                background: active ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'transparent',
                color: active ? '#fff' : '#94a3b8',
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: active
                  ? '0 0 14px rgba(168,85,247,0.55), 0 0 28px rgba(59,130,246,0.3)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* ── 圖表區（含浮動報酬卡）────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 浮動報酬率卡 */}
        <div style={{
          ...glass,
          position: 'absolute',
          top: 8, left: 8,
          zIndex: 10,
          minWidth: 170,
          maxWidth: 260,
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
            {range} 累積報酬率
          </div>
          {selected.map(id => {
            const fr  = metricsMap[id]?.metrics?.finalReturn ?? null;
            const col = ASSET_CONFIG[id]?.color ?? '#e5e7eb';
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: col,
                    boxShadow: `0 0 8px ${col}`,
                  }} />
                  <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 12 }}>{id}</span>
                </div>
                <span style={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 16,
                  color: fr == null ? '#64748b' : fr >= 0 ? '#fbbf24' : '#f87171',
                }}>
                  {fr == null ? 'N/A' : `${fr >= 0 ? '+' : ''}${fr}%`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recharts 折線圖 */}
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={chartData} margin={{ top: 16, right: 12, bottom: 8, left: 4 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#475569', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={v => fmtDate(v, range)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v}%`}
              width={58}
            />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeDasharray="5 5" />
            <Tooltip content={<ChartTooltip range={range} />} />
            {selected.map(id => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={ASSET_CONFIG[id]?.color ?? '#e5e7eb'}
                strokeWidth={2}
                dot={false}
                connectNulls
                style={{ filter: `drop-shadow(0 0 5px ${ASSET_CONFIG[id]?.color ?? '#fff'}90)` }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── 統計指標卡 ───────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1, marginTop: 16,
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(selected.length, 2)}, 1fr)`,
        gap: 12,
      }}>
        {selected.map(id => {
          const cfg      = ASSET_CONFIG[id] ?? {};
          const m        = metricsMap[id]?.metrics;
          const cutoff   = new Date();
          cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
          const fullStart = allData[id]?.[0]?.date;
          const partial   = fullStart && new Date(fullStart) > cutoff;
          const sliceStart = metricsMap[id]?.sliced?.[0]?.date;

          const fmt = (v, suffix = '%', positive = false) =>
            v == null ? null : `${positive && v >= 0 ? '+' : ''}${v}${suffix}`;

          return (
            <div key={id} style={glass}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: cfg.color,
                  boxShadow: `0 0 10px ${cfg.color}`,
                  flexShrink: 0,
                }} />
                <span style={{ color: cfg.color, fontWeight: 700, fontSize: 14 }}>{id}</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>{cfg.name}</span>
                {partial && sliceStart && (
                  <span style={{ color: '#f59e0b', fontSize: 10, marginLeft: 'auto' }}>
                    ⚠ 資料始於 {sliceStart.slice(0, 7)}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <StatItem label="最高報酬率" value={fmt(m?.maxReturn, '%', true)} color="#fbbf24" />
                <StatItem label="最低報酬率" value={fmt(m?.minReturn, '%', true)} color="#f87171" />
                <StatItem
                  label="年化報酬率"
                  value={fmt(m?.annualized, '%', true)}
                  color={(m?.annualized ?? 0) >= 0 ? '#fbbf24' : '#f87171'}
                />
                <StatItem label="年化波動度" value={fmt(m?.volatility)} color="#a855f7" />
                <StatItem label="最大回撤"   value={fmt(m?.maxDrawdown, '%', true)} color="#f87171" />
                <StatItem
                  label="夏普比率"
                  value={m?.sharpe == null ? null : String(m.sharpe)}
                  color={(m?.sharpe ?? 0) >= 1 ? '#fbbf24' : (m?.sharpe ?? 0) >= 0 ? '#94a3b8' : '#f87171'}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 總結 ─────────────────────────────────────────────── */}
      {summary.best && summary.worst && summary.best !== summary.worst && (
        <div style={{ position: 'relative', zIndex: 1, marginTop: 12, ...glass, fontSize: 13, color: '#94a3b8' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ 總結：</span>
          {RANGE_LABELS[range]}，
          <span style={{ color: ASSET_CONFIG[summary.best]?.color, fontWeight: 700 }}>
            {ASSET_CONFIG[summary.best]?.name}
          </span>
          {' '}表現最佳（{metricsMap[summary.best]?.metrics?.finalReturn >= 0 ? '+' : ''}
          {metricsMap[summary.best]?.metrics?.finalReturn}%），
          <span style={{ color: ASSET_CONFIG[summary.worst]?.color, fontWeight: 700 }}>
            {ASSET_CONFIG[summary.worst]?.name}
          </span>
          {' '}表現最弱（{metricsMap[summary.worst]?.metrics?.finalReturn}%）。
        </div>
      )}

      {/* ── 標的選擇器 ────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 16, ...glass }}>
        <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 13 }}>
          選擇比較標的
          <span style={{ color: '#475569' }}>（最多 4 個・目前 {selected.length}/4）</span>
        </div>
        {Object.entries(CATEGORIES).map(([, { label, ids }]) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ color: '#475569', fontSize: 10, letterSpacing: 1.5, marginBottom: 6 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ids.map(id => {
                const col        = ASSET_CONFIG[id]?.color ?? '#94a3b8';
                const isSelected = selected.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleAsset(id)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      border: `1px solid ${col}`,
                      background: isSelected ? col : 'transparent',
                      color: isSelected ? '#000' : col,
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      boxShadow: isSelected ? `0 0 10px ${col}80, 0 0 20px ${col}40` : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 頁尾 ─────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1, marginTop: 16,
        textAlign: 'center', fontFamily: 'monospace',
        fontSize: 10, color: '#334155', lineHeight: 1.8,
      }}>
        報酬率 = (當前價格 / 區間起始價 − 1) × 100%<br />
        資料來源：Yahoo Finance（股票/指數/加密貨幣）| 月線資料 | 更新：{today}
      </div>
    </div>
  );
}
