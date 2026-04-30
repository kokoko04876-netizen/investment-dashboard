// Silver Bullet A-Grade Signal Strategy — overview & reference page

import Head from 'next/head';
import Link from 'next/link';

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
      {children}
    </h2>
  );
}

function InfoCard({ title, children, accent = 'indigo' }) {
  const border = {
    indigo: 'border-indigo-500/30',
    emerald: 'border-emerald-500/30',
    yellow: 'border-yellow-500/30',
    red: 'border-red-500/30',
  }[accent] ?? 'border-gray-700';

  return (
    <div className={`rounded-xl border ${border} bg-gray-900/50 p-5`}>
      <h3 className="text-white font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ParamRow({ label, value, note }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-800/60 last:border-0 gap-4">
      <span className="text-gray-400 text-xs shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-gray-200 font-mono text-xs">{value}</span>
        {note && <p className="text-gray-600 text-xs mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

function SignalStep({ step, title, description, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  };
  return (
    <div className="flex gap-4">
      <div className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${colors[color]}`}>
        {step}
      </div>
      <div>
        <p className="text-gray-200 text-sm font-medium">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

export default function SilverBullet() {
  return (
    <>
      <Head>
        <title>Silver Bullet Strategy</title>
        <meta name="description" content="ICT Silver Bullet A-grade signal strategy with OB, FVG, and OTE confluence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#0a0e1a] text-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* ── Header ── */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
              <Link href="/" className="hover:text-gray-300 transition-colors">Dashboard</Link>
              <span>/</span>
              <Link href="/crypto-strategy" className="hover:text-gray-300 transition-colors">Crypto Strategy</Link>
              <span>/</span>
              <span className="text-gray-400">Silver Bullet</span>
            </div>
            <h1 className="text-3xl font-serif text-white tracking-wide">Silver Bullet</h1>
            <p className="text-gray-500 text-sm mt-1">
              ICT A-Grade Signal Strategy · OB + FVG + OTE Confluence · 22:00–23:00 TW
            </p>
          </header>

          {/* ── Strategy Parameters ── */}
          <section className="mb-10">
            <SectionTitle>Strategy Parameters</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <InfoCard title="Capital & Execution" accent="indigo">
                <ParamRow label="Starting Capital"  value="30 USDT" />
                <ParamRow label="Leverage"           value="1×"     note="No margin used" />
                <ParamRow label="Exchange"           value="Binance Futures" />
                <ParamRow label="Commission"         value="0.05%"  note="Taker fee per side" />
                <ParamRow label="Timeframe"          value="5-minute candles" />
              </InfoCard>

              <InfoCard title="Risk Management" accent="emerald">
                <ParamRow label="Risk per Trade"    value="0.30 USDT"  note="1% of 30 USDT" />
                <ParamRow label="Stop-Loss"         value="1.0%"       note="From entry price" />
                <ParamRow label="Take-Profit"       value="2.5%"       note="From entry price" />
                <ParamRow label="Risk:Reward"       value="1 : 2.5"    note="Minimum R-multiple" />
                <ParamRow label="Max Trades/Day"    value="1"          note="One signal per session" />
              </InfoCard>

              <InfoCard title="Session Window" accent="yellow">
                <ParamRow label="Entry Window"      value="22:00 – 23:00" note="Taiwan time (UTC+8)" />
                <ParamRow label="UTC Equivalent"    value="14:00 – 15:00 UTC" />
                <ParamRow label="Force-Close"       value="04:00 TW"   note="No overnight holds" />
                <ParamRow label="Session Type"      value="NY Lunch / Silver Bullet" />
              </InfoCard>

              <InfoCard title="Drawdown Protection" accent="red">
                <ParamRow label="1-Night Loss"      value="Stop for rest of session" />
                <ParamRow label="2 Consecutive Losses" value="3-day cooldown" />
                <ParamRow label="Cooldown Reset"    value="Auto after 3 calendar days" />
                <ParamRow label="Position Sizing"   value="Fixed risk-amount (not % equity)" />
              </InfoCard>

            </div>
          </section>

          {/* ── ICT Concepts ── */}
          <section className="mb-10">
            <SectionTitle>ICT Concepts Used</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <InfoCard title="Order Block (OB)" accent="indigo">
                <p className="text-gray-400 text-xs leading-relaxed">
                  The last opposing candle before a strong impulsive move. Price often
                  returns to this zone for liquidity before continuing.
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-mono shrink-0">Bullish</span>
                    <span className="text-gray-500">Last bearish candle before rally; next 3 bars exceed its high by 0.3%+</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400 font-mono shrink-0">Bearish</span>
                    <span className="text-gray-500">Last bullish candle before drop; next 3 bars break its low by 0.3%+</span>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Fair Value Gap (FVG)" accent="indigo">
                <p className="text-gray-400 text-xs leading-relaxed">
                  An imbalance created by a 3-candle sequence where candle 1 and candle 3
                  do not overlap. Price tends to revisit the gap.
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-mono shrink-0">Bullish</span>
                    <span className="text-gray-500">C[i-2].high &lt; C[i].low — upward gap on middle bar</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-400 font-mono shrink-0">Bearish</span>
                    <span className="text-gray-500">C[i-2].low &gt; C[i].high — downward gap on middle bar</span>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Optimal Trade Entry (OTE)" accent="indigo">
                <p className="text-gray-400 text-xs leading-relaxed">
                  The 0.62–0.79 Fibonacci retracement zone from the last swing high/low.
                  Known as the "OTE pocket" — the highest-probability re-entry area.
                </p>
                <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                  <p>Lookback: 50 candles for swing detection</p>
                  <p>Zone: 0.62 → 0.79 fib retracement</p>
                  <p>Best entry: near 0.705 (midpoint)</p>
                </div>
              </InfoCard>

            </div>
          </section>

          {/* ── A-Grade Signal Logic ── */}
          <section className="mb-10">
            <SectionTitle>A-Grade Signal — Triple Confluence</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  All three conditions must be present on the same candle for a signal
                  to qualify as A-grade. A single or double confluence is ignored.
                </p>
                <div className="space-y-4">
                  <SignalStep
                    step="1" color="indigo"
                    title="Order Block present"
                    description="Current bar is tagged as a valid bullish or bearish OB within the lookback window."
                  />
                  <SignalStep
                    step="2" color="emerald"
                    title="Fair Value Gap aligned"
                    description="The FVG direction matches the OB direction on the same candle."
                  />
                  <SignalStep
                    step="3" color="yellow"
                    title="Price in OTE zone"
                    description="Current close sits between the 0.62 and 0.79 Fibonacci retracement levels."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Entry calculation (long example)
                </p>
                <CodeBlock>{`price  = current close
sl     = price × (1 - 0.010)   # −1.0%
tp     = price × (1 + 0.025)   # +2.5%

# Nominal position = risk_amount / risk_pct
#                  = 0.30 / 0.01 = 30 USDT
size   = 30 / price   # units of BTC/ETH/etc.

# With 1× leverage:
# Max loss  = 0.30 USDT
# Max gain  = 0.75 USDT
# R:R ratio = 1 : 2.5`}</CodeBlock>

                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-4">
                  Short entry is the mirror image
                </p>
                <CodeBlock>{`sl = price × (1 + 0.010)   # +1.0%
tp = price × (1 - 0.025)   # −2.5%`}</CodeBlock>
              </div>

            </div>
          </section>

          {/* ── How to Run ── */}
          <section className="mb-10">
            <SectionTitle>How to Run the Backtest</SectionTitle>
            <div className="space-y-4">

              <InfoCard title="1. Install dependencies" accent="indigo">
                <CodeBlock>{`# From the project root
cd strategies
pip install -r requirements.txt`}</CodeBlock>
              </InfoCard>

              <InfoCard title="2. Run the backtest" accent="indigo">
                <CodeBlock>{`python silver_bullet.py

# Or import and customise:
from silver_bullet import run_backtest

stats = run_backtest(
    symbol    = 'ETH/USDT:USDT',  # switch asset
    timeframe = '5m',
    days      = 180,               # longer history
)
print(stats['Win Rate [%]'])
print(stats['Profit Factor'])`}</CodeBlock>
              </InfoCard>

              <InfoCard title="3. Output files" accent="indigo">
                <div className="text-xs text-gray-400 space-y-1">
                  <p><span className="text-gray-200 font-mono">silver_bullet_result.html</span> — Interactive Bokeh chart (open in browser)</p>
                  <p>Console output includes full stats table and per-trade log.</p>
                </div>
              </InfoCard>

            </div>
          </section>

          {/* ── Limitations ── */}
          <section className="mb-10">
            <SectionTitle>Known Limitations</SectionTitle>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-3">
              {[
                ['Programmatic OB/FVG vs manual', 'The detection logic is a heuristic approximation. A human trader reading the same chart may disagree with the tagged zones.'],
                ['Overfitting risk', 'Parameters (0.62–0.79 OTE, 0.3% OB threshold) were chosen conceptually, not optimised. Always walk-forward test before going live.'],
                ['Live slippage not modelled', 'trade_on_close=True fills at the candle\'s close price. Real fills will differ, especially during high-volatility moments.'],
                ['Single session only', 'The 22:00–23:00 TW window is one of three ICT Silver Bullet windows. The other two (03:00–04:00, 10:00–11:00 TW) are not included.'],
                ['Small capital constraints', 'At 30 USDT with 1× leverage, Binance minimum notional ($5) limits the coins you can trade at high prices (e.g. BTC at $100k → min 0.00005 BTC).'],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3">
                  <span className="text-yellow-400 shrink-0 mt-0.5">⚠</span>
                  <div>
                    <p className="text-yellow-300 text-xs font-semibold">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="pt-6 border-t border-gray-800/60 text-xs text-gray-600 space-y-1">
            <p>Strategy file: <span className="font-mono text-gray-500">strategies/silver_bullet.py</span></p>
            <p>Data source: Binance Futures via ccxt · ICT concepts by Michael J. Huddleston</p>
            <p>For personal research only. Not financial advice.</p>
          </footer>

        </div>
      </div>
    </>
  );
}
