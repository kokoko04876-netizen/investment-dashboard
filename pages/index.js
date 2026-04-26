// Dashboard 主頁面：從 /api/dashboard 讀取資料並渲染三個區塊

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import ReturnsTable from '../components/ReturnsTable';
import RiskTable    from '../components/RiskTable';
import PriceChart   from '../components/PriceChart';

function formatLastUpdate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
}

export default function Home() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`伺服器回應 ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (!res.ok) throw new Error(`更新失敗 ${res.status}`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // 顯示所有標的（失敗的顯示 N/A）
  const assets = data?.assets ?? [];

  return (
    <>
      <Head>
        <title>投資 Dashboard</title>
        <meta name="description" content="個人投資組合監控" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#0a0e1a] text-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* ── 標題列 ── */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div>
              <h1 className="text-2xl font-serif text-white tracking-wide">
                投資 Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                最後更新：{formatLastUpdate(data?.lastUpdate)}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="self-start sm:self-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white text-sm rounded-lg transition-colors"
            >
              {refreshing ? '更新中…' : '重新整理資料'}
            </button>
          </header>

          {/* ── 載入中 ── */}
          {loading && (
            <div className="text-center py-24 text-gray-500">
              <p className="text-lg animate-pulse">資料載入中，請稍候…</p>
            </div>
          )}

          {/* ── 錯誤訊息 ── */}
          {!loading && error && (
            <div className="text-center py-24">
              <p className="text-red-400 text-lg mb-2">資料載入失敗</p>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
              >
                重試
              </button>
            </div>
          )}

          {/* ── 尚無資料（KV 是空的，需要先 refresh） ── */}
          {!loading && !error && assets.length === 0 && (
            <div className="text-center py-24">
              <p className="text-gray-300 text-lg mb-2">尚無資料</p>
              <p className="text-gray-500 text-sm mb-6">
                請點擊右上角「重新整理資料」按鈕觸發第一次資料抓取（約需 1 分鐘）
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600
                           disabled:opacity-40 text-white text-sm rounded-lg"
              >
                {refreshing ? '抓取中…' : '立即抓取'}
              </button>
            </div>
          )}

          {/* ── 主內容 ── */}
          {!loading && !error && assets.length > 0 && (
            <div className="space-y-10">

              <section>
                <h2 className="text-base font-medium text-gray-400 uppercase tracking-widest mb-3">
                  報酬率比較
                </h2>
                <ReturnsTable assets={assets} />
              </section>

              <section>
                <h2 className="text-base font-medium text-gray-400 uppercase tracking-widest mb-3">
                  風險指標
                </h2>
                <RiskTable assets={assets} />
              </section>

              <section>
                <h2 className="text-base font-medium text-gray-400 uppercase tracking-widest mb-3">
                  10 年走勢圖
                </h2>
                <PriceChart assets={assets} />
              </section>

            </div>
          )}

          {/* ── 頁尾 ── */}
          <footer className="mt-14 pt-6 border-t border-gray-800/60 text-xs text-gray-600 space-y-1">
            <p>資料來源：Yahoo Finance（股票／指數）、CoinGecko（加密貨幣）</p>
            <p>報酬率計算不含股息再投入，每日台灣時間 08:00 自動更新，可能有 1 日延遲。</p>
            <p>本頁面僅供個人參考，不構成任何投資建議。</p>
          </footer>

        </div>
      </div>
    </>
  );
}
