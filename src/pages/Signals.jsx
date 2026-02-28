import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSignals,
  fetchPlatformStats,
  fetchSignalHistory,
  runBacktest,
  clearBacktestResult,
  analyzeSignal,
  clearAnalysis,
} from '../redux/slices/signalSlice';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  BarChart2,
  Clock,
  Lock,
  Crown,
  ChevronRight,
  History,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  Layers,
  Brain,
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

/* ─────────────────────────────────────── SignalCard ── */

function SignalCard({ s, isPremium }) {
  const isLong = s.type === 'LONG';
  const conf   = s.confidenceScore ?? 0;
  const confPct = Math.round(conf * 100);

  const border = isLong ? 'border-green-500/35' : 'border-red-500/35';
  const bg     = isLong ? 'bg-green-500/8'      : 'bg-red-500/8';
  const badge  = isLong
    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
    : 'bg-red-500/20 text-red-300 border border-red-500/30';
  const barColor = isLong
    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
    : 'bg-gradient-to-r from-red-500 to-rose-400';

  const mtf = s.mtfAlignment ?? {};
  const mtfKeys = ['1m','5m','15m','1h'];

  return (
    <div className={`relative flex flex-col gap-3 p-4 rounded-xl border ${border} ${bg} transition-all duration-200 hover:scale-[1.012] hover:shadow-lg`}>

      {/* Top row — pair + badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white">
              {(s.pair ?? s.symbol ?? '').replace('/USDT','').replace('USDT','')}
            </span>
            <span className="text-xs text-gray-500">/USDT</span>
            {s.marketType === 'futures' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold uppercase">PERP</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.exchange ?? 'Binance'}</span>
            <span className="text-gray-600">·</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.timeframe ?? '1h'}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge}`}>
            {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {s.type}
          </span>
          {s.leverage && s.leverage > 1 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">
              {s.leverage}×
            </span>
          )}
        </div>
      </div>

      {/* Entry / SL / TP */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Entry',      icon: Target,  val: s.entry,     color: 'text-cyan-300'  },
          { label: 'Stop Loss',  icon: Shield,  val: s.stopLoss,  color: 'text-red-400'   },
          { label: 'Take Profit',icon: Zap,     val: s.takeProfit,color: 'text-green-400' },
        ].map(({ label, icon: Icon, val, color }) => (
          <div key={label} className="relative flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-white/4 border border-white/5">
            <Icon className={`w-3 h-3 ${color} mb-0.5`} />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
            {isPremium ? (
              <span className={`text-[11px] font-bold ${color}`}>
                ${fmt(val, 4)}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-gray-600 blur-[4px] select-none">
                ${fmt(val, 4)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* R:R badge + AI confidence */}
      <div className="flex items-center gap-2">
        {s.riskReward != null && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            s.riskReward >= 2
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              : 'bg-gray-500/15 text-gray-400 border-gray-500/20'
          }`}>
            R:R {Number(s.riskReward).toFixed(1)}
          </span>
        )}
        {s.aiSource && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-semibold flex items-center gap-0.5">
            <Brain className="w-2.5 h-2.5" /> {s.aiSource === 'model' ? 'AI' : 'Rules'}
          </span>
        )}
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">AI Confidence</span>
          <span className={`text-[10px] font-bold ${confPct >= 80 ? 'text-emerald-400' : confPct >= 65 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {confPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${confPct}%` }}
          />
        </div>
      </div>

      {/* MTF alignment */}
      {Object.keys(mtf).length > 0 && (
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <div className="flex gap-1">
            {mtfKeys.map(tf => {
              const val = mtf[tf];
              if (val == null) return null;
              const aligned = isLong ? val > 0 : val < 0;
              return (
                <span key={tf} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  aligned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {tf}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Reasons */}
      {Array.isArray(s.reasons) && s.reasons.length > 0 && (
        <div className="border-t border-white/5 pt-2 flex flex-wrap gap-1">
          {s.reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Premium lock overlay hint */}
      {!isPremium && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-500/70">
          <Lock className="w-3 h-3" />
          <span>Upgrade for entry & levels</span>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[9px] text-gray-700 -mt-1">
        {fmtTime(s.timestamp)}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────── Skeleton ── */

function SignalSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-white/8 bg-white/3 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-1.5">
          <div className="h-4 w-20 bg-white/10 rounded" />
          <div className="h-3 w-14 bg-white/6 rounded" />
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[0,1,2].map(i => <div key={i} className="h-12 bg-white/8 rounded-lg" />)}
      </div>
      <div className="h-1.5 bg-white/8 rounded-full mt-2" />
    </div>
  );
}

/* ─────────────────────────────────────── StatCard ── */

function StatCard({ label, value, icon: Icon, gradient, loading }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/4 border border-white/8">
      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        {loading
          ? <div className="h-5 w-16 bg-white/10 rounded animate-pulse mb-1" />
          : <p className="text-xl font-extrabold text-white leading-none">{value ?? '—'}</p>
        }
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── HistoryRow ── */

function HistoryRow({ s }) {
  const isLong = s.type === 'LONG';
  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
      <td className="py-2.5 px-3 text-sm font-semibold text-white">
        {(s.pair ?? s.symbol ?? '').replace('USDT', '')}
        <span className="text-gray-600 text-xs">/USDT</span>
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {s.type}
        </span>
      </td>
      <td className="py-2.5 px-3 text-xs text-gray-300 capitalize">{s.marketType}</td>
      <td className="py-2.5 px-3 text-xs text-gray-300">{s.timeframe}</td>
      <td className="py-2.5 px-3 text-xs text-cyan-300 font-medium">
        {s.confidenceScore != null ? `${Math.round(s.confidenceScore * 100)}%` : '—'}
      </td>
      <td className="py-2.5 px-3 text-xs text-gray-400">{fmtTime(s.timestamp)}</td>
      <td className="py-2.5 px-3">
        <span className={`text-xs font-medium ${
          s.outcome === 'win'  ? 'text-green-400' :
          s.outcome === 'loss' ? 'text-red-400'   : 'text-gray-500'
        }`}>
          {s.outcome ?? 'pending'}
        </span>
      </td>
    </tr>
  );
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
  { key: 'spot',     label: 'Spot',     icon: TrendingUp   },
  { key: 'futures',  label: 'Futures',  icon: Layers       },
  { key: 'history',  label: 'History',  icon: History      },
  { key: 'backtest', label: 'Backtest', icon: FlaskConical  },
  { key: 'analyze',  label: 'Analyze',  icon: Search        },
];

const ANALYZE_PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','AVAXUSDT','LINKUSDT','DOTUSDT',
  'MATICUSDT','UNIUSDT','ATOMUSDT','LTCUSDT','NEARUSDT',
  'FTMUSDT','SANDUSDT','MANAUSDT','AXSUSDT','AAVEUSDT',
];

const BACKTEST_SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT'];
const BACKTEST_TFS     = ['1m','5m','15m','1h','4h'];

const Signals = () => {
  const dispatch  = useDispatch();
  const { spot, futures, stats, history, historyMeta,
          backtestResult, analysis, loading, statsLoading,
          historyLoading, backtestLoading, analysisLoading,
          backtestError, analysisError, lastUpdated } =
    useSelector(state => state.signals);

  const role      = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  const [activeTab,   setActiveTab]   = useState('spot');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [typeFilter,  setTypeFilter]  = useState('all');

  // History filters
  const [hFilter, setHFilter] = useState({ marketType: '', type: '', minConfidence: '' });

  // Backtest form
  const [btForm, setBtForm] = useState({
    symbol: 'BTCUSDT', marketType: 'spot', timeframe: '1h',
    initialCapital: '10000', riskPerTrade: '0.02',
  });

  // Analyze form
  const [azForm, setAzForm] = useState({
    symbol: 'BTCUSDT', timeframe: '1h', marketType: 'spot',
  });

  /* Initial fetch */
  useEffect(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
  }, [dispatch]);

  /* Auto-refresh live signals */
  useEffect(() => {
    if (!autoRefresh || (activeTab !== 'spot' && activeTab !== 'futures')) return;
    const ticker    = setInterval(() => setSecondsLeft(s => s <= 1 ? 300 : s - 1), 1000);
    const refresher = setInterval(() => {
      dispatch(fetchSignals('spot'));
      dispatch(fetchSignals('futures'));
      dispatch(fetchPlatformStats());
      setSecondsLeft(300);
    }, 300_000);
    return () => { clearInterval(ticker); clearInterval(refresher); };
  }, [dispatch, autoRefresh, activeTab]);

  /* Fetch history when tab opens */
  useEffect(() => {
    if (activeTab === 'history') {
      dispatch(fetchSignalHistory({ ...hFilter, limit: 50 }));
    }
  }, [activeTab]); // eslint-disable-line

  const handleRefresh = useCallback(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
    setSecondsLeft(300);
  }, [dispatch]);

  const handleHistorySearch = () => {
    dispatch(fetchSignalHistory({ ...hFilter, limit: 50, skip: 0 }));
  };

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

  const rawSignals = activeTab === 'spot' ? spot : futures;
  const filtered   = typeFilter === 'all'
    ? rawSignals
    : rawSignals.filter(s => s.type === typeFilter);

  const longCount  = rawSignals.filter(s => s.type === 'LONG').length;
  const shortCount = rawSignals.filter(s => s.type === 'SHORT').length;

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

          <div className="flex items-center gap-3">
            {(activeTab === 'spot' || activeTab === 'futures') && (
              <>
                <button
                  onClick={() => setAutoRefresh(a => !a)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    autoRefresh
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {autoRefresh
                    ? `Auto (${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2,'0')})`
                    : 'Auto Off'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </>
            )}
            {!isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Crown className="w-3.5 h-3.5" />
                Free Tier
              </span>
            )}
          </div>
        </div>
        {lastUpdated && (
          <p className="mt-1 text-[11px] text-gray-600">Last updated: {fmtTime(lastUpdated)}</p>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Signals"    value={stats?.activeSignals}     icon={Zap}         gradient="from-cyan-500 to-blue-600"    loading={statsLoading} />
        <StatCard label="Long Signals"      value={stats?.buySignals}        icon={TrendingUp}  gradient="from-green-500 to-emerald-600" loading={statsLoading} />
        <StatCard label="Short Signals"     value={stats?.sellSignals}       icon={TrendingDown} gradient="from-red-500 to-rose-600"    loading={statsLoading} />
        <StatCard label="Signals Today"     value={stats?.totalSignalsToday} icon={BarChart2}   gradient="from-purple-500 to-violet-600" loading={statsLoading} />
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

      {/* ════════════ SPOT / FUTURES ════════════ */}
      {(activeTab === 'spot' || activeTab === 'futures') && (
        <>
          {/* Type filter + counts */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {['all','LONG','SHORT'].map(k => (
              <button
                key={k}
                onClick={() => setTypeFilter(k)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                  typeFilter === k
                    ? k === 'LONG'  ? 'bg-green-500/25 text-green-300 border border-green-500/40'
                    : k === 'SHORT' ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                    : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-gray-500 border border-white/8 hover:text-gray-300'
                }`}
              >
                {k === 'all' ? `All (${rawSignals.length})` : k === 'LONG' ? `Long (${longCount})` : `Short (${shortCount})`}
              </button>
            ))}
          </div>

          {loading && filtered.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SignalSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">No signals yet</p>
              <p className="text-gray-600 text-sm mt-1">The engine scans markets every 5 minutes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s, i) => (
                <SignalCard key={`${s.pair ?? s.symbol}-${i}`} s={s} isPremium={isPremium} />
              ))}
            </div>
          )}

          {/* Free-tier upgrade nudge */}
          {!isPremium && (
            <div className="mt-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">Upgrade to Premium</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unlock instant signals (no 5-min delay), exact entry/SL/TP prices, and signal history.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </div>
          )}
        </>
      )}

      {/* ════════════ HISTORY ════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
            <select
              value={hFilter.marketType}
              onChange={e => setHFilter(f => ({ ...f, marketType: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">All Markets</option>
              <option value="spot">Spot</option>
              <option value="futures">Futures</option>
            </select>
            <select
              value={hFilter.type}
              onChange={e => setHFilter(f => ({ ...f, type: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">All Types</option>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
            <select
              value={hFilter.minConfidence}
              onChange={e => setHFilter(f => ({ ...f, minConfidence: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Any Confidence</option>
              <option value="0.75">≥ 75%</option>
              <option value="0.85">≥ 85%</option>
              <option value="0.90">≥ 90%</option>
            </select>
            <button
              onClick={handleHistorySearch}
              className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Table */}
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <History className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">No signal history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    {['Pair','Type','Market','TF','Confidence','Time','Outcome'].map(h => (
                      <th key={h} className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((s, i) => <HistoryRow key={s._id ?? i} s={s} />)}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-600">
            Showing {history.length} of {historyMeta?.total ?? 0} signals
          </p>
        </div>
      )}

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
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    {BACKTEST_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Market Type</span>
                  <select
                    value={btForm.marketType}
                    onChange={e => setBtForm(f => ({ ...f, marketType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
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
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
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
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
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
                  <select
                    value={azForm.symbol}
                    onChange={e => setAzForm(f => ({ ...f, symbol: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    {ANALYZE_PAIRS.map(p => (
                      <option key={p} value={p}>{p.replace('USDT', '/USDT')}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Timeframe</span>
                  <select
                    value={azForm.timeframe}
                    onChange={e => setAzForm(f => ({ ...f, timeframe: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
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
                    className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
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
                  The engine reads real-time candles from Binance and scores 6 technical indicators.
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

                    {/* Neutral message */}
                    {!hasSignal && az.message && (
                      <p className="text-xs text-gray-500 mt-2">{az.message}</p>
                    )}
                  </div>

                  {/* ── Entry / SL / TP (only if signal) ── */}
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
                        {/* RSI */}
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

                        {/* EMA cross */}
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

                        {/* EMA200 */}
                        {az.indicators.ema200 != null && az.currentPrice != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">EMA 200</span>
                            <span className={`text-xs font-bold ${az.currentPrice > az.indicators.ema200 ? 'text-green-400' : 'text-red-400'}`}>
                              {az.currentPrice > az.indicators.ema200 ? 'Above' : 'Below'}
                            </span>
                            <span className="text-[9px] text-gray-600">${fmt(az.indicators.ema200, 2)}</span>
                          </div>
                        )}

                        {/* MACD */}
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

                        {/* Bollinger Bands */}
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

                        {/* ATR */}
                        {az.indicators.atr != null && (
                          <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
                            <span className="text-[9px] text-gray-600 uppercase tracking-wider">ATR (14)</span>
                            <span className="text-xs font-bold text-gray-300 font-mono">${fmt(az.indicators.atr, 4)}</span>
                            <span className="text-[9px] text-gray-600">
                              {az.currentPrice > 0 ? ((az.indicators.atr / az.currentPrice) * 100).toFixed(2) + '% of price' : ''}
                            </span>
                          </div>
                        )}

                        {/* Volume ratio */}
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
