import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bot,
  Activity,
  ArrowRightLeft,
  Flame,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ArrowUpRight,
  Clock,
  Search,
  Target,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  Info,
  Lock,
} from 'lucide-react';
import { fetchPlatformStats, fetchSignals, fetchSignalHistory, analyzeSignal, fetchAvailablePairs } from '../redux/slices/signalSlice';
import { fetchArbitrageOpportunities, fetchTriangularOpportunities } from '../redux/slices/arbitrageslice';
import { fetchBots } from '../redux/slices/botSlice';
import QuickExecuteModal from '../components/bots/QuickExecuteModal';

/* ─── free-tier daily signal counter (resets at midnight) ───── */
const AZ_KEY = 'az_count'; // { date: 'YYYY-MM-DD', count: n }
const todayStr = () => new Date().toISOString().slice(0, 10);
const getFreeCount = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(AZ_KEY) || '{}');
    return raw.date === todayStr() ? (raw.count || 0) : 0;
  } catch { return 0; }
};
const incFreeCount = () => {
  const count = getFreeCount() + 1;
  localStorage.setItem(AZ_KEY, JSON.stringify({ date: todayStr(), count }));
  return count;
};
const FREE_AZ_LIMIT = 3;

/* ─── helpers ────────────────────────────────────────────────── */
const now = new Date();
const greeting = () => {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (n, dec = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

/* ─── Indicator hint tooltip ─────────────────────────────────── */
function Hint({ text }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-flex ml-0.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="What does this mean?"
      >
        <Info className="w-2 h-2" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-52 px-3 py-2 rounded-xl bg-gray-950 border border-white/15 text-[10px] text-gray-300 leading-relaxed shadow-xl pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
        </span>
      )}
    </span>
  );
}

