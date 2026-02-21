import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSignals, fetchPlatformStats } from '../redux/slices/signalSlice';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Bot,
  Zap,
  BarChart2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

/* ─────────────────────────────────────────── helpers ── */

const signalColor = {
  BUY:     { border: 'border-green-500/40',  bg: 'bg-green-500/10',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-400'  },
  SELL:    { border: 'border-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400'      },
  NEUTRAL: { border: 'border-gray-500/30',  bg: 'bg-gray-500/5',    text: 'text-gray-400',   badge: 'bg-gray-500/20 text-gray-400'    },
};

const confidenceColor = {
  HIGH:   'bg-emerald-500/20 text-emerald-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW:    'bg-gray-500/20 text-gray-400',
};

function SignalIcon({ signal }) {
  if (signal === 'BUY')     return <ArrowUpRight className="w-4 h-4 text-green-400" />;
  if (signal === 'SELL')    return <ArrowDownRight className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

/* ─────────────────────────────────────────── SignalCard ── */

function SignalCard({ s }) {
  const c = signalColor[s.signal] || signalColor.NEUTRAL;
  const pct24h = s.change24h ?? 0;
  const strength = Math.min(100, s.strength ?? 50);

  return (
    <div className={`
      relative flex flex-col gap-3 p-4 rounded-xl border ${c.border} ${c.bg}
      transition-all duration-200 hover:scale-[1.015] hover:shadow-lg
    `}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white">{s.symbol?.replace('/USDT','') ?? s.symbol}</span>
            <span className="text-xs text-gray-500">/USDT</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.exchange}</span>
            <span className="text-gray-600">·</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{s.timeframe}</span>
          </div>
        </div>

        {/* Signal badge */}
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.badge}`}>
          <SignalIcon signal={s.signal} />
          {s.signal}
        </span>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-white">
          ${Number(s.price ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}
        </span>
        <span className={`text-sm font-medium ${pct24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {pct24h >= 0 ? '+' : ''}{pct24h.toFixed(2)}%
        </span>
      </div>

      {/* Indicator badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {s.rsi != null && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            s.rsi < 35 ? 'bg-green-500/20 text-green-400' :
            s.rsi > 65 ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            RSI {s.rsi.toFixed(0)}
          </span>
        )}
        {s.trend && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            s.trend === 'uptrend' ? 'bg-green-500/20 text-green-400' :
            s.trend === 'downtrend' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {s.trend}
          </span>
        )}
        {s.confidence && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${confidenceColor[s.confidence] ?? confidenceColor.LOW}`}>
            {s.confidence}
          </span>
        )}
      </div>

      {/* Strength bar */}
      {strength > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Signal Strength</span>
            <span className="text-[10px] font-semibold text-gray-400">{Math.round(strength)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s.signal === 'BUY'  ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                s.signal === 'SELL' ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                'bg-gradient-to-r from-gray-500 to-gray-400'
              }`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Reason */}
      {s.reason && (
        <p className="text-[11px] leading-snug text-gray-500 border-t border-white/5 pt-2">{s.reason}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── Skeleton ── */

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
      <div className="h-6 w-28 bg-white/10 rounded mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-14 bg-white/8 rounded-full" />
        <div className="h-4 w-16 bg-white/8 rounded-full" />
        <div className="h-4 w-12 bg-white/8 rounded-full" />
      </div>
      <div className="h-1.5 bg-white/8 rounded-full" />
    </div>
  );
}

/* ─────────────────────────────────────────── StatCard ── */

function StatCard({ label, value, sub, icon: Icon, gradient, loading }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/4 border border-white/8">
      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        {loading ? (
          <div className="h-5 w-16 bg-white/10 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-xl font-extrabold text-white leading-none">{value ?? '—'}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Page ── */

const FILTER_OPTS = [
  { key: 'all',     label: 'All Signals' },
  { key: 'buy',     label: 'Buy' },
  { key: 'sell',    label: 'Sell' },
  { key: 'neutral', label: 'Neutral' },
];

const Signals = () => {
  const dispatch     = useDispatch();
  const { spot, futures, stats, loading, statsLoading, lastUpdated } =
    useSelector(state => state.signals);

  const [activeTab,    setActiveTab]    = useState('spot');
  const [filterKey,    setFilterKey]    = useState('all');
  const [autoRefresh,  setAutoRefresh]  = useState(true);
  const [secondsLeft,  setSecondsLeft]  = useState(300);

  /* Initial fetch */
  useEffect(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
  }, [dispatch]);

  /* Auto-refresh (5-min) */
  useEffect(() => {
    if (!autoRefresh) return;

    // countdown ticker
    const ticker = setInterval(() => {
      setSecondsLeft(s => (s <= 1 ? 300 : s - 1));
    }, 1000);

    // actual refresh
    const refresher = setInterval(() => {
      dispatch(fetchSignals('spot'));
      dispatch(fetchSignals('futures'));
      dispatch(fetchPlatformStats());
      setSecondsLeft(300);
    }, 300_000);

    return () => { clearInterval(ticker); clearInterval(refresher); };
  }, [dispatch, autoRefresh]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
    setSecondsLeft(300);
  }, [dispatch]);

  const rawSignals = activeTab === 'spot' ? spot : futures;
  const signals    = filterKey === 'all'
    ? rawSignals
    : rawSignals.filter(s => s.signal?.toLowerCase() === filterKey);

  const buyCount     = rawSignals.filter(s => s.signal === 'BUY').length;
  const sellCount    = rawSignals.filter(s => s.signal === 'SELL').length;
  const neutralCount = rawSignals.filter(s => s.signal === 'NEUTRAL').length;

  const fmtTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-brandDark-900 text-white">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-cyan-400" />
              Smart Trading Signals
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Real-time BUY / SELL signals powered by RSI, EMA trend and volume analysis.
            </p>
          </div>

          {/* Refresh controls */}
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(a => !a)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {autoRefresh ? `Auto (${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2,'0')})` : 'Auto Off'}
            </button>

            {/* Manual refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p className="mt-2 text-[11px] text-gray-600">
            Last updated: {fmtTime(lastUpdated)}
          </p>
        )}
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Active Signals"
          value={stats?.activeSignals}
          icon={Zap}
          gradient="from-cyan-500 to-blue-600"
          loading={statsLoading}
        />
        <StatCard
          label="Buy Signals"
          value={stats?.buySignals}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-600"
          loading={statsLoading}
        />
        <StatCard
          label="Sell Signals"
          value={stats?.sellSignals}
          icon={TrendingDown}
          gradient="from-red-500 to-rose-600"
          loading={statsLoading}
        />
        <StatCard
          label="Signals Today"
          value={stats?.totalSignalsToday}
          icon={BarChart2}
          gradient="from-purple-500 to-violet-600"
          loading={statsLoading}
        />
      </div>

      {/* ── Tabs + Filter row ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">

        {/* Spot / Futures tabs */}
        <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/8">
          {['spot', 'futures'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Signal count pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">
            {buyCount} BUY
          </span>
          <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-semibold">
            {sellCount} SELL
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-400 font-semibold">
            {neutralCount} NEUTRAL
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <div className="inline-flex rounded-lg p-0.5 bg-white/5 border border-white/8">
            {FILTER_OPTS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterKey(f.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filterKey === f.key
                    ? 'bg-white/15 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Signal grid ───────────────────────────────────── */}
      {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SignalSkeleton key={i} />)}
        </div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No signals match this filter</p>
          <p className="text-gray-600 text-sm mt-1">Try selecting "All Signals" or refresh data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {signals.map((s, i) => (
            <SignalCard key={`${s.symbol}-${i}`} s={s} />
          ))}
        </div>
      )}

      {/* ── Info footer ───────────────────────────────────── */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-xs leading-relaxed text-gray-500">
        <span className="font-semibold text-amber-400/80">Disclaimer: </span>
        Signals are generated by technical indicators (RSI, EMA, Volume). They are for informational purposes only
        and do not constitute financial advice. Always validate signals with your own research and use the demo
        account before trading with real capital.
      </div>
    </div>
  );
};

export default Signals;
