// Crypto Strategy page: DCA signals, RSI, and moving average analysis

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CryptoStrategyCard from '../components/CryptoStrategyCard';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
}

function SummaryBar({ assets }) {
  const counts = { 'strong-buy': 0, buy: 0, hold: 0, reduce: 0, caution: 0 };
  assets.forEach(a => {
    if (a.signal?.tier && counts[a.signal.tier] !== undefined) {
      counts[a.signal.tier]++;
    }
  });

  const items = [
    { tier: 'strong-buy', label: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    { tier: 'buy',        label: 'Buy',         color: 'text-green-400',   bg: 'bg-green-500/10  border-green-500/30' },
    { tier: 'hold',       label: 'Hold',        color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { tier: 'reduce',     label: 'Reduce',      color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30' },
    { tier: 'caution',    label: 'Caution',     color: 'text-red-400',     bg: 'bg-red-500/10    border-red-500/30' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {items.map(({ tier, label, color, bg }) => (
        <div key={tier} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${bg}`}>
          <span className={`text-xl font-bold font-mono ${color}`}>{counts[tier]}</span>
          <span className="text-gray-400 text-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}

function StrategyGuide() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4">
        Strategy Guide
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
        <div>
          <p className="text-gray-300 font-medium mb-1">Signal Logic</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>RSI &lt; 30 → oversold, strong accumulation zone</li>
            <li>RSI 30–45 → below equilibrium, good entry</li>
            <li>RSI 45–60 → neutral, maintain regular DCA</li>
            <li>RSI 60–72 → extended, reduce new entries</li>
            <li>RSI &gt; 72 → overbought, pause or take profit</li>
          </ul>
        </div>
        <div>
          <p className="text-gray-300 font-medium mb-1">Moving Averages</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Price &gt; 12M MA: price above trend (bullish)</li>
            <li>Price &lt; 12M MA: price below trend (bearish)</li>
            <li>&gt;15% below 12M MA → extra accumulation bonus</li>
            <li>&gt;40% above 12M MA → caution zone</li>
          </ul>
        </div>
        <div>
          <p className="text-gray-300 font-medium mb-1">DCA Multiplier</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>2× — double your regular investment amount</li>
            <li>1.5× — increase by 50%</li>
            <li>1× — invest your regular scheduled amount</li>
            <li>0.5× — reduce to half</li>
            <li>0× — pause DCA, do not buy</li>
          </ul>
        </div>
        <div>
          <p className="text-gray-300 font-medium mb-1">Risk Reminder</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Signals use monthly closing prices only</li>
            <li>Crypto volatility can cause rapid signal changes</li>
            <li>Always manage position size and total exposure</li>
            <li>This is not financial advice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CryptoStrategy() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crypto-strategy');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const assets = data?.assets ?? [];

  return (
    <>
      <Head>
        <title>Crypto Strategy</title>
        <meta name="description" content="Cryptocurrency DCA strategy signals based on RSI and moving averages" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#0a0e1a] text-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Dashboard
                </Link>
              </div>
              <h1 className="text-2xl font-serif text-white tracking-wide">
                Crypto Strategy
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                DCA signals · RSI · Moving averages · Updated: {formatDate(data?.generatedAt)}
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="self-start sm:self-auto px-4 py-2 bg-indigo-700 hover:bg-indigo-600
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white text-sm rounded-lg transition-colors"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </header>

          {/* Loading */}
          {loading && (
            <div className="text-center py-24 text-gray-500">
              <p className="text-lg animate-pulse">Fetching crypto data…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-24">
              <p className="text-red-400 text-lg mb-2">Failed to load data</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {/* Main content */}
          {!loading && !error && assets.length > 0 && (
            <div className="space-y-10">

              {/* Signal summary bar */}
              <SummaryBar assets={assets} />

              {/* Asset cards */}
              <section>
                <h2 className="text-base font-medium text-gray-400 uppercase tracking-widest mb-4">
                  Strategy Signals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {assets.map(asset => (
                    <CryptoStrategyCard key={asset.id} asset={asset} />
                  ))}
                </div>
              </section>

              {/* Strategy comparison table */}
              <section>
                <h2 className="text-base font-medium text-gray-400 uppercase tracking-widest mb-4">
                  Comparison Table
                </h2>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/50">
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Asset</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">Signal</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">RSI(14)</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">vs 3M MA</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">vs 12M MA</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">12M Return</th>
                        <th className="px-4 py-3 text-center text-gray-400 font-medium">DCA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset, i) => {
                        const pct = (val) => {
                          if (val == null) return <span className="text-gray-600">N/A</span>;
                          const c = val >= 0 ? 'text-emerald-400' : 'text-red-400';
                          return <span className={`font-mono ${c}`}>{val >= 0 ? '+' : ''}{val.toFixed(1)}%</span>;
                        };
                        return (
                          <tr
                            key={asset.id}
                            className={`border-b border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <span className="text-gray-200 font-medium">{asset.name}</span>
                              <span className="ml-2 text-xs text-gray-600 font-mono">{asset.ticker}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-semibold ${
                                asset.signal.tier === 'strong-buy' ? 'text-emerald-400' :
                                asset.signal.tier === 'buy'        ? 'text-green-400' :
                                asset.signal.tier === 'hold'       ? 'text-yellow-400' :
                                asset.signal.tier === 'reduce'     ? 'text-orange-400' :
                                asset.signal.tier === 'caution'    ? 'text-red-400' :
                                'text-gray-500'
                              }`}>
                                {asset.signal.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-gray-200 text-sm">
                              {asset.rsi ?? <span className="text-gray-600">N/A</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">{pct(asset.pctFromMA3)}</td>
                            <td className="px-4 py-3 text-center text-sm">{pct(asset.pctFromMA12)}</td>
                            <td className="px-4 py-3 text-center text-sm">{pct(asset.return12m)}</td>
                            <td className="px-4 py-3 text-center text-xs text-gray-300 font-medium">
                              {asset.signal.dcaMultiplier}×
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Strategy guide */}
              <section>
                <StrategyGuide />
              </section>

            </div>
          )}

          {/* Footer */}
          <footer className="mt-14 pt-6 border-t border-gray-800/60 text-xs text-gray-600 space-y-1">
            <p>Data source: Yahoo Finance · Monthly closing prices · 3-year history</p>
            <p>RSI(14) uses Wilder's smoothing method. Moving averages are simple monthly averages.</p>
            <p>For personal reference only. Not financial advice.</p>
          </footer>

        </div>
      </div>
    </>
  );
}
