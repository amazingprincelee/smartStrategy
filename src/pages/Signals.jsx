import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  runBacktest,
  clearBacktestResult,
  analyzeSignal,
  clearAnalysis,
  fetchAvailablePairs,
} from '../redux/slices/signalSlice';
import {
  Activity,
  RefreshCw,
  Zap,
  BarChart2,
  Lock,
  Crown,
  FlaskConical,
  Target,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';

/* ─────────────────────────────────────── helpers ── */

const isPremiumUser = (role) => role === 'premium' || role === 'admin';

function fmt(n, decimals = 2) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtPct(n, decimals = 1) {
  if (n == null) return '—';
  return `${(Number(n) * 100).toFixed(decimals)}%`;
}

function fmtTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─────────────────────────────────────── MetricCard ── */

function MetricCard({ label, value, color = 'text-white' }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/4 border border-white/8">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-extrabold ${color}`}>{value ?? '—'}</span>
    </div>
  );
}

/* ─────────────────────────────────────── BacktestTradeRow ── */

function BacktestTradeRow({ t, i }) {
  const pnl = t.pnl ?? 0;
  return (
    <tr className="border-b border-white/5 hover:bg-white/3">
      <td className="py-2 px-3 text-xs text-gray-400">{i + 1}</td>
      <td className="py-2 px-3 text-xs font-semibold text-white">{t.symbol}</td>
      <td className="py-2 px-3">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
          t.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>{t.side}</span>
      </td>
      <td className="py-2 px-3 text-xs text-gray-300">${fmt(t.entryPrice, 2)}</td>
      <td className="py-2 px-3 text-xs text-gray-300">${fmt(t.exitPrice, 2)}</td>
      <td className={`py-2 px-3 text-xs font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {pnl >= 0 ? '+' : ''}${fmt(pnl, 2)}
      </td>
      <td className="py-2 px-3 text-xs text-gray-500">{fmtTime(t.exitTime)}</td>
    </tr>
  );
}

/* ─────────────────────────────────────── Page ── */

const TABS = [
  { key: 'analyze',  label: 'Analyze',  icon: Search       },
  { key: 'backtest', label: 'Backtest', icon: FlaskConical },
];

const ANALYZE_PAIRS = [
  // Large caps
  'BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','SOLUSDT','ADAUSDT','LTCUSDT','DOGEUSDT',
  // DeFi & Layer 1
  'AVAXUSDT','DOTUSDT','ATOMUSDT','NEARUSDT','LINKUSDT','UNIUSDT','AAVEUSDT','MATICUSDT',
  'ARBUSDT','OPUSDT','APTUSDT','SUIUSDT','INJUSDT','STXUSDT','ICPUSDT','FILUSDT',
  // Trending / Meme
  'PEPEUSDT','SHIBUSDT','FLOKIUSDT','BONKUSDT','WIFUSDT','MEMEUSDT',
  // AI & Web3
  'FETUSDT','RNDRUSDT','WLDUSDT','AGIXUSDT','OCEANUSDT',
  // Gaming & NFT
  'AXSUSDT','SANDUSDT','MANAUSDT','GALAUSDT','APEUSDT','GMTUSDT',
  // Other popular
  'RUNEUSDT','THETAUSDT','EGLDUSDT','VETUSDT','HBARUSDT','ALGOUSDT',
  'TONUSDT','JUPUSDT','FTMUSDT','XTZUSDT','ZRXUSDT',
];

const BACKTEST_SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'];
const BACKTEST_TFS     = ['1m','5m','15m','1h','4h'];

const Signals = () => {
  const dispatch  = useDispatch();
  const { backtestResult, analysis,
          backtestLoading, analysisLoading,
          backtestError, analysisError,
          availablePairs } =
    useSelector(state => state.signals);

  const role      = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  const [activeTab, setActiveTab] = useState('analyze');

  // Backtest form
  const [btForm, setBtForm] = useState({
    symbol: 'BTCUSDT', marketType: 'spot', timeframe: '1h',
    initialCapital: '10000', riskPerTrade: '0.02',
  });

  // Analyze form
  const [azForm, setAzForm] = useState({
    symbol: 'BTCUSDT', timeframe: '1h', marketType: 'spot',
  });

  // Fetch pair list from exchange on mount; refetch when market type changes
  useEffect(() => {
    dispatch(fetchAvailablePairs(azForm.marketType));
  }, [azForm.marketType, dispatch]);

  // Use dynamic pairs if available, otherwise fall back to the hardcoded list
  const pairList = availablePairs.length > 0 ? availablePairs : ANALYZE_PAIRS;

  const handleBacktest = (e) => {
    e.preventDefault();
    dispatch(clearBacktestResult());
    dispatch(runBacktest({
      ...btForm,
      initialCapital: parseFloat(btForm.initialCapital),
      riskPerTrade:   parseFloat(btForm.riskPerTrade),
    }));
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    dispatch(clearAnalysis());
    dispatch(analyzeSignal(azForm));
  };

  const bt = backtestResult;

  return (
    <div className="min-h-screen bg-brandDark-900 text-white">

      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              Smart Trading Signals
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Hybrid AI + multi-timeframe signals with ATR-based risk management.
            </p>
          </div>
          {!isPremium && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Crown className="w-3.5 h-3.5" />
              Free Tier
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === key
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════ BACKTEST ════════════ */}
      {activeTab === 'backtest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleBacktest} className="p-5 rounded-xl bg-white/3 border border-white/8 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Backtest Parameters
              </h3>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Symbol</span>
                  <select
                    value={btForm.symbol}
                    onChange={e => setBtForm(f => ({ ...f, symbol: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  >
                    {BACKTEST_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Market Type</span>
                  <select
                    value={btForm.marketType}
                    onChange={e => setBtForm(f => ({ ...f, marketType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  >
                    <option value="spot">Spot</option>
                    <option value="futures">Futures</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Timeframe</span>
                  <select
                    value={btForm.timeframe}
                    onChange={e => setBtForm(f => ({ ...f, timeframe: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  >
                    {BACKTEST_TFS.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Initial Capital ($)</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={btForm.initialCapital}
                    onChange={e => setBtForm(f => ({ ...f, initialCapital: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">
                    Risk Per Trade ({(parseFloat(btForm.riskPerTrade || 0) * 100).toFixed(1)}%)
                  </span>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={btForm.riskPerTrade}
                    onChange={e => setBtForm(f => ({ ...f, riskPerTrade: e.target.value }))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                    <span>0.1%</span><span>10%</span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={backtestLoading}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {backtestLoading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running…</>
                  : <><FlaskConical className="w-4 h-4" /> Run Backtest</>
                }
              </button>

              {backtestError && (
                <p className="text-xs text-red-400 text-center">{backtestError}</p>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-5">
            {!bt && !backtestLoading && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <FlaskConical className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">Configure and run a backtest to see results</p>
              </div>
            )}

            {backtestLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/4 animate-pulse" />
                ))}
              </div>
            )}

            {bt && (
              <>
                {/* Summary header */}
                <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-xs text-gray-500 mb-1">
                    {bt.symbol} · {bt.marketType} · {bt.timeframe} · {bt.totalTrades} trades
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-extrabold ${(bt.totalReturn ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(bt.totalReturn ?? 0) >= 0 ? '+' : ''}{fmtPct(bt.totalReturn)}
                    </span>
                    <span className="text-sm text-gray-500">total return</span>
                  </div>
                </div>

                {/* Metric grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MetricCard label="Win Rate"       value={fmtPct(bt.winRate)}          color={(bt.winRate ?? 0) >= 0.5 ? 'text-green-400' : 'text-red-400'} />
                  <MetricCard label="Profit Factor"  value={fmt(bt.profitFactor, 2)}     color={(bt.profitFactor ?? 0) >= 1.5 ? 'text-green-400' : 'text-yellow-400'} />
                  <MetricCard label="Sharpe Ratio"   value={fmt(bt.sharpeRatio, 2)}      color={(bt.sharpeRatio ?? 0) >= 1 ? 'text-green-400' : 'text-yellow-400'} />
                  <MetricCard label="Max Drawdown"   value={fmtPct(bt.maxDrawdown)}      color="text-red-400" />
                  <MetricCard label="Avg Win"        value={`$${fmt(bt.avgWin, 2)}`}     color="text-green-400" />
                  <MetricCard label="Avg Loss"       value={`-$${fmt(bt.avgLoss, 2)}`}   color="text-red-400" />
                  <MetricCard label="Expectancy"     value={`$${fmt(bt.expectancy, 2)}`} color={(bt.expectancy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                  <MetricCard label="Final Equity"   value={`$${fmt(bt.finalEquity, 0)}`} />
                  <MetricCard label="Total Trades"   value={bt.totalTrades} />
                </div>

                {/* Recent trades */}
                {bt.recentTrades?.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/3">
                          {['#','Symbol','Side','Entry','Exit','PnL','Exit Time'].map(h => (
                            <th key={h} className="py-2 px-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bt.recentTrades.map((t, i) => <BacktestTradeRow key={i} t={t} i={i} />)}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════ ANALYZE ════════════ */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Form ── */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAnalyze} className="p-5 rounded-xl bg-white/3 border border-white/8 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                Analyze a Pair
              </h3>
              <p className="text-xs text-gray-500 -mt-2">
                Select a USDT pair and click Analyze. The engine will compute RSI, EMA, MACD, Bollinger Bands and ATR to determine the current trend.
              </p>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Pair</span>
                  <input
                    type="text"
                    list="analyze-pairs-list"
                    value={azForm.symbol}
                    onChange={e => setAzForm(f => ({ ...f, symbol: e.target.value.toUpperCase().replace('/', '').trim() }))}
                    placeholder="e.g. BTCUSDT or type to search…"
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
                    style={{ colorScheme: 'dark' }}
                    autoComplete="off"
                  />
                  <datalist id="analyze-pairs-list">
                    {pairList.map(p => (
                      <option key={p} value={p}>{p.replace('USDT', '/USDT')}</option>
                    ))}
                  </datalist>
                  {/* Filtered chips — hide chips that don't match what's typed */}
                  {(() => {
                    const q = azForm.symbol.replace('USDT', '').toUpperCase();
                    // When dynamic list is large (>100), only show first 80 unfiltered to keep UI fast
                    const base = pairList.length > 100 ? pairList.slice(0, 80) : pairList;
                    const filtered = q.length >= 2
                      ? pairList.filter(p => p.replace('USDT', '').startsWith(q) || p.startsWith(q))
                      : base;
                    return (
                      <>
                        <p className="text-[10px] text-gray-600 mt-1.5 mb-1">
                          {q.length >= 2 ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : 'Quick pick:'}
                        </p>
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                          {filtered.map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setAzForm(f => ({ ...f, symbol: p }))}
                              className={`px-1.5 py-0.5 text-[10px] rounded font-mono border transition-colors ${
                                azForm.symbol === p
                                  ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                                  : 'border-white/10 bg-white/4 text-gray-500 hover:text-gray-300 hover:border-white/20'
                              }`}
                            >
                              {p.replace('USDT', '')}
                            </button>
                          ))}
                          {filtered.length === 0 && (
                            <p className="text-[10px] text-gray-600 italic">No match — you can still type any valid pair</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Timeframe</span>
                  <select
                    value={azForm.timeframe}
                    onChange={e => setAzForm(f => ({ ...f, timeframe: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  >
                    <option value="15m">15 minutes</option>
                    <option value="1h">1 hour</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Market Type</span>
                  <select
                    value={azForm.marketType}
                    onChange={e => setAzForm(f => ({ ...f, marketType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50" style={{ colorScheme: 'dark' }}
                  >
                    <option value="spot">Spot</option>
                    <option value="futures">Futures (Perp)</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={analysisLoading}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analysisLoading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…</>
                  : <><Search className="w-4 h-4" /> Analyze</>
                }
              </button>

              {analysisError && (
                <p className="text-xs text-red-400 text-center">{analysisError}</p>
              )}
            </form>
          </div>

          {/* ── Results ── */}
          <div className="lg:col-span-2">
            {!analysis && !analysisLoading && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <Search className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium">Select a pair and click Analyze</p>
                <p className="text-gray-600 text-sm mt-1">
                  The engine reads real-time candles and scores 6 technical indicators.
                </p>
              </div>
            )}

            {analysisLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-24 bg-white/4 rounded-xl" />
                <div className="grid grid-cols-3 gap-3">
                  {[0,1,2].map(i => <div key={i} className="h-16 bg-white/4 rounded-xl" />)}
                </div>
                <div className="h-32 bg-white/4 rounded-xl" />
              </div>
            )}

            {analysis && !analysisLoading && (() => {
              const az = analysis;
              const hasSignal = !!az.signal;
              const isLong = az.signal === 'LONG';
              const conf = az.confidenceScore ?? 0;
              const confPct = Math.round(conf * 100);

              return (
                <div className="space-y-4">

                  {/* ── Signal verdict ── */}
                  <div className={`p-5 rounded-xl border ${
                    hasSignal
                      ? isLong
                        ? 'border-green-500/40 bg-green-500/8'
                        : 'border-red-500/40 bg-red-500/8'
                      : 'border-white/10 bg-white/3'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {hasSignal
                            ? isLong
                              ? <CheckCircle className="w-5 h-5 text-green-400" />
                              : <XCircle className="w-5 h-5 text-red-400" />
                            : <MinusCircle className="w-5 h-5 text-gray-500" />
                          }
                          <span className="text-lg font-bold text-white">
                            {az.pair?.replace('USDT', '/USDT')}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">{az.timeframe} · {az.marketType}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Current price: <span className="text-gray-300 font-mono">${fmt(az.currentPrice, 4)}</span>
                        </p>
                      </div>

                      {hasSignal ? (
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                          isLong
                            ? 'bg-green-500/25 text-green-300 border border-green-500/40'
                            : 'bg-red-500/25 text-red-300 border border-red-500/40'
                        }`}>
                          {isLong ? '▲ LONG' : '▼ SHORT'}
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gray-500/15 text-gray-400 border border-gray-500/25">
                          NEUTRAL
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Signal Strength</span>
                        <span className="text-[10px] text-gray-400">
                          {az.longScore ?? 0} bullish · {az.shortScore ?? 0} bearish · of {az.maxScore ?? 6} indicators
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 flex gap-0.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-l-full transition-all"
                          style={{ width: `${((az.longScore ?? 0) / (az.maxScore ?? 6)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-r-full transition-all"
                          style={{ width: `${((az.shortScore ?? 0) / (az.maxScore ?? 6)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {!hasSignal && az.message && (
                      <p className="text-xs text-gray-500 mt-2">{az.message}</p>
                    )}
                  </div>

                  {/* ── Entry / SL / TP ── */}
                  {hasSignal && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Entry',       icon: Target, val: az.entry,      color: 'text-cyan-300'  },
                        { label: 'Stop Loss',   icon: Shield, val: az.stopLoss,   color: 'text-red-400'   },
                        { label: 'Take Profit', icon: Zap,    val: az.takeProfit, color: 'text-green-400' },
                      ].map(({ label, icon: Icon, val, color }) => (
                        <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/4 border border-white/8">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
                          {isPremium ? (
                            <span className={`text-sm font-bold font-mono ${color}`}>${fmt(val, 4)}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-600 blur-[5px] select-none">${fmt(val, 4)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* R:R + confidence */}
                  {hasSignal && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {az.riskReward != null && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold">
                          R:R {Number(az.riskReward).toFixed(1)}
                        </span>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Confidence</span>
                          <span className={`text-[10px] font-bold ${confPct >= 80 ? 'text-emerald-400' : confPct >= 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {confPct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${isLong ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                            style={{ width: `${confPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Indicators breakdown ── */}
                  {az.indicators && (
                    <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5" /> Indicators
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {az.indicators.rsi != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">RSI (14)</span>
                            <span className={`text-sm font-bold ${az.indicators.rsi < 35 ? 'text-green-400' : az.indicators.rsi > 65 ? 'text-red-400' : 'text-gray-300'}`}>
                              {az.indicators.rsi}
                            </span>
                            <span className="text-[9px] text-gray-600">
                              {az.indicators.rsi < 35 ? 'Oversold' : az.indicators.rsi > 65 ? 'Overbought' : 'Neutral'}
                            </span>
                          </div>
                        )}

                        {az.indicators.ema20 != null && az.indicators.ema50 != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">EMA 20/50</span>
                            <span className={`text-xs font-bold ${az.indicators.ema20 > az.indicators.ema50 ? 'text-green-400' : 'text-red-400'}`}>
                              {az.indicators.ema20 > az.indicators.ema50 ? 'Bullish' : 'Bearish'}
                            </span>
                            <span className="text-[9px] text-gray-600">
                              {az.indicators.ema20 > az.indicators.ema50 ? '20 > 50' : '20 < 50'}
                            </span>
                          </div>
                        )}

                        {az.indicators.ema200 != null && az.currentPrice != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">EMA 200</span>
                            <span className={`text-xs font-bold ${az.currentPrice > az.indicators.ema200 ? 'text-green-400' : 'text-red-400'}`}>
                              {az.currentPrice > az.indicators.ema200 ? 'Above' : 'Below'}
                            </span>
                            <span className="text-[9px] text-gray-600">${fmt(az.indicators.ema200, 2)}</span>
                          </div>
                        )}

                        {az.indicators.macd != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">MACD</span>
                            <span className={`text-xs font-bold ${az.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {az.indicators.macd.histogram > 0 ? 'Positive' : 'Negative'}
                            </span>
                            <span className="text-[9px] text-gray-600 font-mono">
                              {az.indicators.macd.histogram > 0 ? '+' : ''}{Number(az.indicators.macd.histogram).toFixed(4)}
                            </span>
                          </div>
                        )}

                        {az.indicators.bb != null && az.currentPrice != null && (() => {
                          const bb = az.indicators.bb;
                          const range = bb.upper - bb.lower;
                          const pos = range > 0 ? (az.currentPrice - bb.lower) / range : 0.5;
                          return (
                            <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                              <span className="text-[9px] text-gray-600 uppercase tracking-wider">Bollinger</span>
                              <span className={`text-xs font-bold ${pos < 0.25 ? 'text-green-400' : pos > 0.75 ? 'text-red-400' : 'text-gray-300'}`}>
                                {pos < 0.25 ? 'Near Low' : pos > 0.75 ? 'Near High' : 'Mid-range'}
                              </span>
                              <span className="text-[9px] text-gray-600">{(pos * 100).toFixed(0)}% of band</span>
                            </div>
                          );
                        })()}

                        {az.indicators.atr != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">ATR (14)</span>
                            <span className="text-xs font-bold text-gray-300 font-mono">${fmt(az.indicators.atr, 4)}</span>
                            <span className="text-[9px] text-gray-600">
                              {az.currentPrice > 0 ? ((az.indicators.atr / az.currentPrice) * 100).toFixed(2) + '% of price' : ''}
                            </span>
                          </div>
                        )}

                        {az.indicators.volRatio != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Vol Ratio</span>
                            <span className={`text-xs font-bold ${az.indicators.volRatio > 1.5 ? 'text-cyan-400' : 'text-gray-300'}`}>
                              {az.indicators.volRatio}×
                            </span>
                            <span className="text-[9px] text-gray-600">vs 20-period avg</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Reasons ── */}
                  {Array.isArray(az.reasons) && az.reasons.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Signal Reasons
                      </h4>
                      <ul className="space-y-1.5">
                        {az.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${az.signal === 'LONG' ? 'bg-green-400' : 'bg-red-400'}`} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ── Free tier lock ── */}
                  {!isPremium && hasSignal && (
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
                      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        <span className="text-amber-400 font-semibold">Upgrade to Premium</span> to see exact entry, stop-loss, and take-profit prices.
                      </p>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-xs leading-relaxed text-gray-500">
        <span className="font-semibold text-amber-400/80">Disclaimer: </span>
        Signals are generated by a hybrid AI + technical analysis engine. They are for informational
        purposes only and do not constitute financial advice. Past backtest performance does not
        guarantee future results. Always validate with your own research and use the demo account
        before trading real capital.
      </div>
    </div>
  );
};

export default Signals;
