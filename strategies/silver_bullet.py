"""
Silver Bullet A-Grade Signal Strategy — Backtest Framework
==========================================================
Capital : 30 USDT  |  Leverage: 1x  |  Window: 22:00-23:00 (Taiwan, UTC+8)

⚠  Important notes:
  1. ICT concepts (OB / FVG / OTE) are programmatic approximations,
     not identical to manual chart reading.
  2. Live win-rate is typically 5-15% lower than backtest results.
  3. This is a signal scanner; semi-automated use is recommended.

Dependencies:
  pip install backtesting pandas numpy ccxt
"""

import pandas as pd
import numpy as np
from datetime import date, timedelta
from backtesting import Backtest, Strategy
import ccxt


# ============================================================
# 1. Data Fetching (Binance perpetual futures)
# ============================================================

def fetch_ohlcv(symbol: str = 'BTC/USDT:USDT',
                timeframe: str = '5m',
                days: int = 90) -> pd.DataFrame:
    """Fetch OHLCV candles from Binance futures."""
    exchange = ccxt.binance({'options': {'defaultType': 'future'}})
    since = exchange.milliseconds() - days * 24 * 60 * 60 * 1000

    all_ohlcv = []
    while since < exchange.milliseconds():
        batch = exchange.fetch_ohlcv(symbol, timeframe, since, limit=1000)
        if not batch:
            break
        all_ohlcv.extend(batch)
        since = batch[-1][0] + 1

    df = pd.DataFrame(all_ohlcv,
                      columns=['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms', utc=True)
    df.set_index('timestamp', inplace=True)
    df.index.name = None
    return df


# ============================================================
# 2. ICT Signal Detection (simplified approximations)
# ============================================================

def detect_order_block(df: pd.DataFrame, lookback: int = 20) -> pd.DataFrame:
    """
    Order Block detection:
      Bullish OB — a bearish candle followed by a strong rally that exceeds its high.
      Bearish OB — a bullish candle followed by a strong drop below its low.
    """
    df = df.copy()
    df['bullish_ob'] = False
    df['bearish_ob'] = False

    for i in range(lookback, len(df) - 3):
        is_bearish = df['Close'].iloc[i] < df['Open'].iloc[i]
        is_bullish = df['Close'].iloc[i] > df['Open'].iloc[i]
        future_highs = df['High'].iloc[i + 1:i + 4].max()
        future_lows  = df['Low'].iloc[i + 1:i + 4].min()

        if is_bearish and future_highs > df['High'].iloc[i] * 1.003:
            df.iloc[i, df.columns.get_loc('bullish_ob')] = True
        if is_bullish and future_lows < df['Low'].iloc[i] * 0.997:
            df.iloc[i, df.columns.get_loc('bearish_ob')] = True

    return df


def detect_fvg(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fair Value Gap detection (3-candle pattern):
      Bullish FVG — candle[i-2].high < candle[i].low  (gap up)
      Bearish FVG — candle[i-2].low  > candle[i].high (gap down)
    The gap is tagged on the middle candle.
    """
    df = df.copy()
    df['bullish_fvg'] = False
    df['bearish_fvg'] = False

    for i in range(2, len(df)):
        if df['High'].iloc[i - 2] < df['Low'].iloc[i]:
            df.iloc[i - 1, df.columns.get_loc('bullish_fvg')] = True
        if df['Low'].iloc[i - 2] > df['High'].iloc[i]:
            df.iloc[i - 1, df.columns.get_loc('bearish_fvg')] = True

    return df


def detect_ote(df: pd.DataFrame, swing_lookback: int = 50) -> pd.DataFrame:
    """
    Optimal Trade Entry — price retraced to the 0.62–0.79 Fibonacci zone
    (the "OTE pocket") measured from the last significant swing.
    """
    df = df.copy()
    df['ote_long']  = False
    df['ote_short'] = False

    for i in range(swing_lookback, len(df)):
        window = df.iloc[i - swing_lookback:i]
        swing_high = window['High'].max()
        swing_low  = window['Low'].min()
        diff = swing_high - swing_low
        if diff == 0:
            continue

        price = df['Close'].iloc[i]

        ote_long_low  = swing_high - diff * 0.79
        ote_long_high = swing_high - diff * 0.62
        if ote_long_low <= price <= ote_long_high:
            df.iloc[i, df.columns.get_loc('ote_long')] = True

        ote_short_low  = swing_low + diff * 0.62
        ote_short_high = swing_low + diff * 0.79
        if ote_short_low <= price <= ote_short_high:
            df.iloc[i, df.columns.get_loc('ote_short')] = True

    return df


# ============================================================
# 3. Strategy
# ============================================================

class SilverBulletStrategy(Strategy):
    # Risk parameters
    risk_pct    = 0.010   # Stop-loss distance from entry (1%)
    reward_pct  = 0.025   # Take-profit distance from entry (2.5%)
    risk_amount = 0.30    # Max risk per trade in USDT

    # Session window (Taiwan time, UTC+8)
    sb_start_hour   = 22
    sb_end_hour     = 23
    force_close_hour = 4   # Force-close any open position at 04:00 TW

    def init(self):
        self._last_trade_date: date | None = None
        self._consec_losses: int = 0
        self._cooldown_until: date | None = None

    # ── helpers ──────────────────────────────────────────────

    def _tw_hour(self) -> int:
        ts = self.data.index[-1]
        if ts.tzinfo is None:
            ts = ts.tz_localize('UTC')
        return ts.tz_convert('Asia/Taipei').hour

    def _current_date(self) -> date:
        ts = self.data.index[-1]
        if ts.tzinfo is None:
            ts = ts.tz_localize('UTC')
        return ts.tz_convert('Asia/Taipei').date()

    def _in_sb_window(self) -> bool:
        return self.sb_start_hour <= self._tw_hour() < self.sb_end_hour

    def _should_force_close(self) -> bool:
        return self._tw_hour() == self.force_close_hour

    # ── A-grade signal checks ─────────────────────────────────

    def _a_grade_long(self) -> bool:
        if len(self.data) < 52:
            return False
        return (bool(self.data.bullish_ob[-1]) and
                bool(self.data.bullish_fvg[-1]) and
                bool(self.data.ote_long[-1]))

    def _a_grade_short(self) -> bool:
        if len(self.data) < 52:
            return False
        return (bool(self.data.bearish_ob[-1]) and
                bool(self.data.bearish_fvg[-1]) and
                bool(self.data.ote_short[-1]))

    # ── consecutive-loss tracking via closed_trades ───────────

    def _update_loss_state(self, today: date) -> None:
        """Read newly closed trades and update cooldown state."""
        ct = self.closed_trades
        if not ct:
            return
        last = ct[-1]
        last_exit_date = last.exit_time
        if hasattr(last_exit_date, 'tz_convert'):
            last_exit_date = last_exit_date.tz_convert('Asia/Taipei').date()
        elif hasattr(last_exit_date, 'date'):
            last_exit_date = last_exit_date.date()

        if last_exit_date != today:
            return

        if last.pl < 0:
            self._consec_losses += 1
        else:
            self._consec_losses = 0

        # Two consecutive losing nights → 3-day cooldown
        if self._consec_losses >= 2:
            self._cooldown_until = today + timedelta(days=3)
            self._consec_losses  = 0

    # ── main loop ─────────────────────────────────────────────

    def next(self):
        today = self._current_date()

        # Force-close protection
        if self._should_force_close() and self.position:
            self.position.close()
            return

        # Hold existing position
        if self.position:
            return

        # Update risk state based on freshly closed trades
        self._update_loss_state(today)

        # Cooldown check
        if self._cooldown_until and today < self._cooldown_until:
            return

        # One trade per calendar day (TW time)
        if self._last_trade_date == today:
            return

        # Must be inside the Silver Bullet window
        if not self._in_sb_window():
            return

        price = self.data.Close[-1]
        # Nominal position: risk_amount / risk_pct = 0.30 / 0.01 = 30 USDT
        size = (self.risk_amount / self.risk_pct) / price

        if self._a_grade_long():
            sl = price * (1 - self.risk_pct)
            tp = price * (1 + self.reward_pct)
            self.buy(size=size, sl=sl, tp=tp)
            self._last_trade_date = today

        elif self._a_grade_short():
            sl = price * (1 + self.risk_pct)
            tp = price * (1 - self.reward_pct)
            self.sell(size=size, sl=sl, tp=tp)
            self._last_trade_date = today


# ============================================================
# 4. Run backtest
# ============================================================

def run_backtest(symbol: str = 'BTC/USDT:USDT',
                 timeframe: str = '5m',
                 days: int = 90):
    print(f"Fetching {days}d of {timeframe} data for {symbol}…")
    df = fetch_ohlcv(symbol, timeframe, days)

    print("Computing ICT signals…")
    df = detect_order_block(df)
    df = detect_fvg(df)
    df = detect_ote(df)

    cols = ['Open', 'High', 'Low', 'Close', 'Volume',
            'bullish_ob', 'bearish_ob',
            'bullish_fvg', 'bearish_fvg',
            'ote_long', 'ote_short']
    df = df[cols]

    print("Running backtest…")
    bt = Backtest(
        df,
        SilverBulletStrategy,
        cash=30,            # 30 USDT starting capital
        commission=0.0005,  # Binance taker fee 0.05%
        margin=1.0,         # 1x leverage (no margin)
        trade_on_close=True,
    )

    stats = bt.run()

    print("\n========== Backtest Results ==========")
    print(stats)
    print("\n========== Trade Log ==========")
    print(stats['_trades'].to_string())

    bt.plot(filename='silver_bullet_result.html', open_browser=False)
    print("\nChart saved → silver_bullet_result.html")

    return stats


if __name__ == '__main__':
    run_backtest()