/* ─── service card config ────────────────────────────────────── */
const SERVICES = [
  {
    key: 'bots',
    title: 'Bot Trading',
    description: 'Automate your trading with AI-driven bots. Set strategies, manage risk, and let your bots trade 24/7.',
    href: '/bots',
    badge: null,
    gradient: 'from-cyan-500/10 to-blue-600/10',
    border: 'border-cyan-500/30 hover:border-cyan-500/70',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    Icon: Bot,
    cta: 'Manage Bots',
  },
  {
    key: 'signals',
    title: 'AI Signals',
    description: 'Real-time buy/sell signals powered by hybrid AI + rule-based engine across spot and futures markets.',
    href: '/signals',
    badge: 'Live',
    badgeColor: 'bg-violet-500',
    gradient: 'from-violet-500/10 to-purple-600/10',
    border: 'border-violet-500/30 hover:border-violet-500/70',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    Icon: Activity,
    cta: 'View Signals',
  },
  {
    key: 'arbitrage',
    title: 'Arbitrage',
    description: 'Scan 50+ exchanges in real time and capture price discrepancies before they disappear.',
    href: '/arbitrage',
    badge: 'Live',
    badgeColor: 'bg-emerald-500',
    gradient: 'from-emerald-500/10 to-green-600/10',
    border: 'border-emerald-500/30 hover:border-emerald-500/70',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    Icon: ArrowRightLeft,
    cta: 'Scan Markets',
  },
  {
    key: 'alpha',
    title: 'Early Alpha',
    description: 'Spot new listings, volume spikes, whale accumulation, and trending coins before the crowd.',
    href: '/alpha',
    badge: 'New',
    badgeColor: 'bg-orange-500',
    gradient: 'from-orange-500/10 to-red-600/10',
    border: 'border-orange-500/30 hover:border-orange-500/70',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    Icon: Flame,
    cta: 'View Alpha',
  },
];

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  /* redux state */
  const user         = useSelector((s) => s.auth.user);
  const bots         = useSelector((s) => s.bots?.list || []);
  const platformStats = useSelector((s) => s.signals?.stats);
  const spotSignals  = useSelector((s) => s.signals?.spot || []);
  const history      = useSelector((s) => s.signals?.history || []);
  const { opportunities, triangular } = useSelector((s) => s.arbitrage || { opportunities: [], triangular: { opportunities: [] } });
  const { analysis, analysisLoading, analysisError, availablePairs } = useSelector((s) => s.signals);
  const isPremium = user?.role === 'premium' || user?.role === 'admin';
  const [freeCount, setFreeCount] = useState(getFreeCount);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchPlatformStats());
    dispatch(fetchSignals('spot'));
    dispatch(fetchArbitrageOpportunities({ minProfit: 0.1, minVolume: 100, topCoins: 10 }));
    dispatch(fetchTriangularOpportunities());
    // Always pre-load history so the signal card has something to show
    // even if the live in-memory cache is cold (e.g. right after server restart)
    dispatch(fetchSignalHistory({ marketType: 'spot', limit: 10 }));
    dispatch(fetchAvailablePairs('spot'));
  }, [dispatch]);

  /* derived */
  const firstName    = user?.profile?.firstName || user?.email?.split('@')[0] || 'Trader';
  const activeBots   = bots.filter((b) => b.status === 'running').length;
  const totalPnL     = bots.reduce((s, b) => s + (b.stats?.totalPnL || 0), 0);
  // Live signals first; fall back to most recent DB history entry
  // Live signals first; fall back to most recent LONG from DB history.
  // Spot markets have no shorting — never show a SHORT signal in the spot card,
  // even if old DB records have SHORT+spot from before the futures guard was added.
  const latestSignal = spotSignals.find(s => s.type === 'LONG')
    || spotSignals[0]
    || history.find(s => s.type === 'LONG')
    || null;
  const topArb       = opportunities?.[0] || null;
  const topTriArb    = triangular?.opportunities?.[0] || null;

  /* analyze form */
  const POPULAR_CHIPS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT'];
  const [azForm, setAzForm]   = useState({ symbol: '', timeframe: '1h', marketType: 'futures' });
  const [azQuery, setAzQuery] = useState('');
  const [quickExecuteSignal, setQuickExecuteSignal] = useState(null);

  const filteredPairs = azQuery.length >= 2
    ? (availablePairs || []).filter(p => p.replace('USDT','').startsWith(azQuery.toUpperCase()) || p.startsWith(azQuery.toUpperCase())).slice(0, 8)
    : [];

  const selectPair = (pair) => {
    setAzForm(f => ({ ...f, symbol: pair }));
    setAzQuery('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!azForm.symbol) return;
    const result = await dispatch(analyzeSignal({ symbol: azForm.symbol, timeframe: azForm.timeframe, marketType: azForm.marketType }));
    // Count only when a real signal (with entry/SL/TP) comes back, and user is free
    if (!isPremium && result?.payload?.entry != null) {
      setFreeCount(incFreeCount());
    }
  };

  /* quick-stat chips */
  const chips = [
    {
      label: 'Active Bots',
      value: activeBots,
      icon: Bot,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      href: '/bots',
    },
    {
      label: 'Bot P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${fmt(totalPnL)}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bg: totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      href: '/bots',
    },
    {
      label: 'AI Signals',
      value: platformStats?.totalSignalsToday ?? '—',
      icon: Zap,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      href: '/signals',
    },
    {
      label: 'Arb Opportunities',
      value: opportunities?.length ?? '—',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      href: '/arbitrage',
    },
  ];

  return (
    <div className="space-y-8 pb-8">

      {/* ── Welcome bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Platform status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          All systems operational
        </div>
      </div>

      {/* ── Quick-stat chips ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {chips.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            to={href}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-700 shadow-sm hover:border-gray-300 dark:hover:border-brandDark-600 hover:shadow-md transition-all cursor-pointer"
          >
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{String(value)}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Analyze ────────────────────────────────────────── */}
      <div data-tour="quick-analysis" className="card overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Pair Analysis</h3>
              <p className="text-[10px] text-gray-500">RSI · EMA · MACD · Bollinger · ATR · Volume</p>
            </div>
          </div>
          <Link to="/signals?tab=analyze" className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            Full analysis <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-5">

          {/* ── Form ── */}
          <form onSubmit={handleAnalyze} className="lg:col-span-2 p-5 border-b lg:border-b-0 lg:border-r border-white/6 flex flex-col gap-3">
            {/* Pair input */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Pair</label>
              <div className="relative">
                <input
                  type="text"
                  value={azQuery || azForm.symbol}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace('/', '').trim();
                    setAzQuery(val);
                    setAzForm(f => ({ ...f, symbol: val }));
                  }}
                  onFocus={() => azForm.symbol && setAzQuery(azForm.symbol)}
                  placeholder="Search pair, e.g. BTC or SOL…"
                  className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
                {filteredPairs.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-brandDark-700 border border-white/15 shadow-xl z-50 overflow-hidden">
                    {filteredPairs.map(p => (
                      <button key={p} type="button" onClick={() => selectPair(p)}
                        className="w-full px-3 py-2 text-left text-xs font-mono text-gray-300 hover:bg-white/8 hover:text-white transition-colors">
                        {p.replace('USDT', '')}<span className="text-gray-600">/USDT</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!azForm.symbol && (
                <div className="mt-2">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Popular</p>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_CHIPS.map(p => (
                      <button key={p} type="button" onClick={() => selectPair(p)}
                        className="px-2 py-0.5 text-[10px] rounded font-mono border border-white/10 bg-white/4 text-gray-400 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors">
                        {p.replace('USDT', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {azForm.symbol && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold">{azForm.symbol.replace('USDT', '/USDT')}</span>
                  <button type="button" onClick={() => { setAzForm(f => ({ ...f, symbol: '' })); setAzQuery(''); }} className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">✕ clear</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Timeframe</label>
                <select value={azForm.timeframe} onChange={e => setAzForm(f => ({ ...f, timeframe: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors" style={{ colorScheme: 'dark' }}>
                  <option value="15m">15 min</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">1 day</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Market</label>
                <select value={azForm.marketType} onChange={e => setAzForm(f => ({ ...f, marketType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-brandDark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors" style={{ colorScheme: 'dark' }}>
                  <option value="spot">Spot</option>
                  <option value="futures">Futures</option>
                </select>
              </div>
            </div>
            <button data-tour="analyze-btn" type="submit" disabled={analysisLoading || !azForm.symbol}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 mt-auto">
              {analysisLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Search className="w-4 h-4" /> Analyze</>}
            </button>
            {analysisError && !analysisError.toLowerCase().includes('premium') && (
              <p className="text-xs text-red-400 text-center">{analysisError}</p>
            )}
          </form>

          {/* ── Results ── */}
          <div className="lg:col-span-3 p-5">
            {!analysis && !analysisLoading && (
              <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Enter a pair and click Analyze</p>
                <p className="text-xs text-gray-600">Try BTCUSDT, ETHUSDT, SOLUSDT…</p>
              </div>
            )}
            {analysisLoading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-14 bg-white/4 rounded-xl" />
                <div className="grid grid-cols-3 gap-2">{[0,1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/4 rounded-lg" />)}</div>
                <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i => <div key={i} className="h-14 bg-white/4 rounded-xl" />)}</div>
              </div>
            )}
            {analysis && !analysisLoading && (() => {
              const az = analysis;
              const hasSignal = !!az.signal;
              const isLong = az.signal === 'LONG';
              const fmtV = (n, d = 2) => n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
              return (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${hasSignal ? isLong ? 'border-green-500/30 bg-green-500/8' : 'border-red-500/30 bg-red-500/8' : 'border-white/8 bg-white/3'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        {hasSignal ? isLong ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" /> : <MinusCircle className="w-4 h-4 text-gray-500" />}
                        <span className="font-bold text-white">{az.pair?.replace('USDT', '/USDT')}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{az.timeframe} · {az.marketType}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6 mt-0.5">
                        <span className="font-mono text-gray-300">${fmtV(az.currentPrice, 4)}</span>
                        <span className="mx-2 text-gray-700">·</span>
                        {az.longScore ?? 0} bullish · {az.shortScore ?? 0} bearish
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${hasSignal ? isLong ? 'bg-green-500/20 text-green-300 border border-green-500/35' : 'bg-red-500/20 text-red-300 border border-red-500/35' : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'}`}>
                        {hasSignal ? (isLong ? '▲ LONG' : '▼ SHORT') : 'NEUTRAL'}
                      </span>
                      {hasSignal && (
                        <button
                          onClick={() => setQuickExecuteSignal({
                            pair: az.pair, type: az.signal, entry: az.entry,
                            stopLoss: az.stopLoss, takeProfit: az.takeProfit,
                            marketType: az.marketType, confidenceScore: az.confidence,
                          })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white ${isLong ? 'bg-green-500 hover:bg-green-400' : 'bg-orange-500 hover:bg-orange-400'}`}
                        >
                          <Zap className="w-3 h-3" /> Trade This
                        </button>
                      )}
                    </div>
                  </div>
                  {!hasSignal && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/8">
                      <div className="relative group/neutral flex-shrink-0 mt-0.5">
                        <Info className="w-3.5 h-3.5 text-gray-500 cursor-help group-hover/neutral:text-cyan-400 transition-colors" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/neutral:block z-50 w-64 p-3 rounded-xl bg-gray-950 border border-white/15 text-[10px] text-gray-300 leading-relaxed shadow-xl pointer-events-none">
                          <p className="font-semibold text-white mb-1.5">How signals are decided</p>
                          <p className="mb-1.5">The engine scores <span className="text-white font-semibold">6 indicators</span> — RSI, EMA 20/50, EMA 200, MACD, Bollinger Bands, and Volume. Each one votes either <span className="text-green-400">Bullish</span> or <span className="text-red-400">Bearish</span>.</p>
                          <p className="mb-1.5">A <span className="text-green-400 font-semibold">LONG signal</span> fires when ≥3 vote bullish and none cancel it out. A <span className="text-red-400 font-semibold">SHORT signal</span> fires when ≥3 vote bearish.</p>
                          <p className="text-gray-500">When votes are tied or mixed, the market is <span className="text-gray-300">NEUTRAL</span> — no trade is suggested because the evidence isn't strong enough yet.</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400"><span className="text-gray-300 font-semibold">No signal yet. </span>{az.message || `Need ≥3 indicators to agree — currently split ${az.longScore ?? 0} vs ${az.shortScore ?? 0}.`}</p>
                    </div>
                  )}
                  {az.indicators && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {az.indicators.rsi != null && (() => { const b = az.indicators.rsi < 35, bear = az.indicators.rsi > 65; return (
                        <div className={`p-2 rounded-lg border text-center ${b ? 'border-green-500/20 bg-green-500/8' : bear ? 'border-red-500/20 bg-red-500/8' : 'border-white/6 bg-white/3'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">RSI<Hint text="Relative Strength Index (0–100). Below 35 = oversold, price may bounce up. Above 65 = overbought, price may drop. In between = neutral momentum." /></p>
                          <p className={`text-xs font-bold ${b ? 'text-green-400' : bear ? 'text-red-400' : 'text-gray-300'}`}>{az.indicators.rsi}</p>
                          <p className="text-[9px] text-gray-600">{b ? 'Oversold' : bear ? 'Overbought' : 'Neutral'}</p>
                        </div>
                      ); })()}
                      {az.indicators.ema20 != null && az.indicators.ema50 != null && (() => { const b = az.indicators.ema20 > az.indicators.ema50; return (
                        <div className={`p-2 rounded-lg border text-center ${b ? 'border-green-500/20 bg-green-500/8' : 'border-red-500/20 bg-red-500/8'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">EMA20/50<Hint text="Exponential Moving Average crossover. When EMA20 is above EMA50, short-term momentum is bullish. When below, it's bearish. Think of it as a fast vs slow trend comparison." /></p>
                          <p className={`text-xs font-bold ${b ? 'text-green-400' : 'text-red-400'}`}>{b ? 'Bull' : 'Bear'}</p>
                          <p className="text-[9px] text-gray-600">{b ? '20>50' : '20<50'}</p>
                        </div>
                      ); })()}
                      {az.indicators.ema200 != null && az.currentPrice != null && (() => { const b = az.currentPrice > az.indicators.ema200; return (
                        <div className={`p-2 rounded-lg border text-center ${b ? 'border-green-500/20 bg-green-500/8' : 'border-red-500/20 bg-red-500/8'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">EMA200<Hint text="The 200-period EMA is the most important long-term trend line. Price above it = overall uptrend (bullish). Price below it = overall downtrend (bearish). The best trades happen on the right side of EMA200." /></p>
                          <p className={`text-xs font-bold ${b ? 'text-green-400' : 'text-red-400'}`}>{b ? 'Above' : 'Below'}</p>
                          <p className="text-[9px] text-gray-600">${fmtV(az.indicators.ema200, 0)}</p>
                        </div>
                      ); })()}
                      {az.indicators.macd != null && (() => { const b = az.indicators.macd.histogram > 0; return (
                        <div className={`p-2 rounded-lg border text-center ${b ? 'border-green-500/20 bg-green-500/8' : 'border-red-500/20 bg-red-500/8'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">MACD<Hint text="Moving Average Convergence Divergence. A positive histogram means bullish momentum is building. Negative means bearish momentum. The number shows how strong the momentum is." /></p>
                          <p className={`text-xs font-bold ${b ? 'text-green-400' : 'text-red-400'}`}>{b ? 'Pos' : 'Neg'}</p>
                          <p className="text-[9px] text-gray-600 font-mono">{b ? '+' : ''}{Number(az.indicators.macd.histogram).toFixed(2)}</p>
                        </div>
                      ); })()}
                      {az.indicators.bb != null && az.currentPrice != null && (() => { const range = az.indicators.bb.upper - az.indicators.bb.lower; const pos = range > 0 ? (az.currentPrice - az.indicators.bb.lower) / range : 0.5; const b = pos < 0.25, bear = pos > 0.75; return (
                        <div className={`p-2 rounded-lg border text-center ${b ? 'border-green-500/20 bg-green-500/8' : bear ? 'border-red-500/20 bg-red-500/8' : 'border-white/6 bg-white/3'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">BB<Hint text="Bollinger Bands are volatility boundaries around the price. Near the lower band = price is cheap relative to recent history (bullish). Near the upper band = price is expensive (bearish). In the middle = no clear signal." /></p>
                          <p className={`text-xs font-bold ${b ? 'text-green-400' : bear ? 'text-red-400' : 'text-gray-300'}`}>{b ? 'Low' : bear ? 'High' : 'Mid'}</p>
                          <p className="text-[9px] text-gray-600">{(pos * 100).toFixed(0)}%</p>
                        </div>
                      ); })()}
                      {az.indicators.volRatio != null && (() => { const hot = az.indicators.volRatio > 1.5; return (
                        <div className={`p-2 rounded-lg border text-center ${hot ? 'border-cyan-500/20 bg-cyan-500/8' : 'border-white/6 bg-white/3'}`}>
                          <p className="text-[9px] text-gray-600 mb-0.5 flex items-center justify-center gap-0.5">Vol<Hint text="Volume Ratio compares current trading volume to the 20-period average. Above 1.5× means unusually high activity — traders are paying attention. Low volume means weak conviction behind any move." /></p>
                          <p className={`text-xs font-bold ${hot ? 'text-cyan-400' : 'text-gray-300'}`}>{az.indicators.volRatio}×</p>
                          <p className="text-[9px] text-gray-600">vs avg</p>
                        </div>
                      ); })()}
                    </div>
                  )}
                  {hasSignal && (() => {
                    const canSee = isPremium || freeCount <= FREE_AZ_LIMIT;
                    const remaining = FREE_AZ_LIMIT - freeCount;
                    return (
                      <>
                        <div data-tour="signal-result" className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Entry', short: 'Entry', icon: Target, val: az.entry, color: 'text-white', bg: 'border-cyan-500/20 bg-cyan-500/8' },
                            { label: 'Stop Loss', short: 'SL', icon: Shield, val: az.stopLoss, color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/8' },
                            { label: 'Take Profit', short: 'TP', icon: Zap, val: az.takeProfit, color: 'text-green-400', bg: 'border-green-500/20 bg-green-500/8' },
                          ].map(({ label, short, icon: Icon, val, color, bg }) => (
                            <div key={label} className={`flex flex-col gap-1 p-3 rounded-xl border ${bg}`}>
                              <div className="flex items-center gap-1.5">
                                <Icon className={`w-3 h-3 ${color}`} />
                                <span className="text-[10px] text-gray-500 font-medium">{short}:</span>
                              </div>
                              {canSee
                                ? <span className={`text-sm font-bold font-mono ${color}`}>${fmtV(val, 4)}</span>
                                : <span className="text-sm font-bold text-gray-600 blur-sm select-none">${fmtV(val, 4)}</span>}
                            </div>
                          ))}
                        </div>
                        {!isPremium && canSee && remaining > 0 && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {remaining} free signal{remaining !== 1 ? 's' : ''} remaining today
                          </p>
                        )}
                        {!isPremium && !canSee && (
                          <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex flex-col gap-1.5">
                            <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" /> Daily limit reached
                            </p>
                            <p className="text-[10px] text-gray-500">You've used your 3 free signals today. Resets at midnight.</p>
                            <Link to="/pricing" className="mt-0.5 text-[10px] font-bold text-amber-400 hover:underline">
                              Upgrade for unlimited access →
                            </Link>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Service cards ────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Platform Services
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ key, title, description, href, badge, badgeColor, gradient, border, iconBg, iconColor, Icon, cta }) => {
            const isLocked = !href;
            const card = (
              <div
                className={`
                  relative flex flex-col h-full p-5 rounded-2xl border bg-gradient-to-br
                  ${gradient} ${border}
                  transition-all duration-200
                  ${isLocked ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                {/* Badge */}
                {badge && (
                  <span className={`absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-4 ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{description}</p>

                {/* CTA */}
                {cta && (
                  <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${iconColor}`}>
                    {cta}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Lock overlay icon */}
                {isLocked && (
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-500">
                    <Lock className="w-3 h-3" />
                    Coming Soon
                  </div>
                )}
              </div>
            );

            return isLocked ? (
              <div key={key}>{card}</div>
            ) : (
              <Link key={key} to={href} className="block">
                {card}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom row: Recent signal + Top arb ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Latest AI Signal */}
        <div className="card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest AI Signal</h3>
              {/* Live pulse */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            </div>
            <Link to="/signals" className="flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300">
              All signals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {latestSignal ? (() => {
            const isLong = latestSignal.type === 'LONG';
            const conf   = Math.round((latestSignal.confidenceScore || 0) * 100);
            const confColor = conf >= 75 ? 'bg-green-500' : conf >= 60 ? 'bg-yellow-500' : 'bg-orange-500';
            const confText  = conf >= 75 ? 'text-green-400' : conf >= 60 ? 'text-yellow-400' : 'text-orange-400';
            const reasons   = latestSignal.reasons?.slice(0, 3) || [];
            const ago       = timeAgo(latestSignal.timestamp);

            return (
              <div className={`rounded-xl border overflow-hidden ${
                isLong
                  ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-600/5'
                  : 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-rose-600/5'
              }`}>
                {/* Signal header strip */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isLong ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white tracking-wide">
                      {latestSignal.pair}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {latestSignal.marketType || 'spot'} · {latestSignal.timeframe || '1h'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ago && <span className="text-[10px] text-gray-500">{ago}</span>}
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isLong
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {latestSignal.type}
                    </span>
                  </div>
                </div>

                {/* Entry / SL / TP */}
                <div className="grid grid-cols-3 gap-0 divide-x divide-white/5 px-1 py-3">
                  <div className="px-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Entry</p>
                    <p className="text-sm font-bold text-white">${fmt(latestSignal.entry, 4)}</p>
                  </div>
                  <div className="px-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Stop Loss</p>
                    <p className="text-sm font-bold text-red-400">${fmt(latestSignal.stopLoss, 4)}</p>
                  </div>
                  <div className="px-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Take Profit</p>
                    <p className="text-sm font-bold text-green-400">${fmt(latestSignal.takeProfit, 4)}</p>
                  </div>
                </div>

                {/* Confidence bar + R:R */}
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${confColor}`}
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${confText} w-14 text-right`}>
                      {conf}% conf
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    {latestSignal.riskReward != null && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-violet-400" />
                        R:R {Number(latestSignal.riskReward).toFixed(1)}
                      </span>
                    )}
                    {latestSignal.aiSource && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-violet-400" />
                        {latestSignal.aiSource}
                      </span>
                    )}
                    {typeof latestSignal.mtfAlignment === 'number' && (
                      <span>{latestSignal.mtfAlignment}/3 TF aligned</span>
                    )}
                  </div>
                </div>

                {/* Reasons */}
                {reasons.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {reasons.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-400"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Trade This button */}
                <div className="px-4 pb-4 pt-1">
                  <button
                    onClick={() => setQuickExecuteSignal({
                      pair: latestSignal.pair,
                      type: latestSignal.type,
                      entry: latestSignal.entry,
                      stopLoss: latestSignal.stopLoss,
                      takeProfit: latestSignal.takeProfit,
                      marketType: latestSignal.marketType,
                      confidenceScore: latestSignal.confidenceScore,
                    })}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isLong
                        ? 'bg-green-500 hover:bg-green-400 text-white'
                        : 'bg-orange-500 hover:bg-orange-400 text-white'
                    }`}
                  >
                    {isLong ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Trade This
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="py-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Generating signals…</p>
              <Link to="/signals" className="mt-2 inline-block text-xs text-violet-400 hover:text-violet-300">
                Open Signals →
              </Link>
            </div>
          )}
        </div>

        {/* Top Arbitrage Opportunity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Arbitrage</h3>
            </div>
            <Link to="/arbitrage" className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
              All opportunities <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {!topArb && !topTriArb ? (
            <div className="py-8 text-center">
              <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Scanning markets…</p>
              <Link to="/arbitrage" className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300">
                Open Arbitrage →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">

              {/* ── Cross-Exchange row ── */}
              {topArb ? (
                <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        CROSS
                      </span>
                      <p className="text-sm font-bold text-white">{topArb.symbol || topArb.coin}</p>
                      {topArb.riskLevel && (
                        <span className="text-[10px] text-gray-500">{topArb.riskLevel} risk</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-sm font-bold">{fmt(topArb.netProfitPercent ?? topArb.profitMargin)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                      {topArb.buyExchange}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                      {topArb.sellExchange}
                    </span>
                    {opportunities.length > 1 && (
                      <span className="ml-auto text-[10px] text-gray-600">+{opportunities.length - 1} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-white/8 bg-white/3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">CROSS</span>
                  <p className="text-xs text-gray-600">Scanning cross-exchange markets…</p>
                </div>
              )}

              {/* ── Triangular row ── */}
              {topTriArb ? (
                <div className="p-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        TRI
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                        {(topTriArb.path || []).map((asset, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className={i === 0 ? 'text-cyan-300 font-bold' : ''}>{asset}</span>
                            {i < (topTriArb.path?.length ?? 0) - 1 && (
                              <ArrowRightLeft className="w-2.5 h-2.5 text-gray-600 rotate-90" />
                            )}
                          </span>
                        ))}
                        <ArrowRightLeft className="w-2.5 h-2.5 text-gray-600 rotate-90" />
                        <span className="text-cyan-300 font-bold">{topTriArb.path?.[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-sm font-bold">{Number(topTriArb.netProfitPercent).toFixed(3)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Gate.io · 3 legs · 0.3% total fee</span>
                    {(triangular?.opportunities?.length ?? 0) > 1 && (
                      <span className="ml-auto text-[10px] text-gray-600">
                        +{triangular.opportunities.length - 1} more
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-white/8 bg-white/3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 border border-cyan-500/15">TRI</span>
                  <p className="text-xs text-gray-600">Scanning triangular paths…</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Active bots summary ──────────────────────────────────── */}
      {bots.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Bots</h3>
            </div>
            <Link to="/bots" className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300">
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {bots.slice(0, 4).map((bot) => (
              <Link
                key={bot._id}
                to={`/bots/${bot._id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-brandDark-900 border border-gray-200 dark:border-brandDark-700 hover:border-cyan-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    bot.status === 'running' ? 'bg-green-500 animate-pulse' :
                    bot.status === 'error'   ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{bot.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{bot.status} · {bot.exchange}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${
                    (bot.stats?.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(bot.stats?.totalPnL || 0) >= 0 ? '+' : ''}${fmt(bot.stats?.totalPnL || 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">P&L</p>
                </div>
              </Link>
            ))}
            {bots.length > 4 && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                +{bots.length - 4} more bots
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Execute Modal */}
      {quickExecuteSignal && (
        <QuickExecuteModal
          signal={quickExecuteSignal}
          onClose={() => setQuickExecuteSignal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
