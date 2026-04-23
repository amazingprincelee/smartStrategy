import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  Star,
  BarChart2,
  Rocket,
  BookOpen,
  Shield,
  RefreshCw,
  Activity,
  Minus,
  Lock,
  Crown,
  Search,
  Target,
  Zap,
  MinusCircle,
  XCircle,
  Info,
  Radio,
  Trophy,
  Clock,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { fetchSignals, fetchPlatformStats, analyzeSignal, clearAnalysis, fetchAvailablePairs } from '../redux/slices/signalSlice';
import { fetchTradeCalls, fetchTradeCallStats } from '../redux/slices/tradeCallSlice';
import SmartStrategyIcon from '../components/Logo/SmartStrategyIcon';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const fmtPrice = (p) => {
  if (!p && p !== 0) return '—';
  if (p >= 1000)  return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1)     return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
};

const fmtChange = (c) => {
  const sign = c >= 0 ? '+' : '';
  return `${sign}${c?.toFixed(2)}%`;
};

const SIGNAL_STYLES = {
  LONG:  { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700/50', dot: 'bg-green-500', bar: 'bg-green-500', label: 'LONG',  Icon: TrendingUp  },
  SHORT: { bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-300',     border: 'border-red-200 dark:border-red-700/50',   dot: 'bg-red-500',   bar: 'bg-red-500',   label: 'SHORT', Icon: TrendingDown },
  // Legacy signal format fallbacks
  BUY:     { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700/50', dot: 'bg-green-500', bar: 'bg-green-500', label: 'LONG',  Icon: TrendingUp  },
  SELL:    { bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-300',     border: 'border-red-200 dark:border-red-700/50',   dot: 'bg-red-500',   bar: 'bg-red-500',   label: 'SHORT', Icon: TrendingDown },
  NEUTRAL: { bg: 'bg-gray-50 dark:bg-brandDark-700', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-200 dark:border-brandDark-600', dot: 'bg-gray-400', bar: 'bg-gray-400', label: 'HOLD',  Icon: Minus },
};

/* ─── SignalCard ──────────────────────────────────────────────────────── */
const SignalCard = ({ s, isPremium = false }) => {
  const navigate = useNavigate();
  // Support both new (type=LONG/SHORT) and legacy (signal=BUY/SELL) formats
  const signalKey = s.type || s.signal || 'NEUTRAL';
  const st = SIGNAL_STYLES[signalKey] || SIGNAL_STYLES.NEUTRAL;

  // Entry price: new format uses s.entry, legacy uses s.price
  const displayPrice = s.entry ?? s.price;

  // Confidence: new format uses s.confidenceScore (0-1), legacy uses s.strength (0-100)
  const strengthPct = s.confidenceScore != null
    ? Math.round(s.confidenceScore * 100)
    : (s.strength ?? 0);

  // Reasons: premium sees 2, free sees 1
  const reasonText = Array.isArray(s.reasons)
    ? s.reasons.slice(0, isPremium ? 2 : 1).join(' · ')
    : (s.reason ?? '');

  // Display pair/symbol
  const displaySymbol = (s.pair ?? s.symbol ?? '').replace('/USDT', '').replace('USDT', '') + '/USDT';

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${st.bg} ${st.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{displaySymbol}</p>
          <p className="text-xs text-gray-400">{s.exchange ?? 'Binance'} · {s.timeframe ?? '1h'}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.text} ${st.bg} ${st.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Entry Price / R:R — blurred for free users */}
      <div className="flex items-end justify-between">
        {isPremium ? (
          <p className="text-base font-semibold text-gray-900 dark:text-white">{fmtPrice(displayPrice)}</p>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className="text-base font-semibold text-gray-900 select-none dark:text-white blur-sm">
              {fmtPrice(displayPrice)}
            </p>
            <Lock className="flex-shrink-0 w-3 h-3 text-amber-500" />
          </div>
        )}
        {s.riskReward != null ? (
          <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">R:R {Number(s.riskReward).toFixed(1)}</span>
        ) : s.change24h != null ? (
          <p className={`text-xs font-medium ${s.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {fmtChange(s.change24h)} 24h
          </p>
        ) : null}
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">AI Confidence</span>
          <span className={`text-xs font-bold ${st.text}`}>{strengthPct}%</span>
        </div>
        <div className="h-1.5 bg-white/50 dark:bg-brandDark-900 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${strengthPct}%` }} />
        </div>
      </div>

      {/* Reason */}
      {reasonText && (
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">{reasonText}</p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1 border-t border-current/10">
        {!isPremium ? (
          <div className="flex items-center gap-1.5">
            <Crown className="flex-shrink-0 w-3 h-3 text-amber-500" />
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Upgrade for exact entry &amp; SL/TP
            </span>
          </div>
        ) : (signalKey === 'LONG' || signalKey === 'SHORT') ? (
          <button
            onClick={() => navigate('/bots/create', {
              state: {
                prefill: {
                  pair: s.pair ?? s.symbol,
                  signal: signalKey,
                  entry: s.entry,
                  stopLoss: s.stopLoss,
                  takeProfit: s.takeProfit,
                  marketType: s.marketType ?? 'spot',
                }
              }
            })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 ${
              signalKey === 'LONG'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            <Zap className="w-3 h-3" />
            Trade This
          </button>
        ) : (
          <span className="text-xs text-gray-500">Neutral — no trade</span>
        )}
      </div>
    </div>
  );
};

/* ─── SignalSkeleton ──────────────────────────────────────────────────── */
const SignalSkeleton = () => (
  <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-xl dark:border-brandDark-700 dark:bg-brandDark-800 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-1.5"><div className="h-3.5 w-20 bg-gray-200 dark:bg-brandDark-600 rounded" /><div className="h-2.5 w-28 bg-gray-200 dark:bg-brandDark-600 rounded" /></div>
      <div className="h-6 bg-gray-200 rounded-full w-14 dark:bg-brandDark-600" />
    </div>
    <div className="flex justify-between"><div className="w-24 h-4 bg-gray-200 rounded dark:bg-brandDark-600" /><div className="h-3 bg-gray-200 rounded w-14 dark:bg-brandDark-600" /></div>
    <div className="flex gap-2"><div className="w-16 h-5 bg-gray-200 rounded-md dark:bg-brandDark-600" /><div className="w-20 h-5 bg-gray-200 rounded-md dark:bg-brandDark-600" /></div>
    <div className="h-1.5 bg-gray-200 dark:bg-brandDark-600 rounded-full" />
    <div className="h-8 bg-gray-200 rounded dark:bg-brandDark-600" />
  </div>
);

/* ─── StatCard ────────────────────────────────────────────────────────── */
const StatCard = ({ value, label, color = 'text-cyan-500', loading }) => (
  <div className="text-center">
    <div className={`mb-1 text-3xl sm:text-4xl font-extrabold ${loading ? 'text-gray-300 dark:text-brandDark-600 animate-pulse' : color}`}>
      {loading ? '—' : value}
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

/* ─── Home ────────────────────────────────────────────────────────────── */
const Home = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token, user } = useSelector(s => s.auth);
  const isAuth    = !!token;
  const isPremium = isAuth && (user?.role === 'premium' || user?.role === 'admin');

  // Redirect authenticated users straight to the dashboard
  useEffect(() => {
    if (isAuth) navigate('/dashboard', { replace: true });
  }, [isAuth, navigate]);

  const { spot, futures, stats, loading, statsLoading, analysis, analysisLoading, analysisError, availablePairs } = useSelector(s => s.signals);
  const { calls: tradeCalls, stats: tradeCallStats, loading: tradeCallsLoading } = useSelector(s => s.tradeCalls);
  const recentCalls   = tradeCalls.slice(0, 8);
  const featuredCall  = tradeCalls.find(c => c.status === 'open' || c.status === 'tp1_hit') || null;
  const [activeTab, setActiveTab] = useState('spot');
  const [lastRefresh, setLastRefresh] = useState(null);

  const POPULAR_CHIPS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT'];
  const [azForm, setAzForm]   = useState({ symbol: '', timeframe: '1h', marketType: 'spot' });
  const [azQuery, setAzQuery] = useState('');

  const filteredPairs = azQuery.length >= 2
    ? (availablePairs || []).filter(p => p.replace('USDT','').startsWith(azQuery.toUpperCase()) || p.startsWith(azQuery.toUpperCase())).slice(0, 8)
    : [];

  const selectPairHome = (pair) => {
    setAzForm(f => ({ ...f, symbol: pair }));
    setAzQuery('');
  };

  useEffect(() => {
    dispatch(fetchTradeCalls({ limit: 10 }));
    dispatch(fetchTradeCallStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
    dispatch(fetchAvailablePairs('spot'));
    setLastRefresh(new Date());

    // Poll every 5 min as REST fallback (WebSocket sweep is the primary real-time source)
    const timer = setInterval(() => {
      dispatch(fetchSignals('spot'));
      dispatch(fetchSignals('futures'));
      setLastRefresh(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSignals(activeTab));
    setLastRefresh(new Date());
  };

  const handleGetStarted = () => navigate(isAuth ? '/dashboard' : '/register');
  const handleLogin      = () => navigate(isAuth ? '/dashboard' : '/login');

  const displaySignals  = activeTab === 'spot' ? spot : futures;
  const previewSignals  = displaySignals.slice(0, 4);
  const hasMore         = displaySignals.length > 4;

  const handleViewMore  = () => navigate(isAuth ? '/signals' : '/login');

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!isAuth) { navigate('/login'); return; }
    dispatch(analyzeSignal({ symbol: azForm.symbol, timeframe: azForm.timeframe, marketType: azForm.marketType }));
  };

  const features = [
    { icon: Activity,     color: 'from-green-500 to-emerald-600', title: 'AI Trading Signals',      desc: 'Real-time LONG/SHORT signals across 30+ pairs — powered by RSI, EMA, MACD, Bollinger Bands, ATR and volume. Exact entry, stop-loss, and take-profit every time.' },
    { icon: Zap,          color: 'from-cyan-500 to-blue-600',    title: 'One-Click Execution',     desc: 'See a signal you like? Hit Trade This and the order is placed instantly on your connected exchange — entry, SL, and TP pre-filled from the signal.' },
    { icon: TrendingUp,   color: 'from-blue-500 to-indigo-600',  title: 'Arbitrage Scanner',       desc: 'Scans price gaps across 8 exchanges in real-time. Transfer status shows whether you can actually move the coin before you commit capital.' },
    { icon: TrendingUp,   color: 'from-orange-500 to-red-600',   title: 'Trade4Me Investing',      desc: 'Deposit funds and earn up to 20% APY managed by our team. Daily earnings, 30-day lock on principal, manual withdrawals.' },
    { icon: Bot,          color: 'from-purple-500 to-violet-600', title: 'Automated Bots',         desc: '24/7 trading bots that execute your strategy automatically across 6 proven strategies — DCA, Grid, RSI Reversal, EMA, Scalper, and AI Signal.' },
    { icon: Shield,       color: 'from-red-500 to-rose-600',     title: 'Built-in Risk Engine',    desc: 'ATR-based stop-loss, global drawdown limits, daily loss caps, and liquidation checks built into every signal and bot trade.' },
  ];

  const steps = [
    { num: '01', title: 'AI Scans the Market',  desc: 'Every 30 minutes, our engine analyzes 30+ pairs across 6 indicators — RSI, EMA, MACD, Bollinger Bands, ATR, and volume. When ≥3 agree, a signal fires.' },
    { num: '02', title: 'Review the Signal',    desc: 'See the exact entry, stop-loss, and take-profit. Full indicator breakdown shows you why the signal fired — not just what to do, but why.' },
    { num: '03', title: 'Execute in One Click', desc: 'Like the setup? Hit Trade This — your connected exchange receives the order instantly, with SL and TP pre-filled. Or let a bot monitor and execute 24/7.' },
  ];

  const testimonials = [
    { name: 'Alex Kim',     role: 'Full-stack Developer', rating: 5, content: 'The Adaptive Grid bot caught multiple dips while I was at work. Up 18% on SOL in 3 weeks with the demo before going live.' },
    { name: 'Maria Santos', role: 'Freelance Trader',     rating: 5, content: 'Signal quality is impressive — the RSI + EMA combo caught a BTC breakout I would have totally missed.' },
    { name: 'David Okafor', role: 'Software Engineer',    rating: 5, content: 'DCA bot on ETH ran for 2 months without me touching it. SmartStrategy is exactly what I was looking for.' },
  ];

  const benefits = [
    'No coding knowledge required',
    'Live signals for spot and futures',
    '6 battle-tested trading strategies',
    'Global drawdown + daily loss protection',
    'Free demo with real market prices',
    'Supports Binance, Bybit, KuCoin & more',
  ];

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative py-16 overflow-hidden sm:py-24 lg:py-32 bg-gradient-to-br from-brandDark-900 via-brandDark-800 to-brandDark-700">
        <div className="absolute top-0 rounded-full pointer-events-none left-1/4 w-96 h-96 bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 rounded-full pointer-events-none right-1/4 w-96 h-96 bg-blue-600/10 blur-3xl" />

        <div className="container relative px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">

            {/* Brand mark */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="relative flex-shrink-0">
                <SmartStrategyIcon size={56} />
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-brandDark-900" />
                </span>
              </div>
              <span className="text-3xl font-black leading-none tracking-tight sm:text-4xl">
                <span className="text-white">Smart</span>
                <span className="text-transparent bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text">Strategy</span>
              </span>
            </div>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 bg-green-400 rounded-full" />
              </span>
              LIVE — Crypto Currency Trading Signal
              {lastRefresh && (
                <span className="text-xs text-cyan-600">
                  · updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              AI finds the trade.{' '}
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
                You pull the trigger.
              </span>
            </h1>

            <p className="max-w-3xl px-4 mx-auto mb-10 text-lg leading-relaxed text-gray-300 sm:text-xl lg:text-2xl sm:px-0">
              Real-time signals across 30+ pairs — with exact entry, stop-loss, and take-profit. Like a signal? Execute it instantly on your exchange with one click.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => navigate(isAuth ? '/signals' : '/login')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200"
              >
                View Live Signals
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition-colors duration-200"
              >
                <Rocket className="w-5 h-5 text-purple-400" />
                Get Started — Free
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap justify-center mt-8 text-sm text-gray-400 gap-x-6 gap-y-2">
              {['No credit card', '30+ pairs analyzed', 'One-click execution'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC STATS ────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100 dark:bg-brandDark-900 dark:border-brandDark-700">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <StatCard value={stats ? `${stats.totalBots?.toLocaleString() ?? 0}+`  : '–'}    label="Bots Created"         color="text-cyan-500"   loading={statsLoading && !stats} />
            <StatCard value={stats ? `${stats.activeSignals ?? 0}`                 : '–'}    label="Signals Today"        color="text-green-500"  loading={statsLoading && !stats} />
            <StatCard value={stats ? `${stats.activeInvestors ?? 0}`               : '–'}    label="Active Investors"     color="text-purple-500" loading={statsLoading && !stats} />
            <StatCard value={stats ? `${stats.supportedExchanges}+`                : '10+'}  label="Supported Exchanges"  color="text-blue-500"   loading={statsLoading && !stats} />
          </div>
        </div>
      </section>

      {/* ── VERIFIED TRACK RECORD ────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 overflow-hidden bg-gray-950">
        {/* Subtle background glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-green-500/4 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative px-4 mx-auto sm:px-6 lg:px-8">

          {/* ── Section Header ── */}
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 text-xs font-bold rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-70 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500" />
              </span>
              EXPERT ANALYST CALLS — VERIFIED
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Every Call is Posted<br />
              <span className="text-transparent bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text">Before the Move.</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Entry, stop-loss, and take-profit are locked in before the market moves.
              The market decides the outcome — we show you <span className="text-white font-semibold">every trade, wins and losses.</span>
            </p>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              {
                value: tradeCallsLoading ? '—' : `${tradeCallStats?.winRate ?? 0}%`,
                label: 'Overall Win Rate',
                sub: `${(tradeCallStats?.wins ?? 0) + (tradeCallStats?.losses ?? 0)} closed calls`,
                color: (tradeCallStats?.winRate ?? 0) >= 60 ? 'text-emerald-400' :
                       (tradeCallStats?.winRate ?? 0) >= 40 ? 'text-yellow-400' : 'text-red-400',
                border: (tradeCallStats?.winRate ?? 0) >= 60 ? 'border-emerald-500/20' :
                        (tradeCallStats?.winRate ?? 0) >= 40 ? 'border-yellow-500/20' : 'border-red-500/20',
              },
              {
                value: tradeCallsLoading ? '—' : `${tradeCallStats?.recentWinRate ?? 0}%`,
                label: '30-Day Win Rate',
                sub: `${tradeCallStats?.recentTotal ?? 0} recent calls`,
                color: 'text-cyan-400',
                border: 'border-cyan-500/20',
              },
              {
                value: tradeCallsLoading ? '—' : tradeCallStats?.wins ?? 0,
                label: 'Winning Calls',
                sub: 'Verified by market',
                color: 'text-emerald-400',
                border: 'border-emerald-500/20',
              },
              {
                value: tradeCallsLoading ? '—' : tradeCallStats?.open ?? 0,
                label: 'Active Now',
                sub: 'Track them live',
                color: 'text-blue-400',
                border: 'border-blue-500/20',
                pulse: true,
              },
            ].map(({ value, label, sub, color, border, pulse }) => (
              <div key={label} className={`rounded-2xl border bg-white/3 backdrop-blur-sm p-5 text-center ${border}`}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  {pulse && (
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex w-2 h-2 rounded-full bg-blue-400" />
                    </span>
                  )}
                  <span className={`text-4xl sm:text-5xl font-black leading-none ${color} ${tradeCallsLoading ? 'animate-pulse' : ''}`}>
                    {value}
                  </span>
                </div>
                <p className="text-sm text-white font-medium mt-2">{label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Featured Live Call ── */}
          {featuredCall && (() => {
            const isLong = featuredCall.direction === 'long';
            const tp1Pct = featuredCall.entryPrice && featuredCall.tp1
              ? ((featuredCall.tp1 - featuredCall.entryPrice) / featuredCall.entryPrice * 100).toFixed(2)
              : null;
            const slPct = featuredCall.entryPrice && featuredCall.stopLoss
              ? ((featuredCall.stopLoss - featuredCall.entryPrice) / featuredCall.entryPrice * 100).toFixed(2)
              : null;
            const postedDate = featuredCall.openedAt
              ? new Date(featuredCall.openedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div className="max-w-4xl mx-auto mb-10">
                <div className={`relative rounded-2xl overflow-hidden border ${isLong ? 'border-green-500/30' : 'border-red-500/30'}`}>
                  {/* Accent top bar */}
                  <div className={`h-[3px] w-full ${isLong ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`} />

                  <div className={`${isLong ? 'bg-gradient-to-br from-green-950/30 to-gray-950' : 'bg-gradient-to-br from-red-950/30 to-gray-950'} p-5`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/40 bg-blue-500/15 text-blue-400">
                          <span className="relative flex w-1.5 h-1.5">
                            <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-blue-400" />
                          </span>
                          TRACKING NOW
                        </span>
                        <span className="text-xl font-black text-white">
                          {featuredCall.pair.replace('USDT', '')}
                          <span className="text-gray-500 text-base font-normal">/USDT</span>
                        </span>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isLong ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}>
                          {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {featuredCall.direction.toUpperCase()}
                        </span>
                      </div>
                      {postedDate && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Posted {postedDate}
                        </div>
                      )}
                    </div>

                    {/* Price levels */}
                    <div className={`grid gap-3 mb-5 ${featuredCall.tp2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                      {[
                        { label: 'Entry Price', val: featuredCall.entryPrice, color: 'text-white',       bg: 'bg-white/4 border-white/10',            pct: null },
                        { label: 'Take Profit', val: featuredCall.tp1,        color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', pct: tp1Pct },
                        ...(featuredCall.tp2 ? [{ label: 'TP2', val: featuredCall.tp2, color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/20', pct: featuredCall.entryPrice && featuredCall.tp2 ? ((featuredCall.tp2 - featuredCall.entryPrice) / featuredCall.entryPrice * 100).toFixed(2) : null }] : []),
                        { label: 'Stop Loss',   val: featuredCall.stopLoss,   color: 'text-red-400',     bg: 'bg-red-500/8 border-red-500/20',         pct: slPct  },
                      ].map(({ label, val, color, bg, pct }) => (
                        <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                          <p className={`text-base font-bold font-mono ${color}`}>
                            ${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </p>
                          {pct != null && (
                            <p className={`text-[11px] mt-0.5 font-medium ${parseFloat(pct) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {parseFloat(pct) > 0 ? '+' : ''}{pct}%
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Notes + proof strip */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="flex-1">
                        {featuredCall.notes && (
                          <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-amber-500/40 pl-3 line-clamp-2">
                            {featuredCall.notes}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3" />
                          Call timestamp is permanent — posted before this market move
                        </p>
                      </div>
                      <button
                        onClick={handleGetStarted}
                        className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                          isLong
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/20'
                            : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-500/20'
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        Get Alert for Next Call
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Full Scorecard Table ── */}
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/8 overflow-hidden">

              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 bg-white/3 border-b border-white/8">
                <div>
                  <span className="text-sm font-bold text-white">Full Scorecard</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    We don't hide losses — that's what makes this credible
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Win
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Loss
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Live
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider border-b border-white/6 text-gray-600">
                      <th className="px-5 py-3 font-semibold text-left">Pair</th>
                      <th className="px-4 py-3 font-semibold text-left">Dir</th>
                      <th className="px-4 py-3 font-semibold text-right">Entry</th>
                      <th className="hidden px-4 py-3 font-semibold text-right sm:table-cell">TP1</th>
                      <th className="hidden px-4 py-3 font-semibold text-right sm:table-cell">Stop Loss</th>
                      <th className="hidden px-4 py-3 font-semibold text-right md:table-cell">Posted</th>
                      <th className="px-4 py-3 font-semibold text-center">Outcome</th>
                      <th className="hidden px-4 py-3 font-semibold text-right sm:table-cell">+/−</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeCallsLoading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i} className="border-b border-white/4 animate-pulse">
                          <td className="px-5 py-3.5"><div className="h-4 rounded w-20 bg-white/6" /></td>
                          <td className="px-4 py-3.5"><div className="h-5 rounded-full w-14 bg-white/6" /></td>
                          <td className="px-4 py-3.5 text-right"><div className="h-4 ml-auto rounded w-16 bg-white/6" /></td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell"><div className="h-4 ml-auto rounded w-16 bg-white/6" /></td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell"><div className="h-4 ml-auto rounded w-16 bg-white/6" /></td>
                          <td className="hidden px-4 py-3.5 text-right md:table-cell"><div className="h-4 ml-auto rounded w-20 bg-white/6" /></td>
                          <td className="px-4 py-3.5 text-center"><div className="mx-auto rounded-full h-5 w-16 bg-white/6" /></td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell"><div className="h-4 ml-auto rounded w-12 bg-white/6" /></td>
                        </tr>
                      ))
                    ) : recentCalls.length > 0 ? recentCalls.map((call, idx) => {
                      const isWin  = call.status === 'win';
                      const isLoss = call.status === 'loss';
                      const isOpen = call.status === 'open' || call.status === 'tp1_hit';
                      const isLong = call.direction === 'long';
                      const rowBg  = isWin ? 'bg-emerald-500/4 hover:bg-emerald-500/8' :
                                     isLoss ? 'bg-red-500/4 hover:bg-red-500/8' :
                                     isOpen ? 'bg-blue-500/3 hover:bg-blue-500/6' : 'hover:bg-white/3';
                      const gainPct = call.entryPrice && call.tp1
                        ? ((call.tp1 - call.entryPrice) / call.entryPrice * 100)
                        : null;
                      const lossPct = call.entryPrice && call.stopLoss
                        ? ((call.stopLoss - call.entryPrice) / call.entryPrice * 100)
                        : null;
                      const displayPct = isWin ? gainPct : isLoss ? lossPct : null;

                      return (
                        <tr key={call._id} className={`border-b border-white/4 transition-colors last:border-0 ${rowBg}`}>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-white">
                              {call.pair.replace('USDT', '')}<span className="text-gray-600 font-normal text-xs">/USDT</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                              isLong
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                : 'bg-red-500/15 text-red-400 border-red-500/25'
                            }`}>
                              {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {call.direction?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-mono text-gray-300">
                              ${call.entryPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell">
                            <span className="text-sm font-mono text-emerald-400">
                              ${call.tp1?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell">
                            <span className="text-sm font-mono text-red-400">
                              ${call.stopLoss?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3.5 text-right md:table-cell">
                            <span className="text-xs text-gray-600">
                              {call.openedAt
                                ? new Date(call.openedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isOpen ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                call.status === 'tp1_hit'
                                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
                                  : 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                              }`}>
                                <span className="w-1 h-1 rounded-full bg-current animate-ping inline-flex" />
                                {call.status === 'tp1_hit' ? 'TP1 Hit' : 'Live'}
                              </span>
                            ) : isWin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                                <CheckCircle2 className="w-3 h-3" /> WIN
                              </span>
                            ) : isLoss ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-500/15 text-red-400 border-red-500/25">
                                <XCircle className="w-3 h-3" /> LOSS
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-3.5 text-right sm:table-cell">
                            {displayPct != null ? (
                              <span className={`text-sm font-bold font-mono ${displayPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {displayPct >= 0 ? '+' : ''}{displayPct.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">tracking</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-14 text-center">
                          <Radio className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                          <p className="text-sm text-gray-500">First calls launching soon — bookmark this page</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trust note + CTA */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-5 px-1">
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-600 flex items-center justify-center sm:justify-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  All call timestamps are immutable — posted before any market move
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  Full history, live price tracking &amp; real-time alerts after sign-up
                </p>
              </div>
              <button
                onClick={handleGetStarted}
                className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-200"
              >
                <Radio className="w-4 h-4" />
                Get Free Alerts
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white sm:py-20 dark:bg-brandDark-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Everything You Need to Trade</h2>
            <p className="max-w-2xl mx-auto mt-4 text-gray-600 dark:text-gray-400">
              From first signal to automated execution — SmartStrategy covers every step of your trading workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 transition-all duration-300 bg-white border border-gray-100 group rounded-2xl dark:border-brandDark-700 dark:bg-brandDark-800 hover:shadow-xl hover:-translate-y-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} mb-4 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-brandDark-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Up and Running in 3 Steps</h2>
            <p className="max-w-xl mx-auto mt-4 text-gray-600 dark:text-gray-400">
              No technical setup. Your bot can be live in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col gap-3 p-6 bg-white border border-gray-100 shadow-sm dark:bg-brandDark-900 rounded-2xl dark:border-brandDark-700">
                {i < steps.length - 1 && (
                  <div className="absolute z-0 hidden w-full h-px lg:block top-10 left-full bg-gradient-to-r from-cyan-400/40 to-transparent" />
                )}
                <span className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text">{step.num}</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS + LIVE PANEL ────────────────────────────────────── */}
      <section className="py-16 bg-white sm:py-20 dark:bg-brandDark-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Built for Serious Traders</h2>
              <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                Every feature was designed around real trading needs — not just pretty dashboards.
              </p>
              <div className="grid gap-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live snapshot panel */}
            <div className="p-6 border border-gray-100 rounded-2xl dark:border-brandDark-700 bg-gray-50 dark:bg-brandDark-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Signal Feed</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-flex" />
                  LIVE
                </span>
              </div>
              <div className="space-y-2.5">
                {(spot.length > 0 ? spot.slice(0, 5) : Array(5).fill(null)).map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg bg-white dark:bg-brandDark-700 border border-gray-100 dark:border-brandDark-600 ${!s ? 'animate-pulse' : ''}`}>
                    {s ? (
                      <>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {(s.pair ?? s.symbol ?? '').replace('/USDT','').replace('USDT','')}/USDT
                          </p>
                          <p className="text-xs text-gray-500">{fmtPrice(s.entry ?? s.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.confidenceScore != null && (
                            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                              {Math.round(s.confidenceScore * 100)}%
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            (s.type ?? s.signal) === 'LONG'  || (s.type ?? s.signal) === 'BUY'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : (s.type ?? s.signal) === 'SHORT' || (s.type ?? s.signal) === 'SELL'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-brandDark-600 dark:text-gray-300'
                          }`}>
                            {s.type ?? (s.signal === 'NEUTRAL' ? 'HOLD' : s.signal)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5"><div className="w-20 h-3 bg-gray-200 rounded dark:bg-brandDark-600" /><div className="h-2.5 w-14 bg-gray-200 dark:bg-brandDark-600 rounded" /></div>
                        <div className="h-5 bg-gray-200 rounded-full w-14 dark:bg-brandDark-600" />
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 mt-4 text-sm font-semibold text-white transition-opacity rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90"
              >
                Get Full Access — Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-brandDark-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">What Our Traders Say</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Real results from users who automated their trading with SmartStrategy.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-2xl dark:bg-brandDark-900 dark:border-brandDark-700">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="flex-1 text-sm italic leading-relaxed text-gray-600 dark:text-gray-400">"{t.content}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-brandDark-700">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden border-t bg-gray-950 dark:bg-brandDark-900 border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-indigo-900/20" />
        <div className="absolute top-0 right-0 rounded-full w-72 h-72 bg-cyan-500/5 blur-3xl" />
        <div className="container relative px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            The signal is ready.{' '}
            <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">Are you?</span>
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-400">
            Join traders who never miss an entry — AI finds the setup, you pull the trigger.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate(isAuth ? '/signals' : '/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-200"
            >
              View Live Signals <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/signals"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-gray-300 font-semibold text-base hover:bg-white/5 transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
              View All Signals
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-8 border-t bg-gray-950 border-white/5">
        <div className="container flex flex-col items-center justify-between gap-3 px-4 mx-auto text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SmartStrategy. Not financial advice — trade at your own risk.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-gray-300">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-gray-300">Terms of Service</Link>
            <a href="mailto:princeleepraise@gmail.com" className="transition-colors hover:text-gray-300">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
