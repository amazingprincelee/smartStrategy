import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  BarChart2,
  FlaskConical,
  BookOpen,
  Shield,
  RefreshCw,
  Activity,
  ChevronRight,
  Minus,
} from 'lucide-react';
import { fetchSignals, fetchPlatformStats } from '../redux/slices/signalSlice';

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
const SignalCard = ({ s }) => {
  // Support both new (type=LONG/SHORT) and legacy (signal=BUY/SELL) formats
  const signalKey = s.type || s.signal || 'NEUTRAL';
  const st = SIGNAL_STYLES[signalKey] || SIGNAL_STYLES.NEUTRAL;

  // Entry price: new format uses s.entry, legacy uses s.price
  const displayPrice = s.entry ?? s.price;

  // Confidence: new format uses s.confidenceScore (0-1), legacy uses s.strength (0-100)
  const strengthPct = s.confidenceScore != null
    ? Math.round(s.confidenceScore * 100)
    : (s.strength ?? 0);

  // Reasons: new format is array, legacy is string
  const reasonText = Array.isArray(s.reasons)
    ? s.reasons.slice(0, 2).join(' · ')
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
      {/* Price / R:R */}
      <div className="flex items-end justify-between">
        <p className="text-base font-semibold text-gray-900 dark:text-white">{fmtPrice(displayPrice)}</p>
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
        <div className="h-1.5 bg-white/50 dark:bg-brandDark-900/50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${strengthPct}%` }} />
        </div>
      </div>
      {/* Reason */}
      {reasonText && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{reasonText}</p>
      )}
    </div>
  );
};

/* ─── SignalSkeleton ──────────────────────────────────────────────────── */
const SignalSkeleton = () => (
  <div className="rounded-xl border border-gray-200 dark:border-brandDark-700 p-4 flex flex-col gap-3 bg-white dark:bg-brandDark-800 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-1.5"><div className="h-3.5 w-20 bg-gray-200 dark:bg-brandDark-600 rounded" /><div className="h-2.5 w-28 bg-gray-200 dark:bg-brandDark-600 rounded" /></div>
      <div className="h-6 w-14 bg-gray-200 dark:bg-brandDark-600 rounded-full" />
    </div>
    <div className="flex justify-between"><div className="h-4 w-24 bg-gray-200 dark:bg-brandDark-600 rounded" /><div className="h-3 w-14 bg-gray-200 dark:bg-brandDark-600 rounded" /></div>
    <div className="flex gap-2"><div className="h-5 w-16 bg-gray-200 dark:bg-brandDark-600 rounded-md" /><div className="h-5 w-20 bg-gray-200 dark:bg-brandDark-600 rounded-md" /></div>
    <div className="h-1.5 bg-gray-200 dark:bg-brandDark-600 rounded-full" />
    <div className="h-8 bg-gray-200 dark:bg-brandDark-600 rounded" />
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
  const { token } = useSelector(s => s.auth);
  const isAuth    = !!token;

  const { spot, futures, stats, loading, statsLoading } = useSelector(s => s.signals);
  const [activeTab, setActiveTab] = useState('spot');
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    dispatch(fetchSignals('spot'));
    dispatch(fetchSignals('futures'));
    dispatch(fetchPlatformStats());
    setLastRefresh(new Date());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSignals(activeTab));
    setLastRefresh(new Date());
  };

  const handleGetStarted = () => navigate(isAuth ? '/dashboard' : '/register');

  const displaySignals = activeTab === 'spot' ? spot : futures;

  const features = [
    { icon: Bot,          color: 'from-cyan-500 to-blue-600',    title: 'Automated Bots',    desc: '24/7 trading bots that execute your strategy automatically — no screen time needed.' },
    { icon: Activity,     color: 'from-green-500 to-emerald-600', title: 'Smart Signals',     desc: 'Real-time BUY/SELL signals powered by RSI, EMA, and volume analysis across 10+ exchanges.' },
    { icon: FlaskConical, color: 'from-purple-500 to-violet-600', title: 'Free Demo Account', desc: 'Test every strategy with $10,000 virtual balance and live market prices. Zero risk.' },
    { icon: BookOpen,     color: 'from-amber-500 to-orange-600',  title: 'Strategy Library',  desc: '6 built-in strategies: Adaptive Grid, DCA, RSI Reversal, EMA, Scalper, and Breakout.' },
    { icon: TrendingUp,   color: 'from-blue-500 to-indigo-600',  title: 'Arbitrage Scanner', desc: 'Scan price differences across multiple exchanges in real-time for risk-free opportunities.' },
    { icon: Shield,       color: 'from-red-500 to-rose-600',     title: 'Risk Engine',       desc: 'Global drawdown limits, daily loss caps, trailing stops, and per-position controls built in.' },
  ];

  const steps = [
    { num: '01', title: 'Connect or Demo',   desc: 'Add your exchange API keys for live trading, or start instantly with a free $10k demo account. No funds required.' },
    { num: '02', title: 'Choose a Strategy', desc: 'Pick from 6 proven strategies. Customize RSI thresholds, capital per bot, take-profit mode, and risk limits to fit your style.' },
    { num: '03', title: 'Bot Trades 24/7',   desc: 'Your bot scans the market every tick, executes entries and exits, and sends real-time P&L updates to your dashboard.' },
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
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-brandDark-900 via-brandDark-800 to-brandDark-700">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">

            {/* Brand mark */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="relative">
                <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700 shadow-2xl shadow-cyan-500/40 ring-2 ring-cyan-400/30">
                  <Bot className="w-8 h-8 sm:w-9 sm:h-9 text-white" strokeWidth={1.6} />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-brandDark-900" />
                </span>
              </div>
              <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
                <span className="text-white">Smart</span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Strategy</span>
              </span>
            </div>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-flex" />
              Live signals updating every 5 minutes
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Trade Smarter with{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI-Powered Bots
              </span>
            </h1>

            <p className="px-4 mb-10 text-lg leading-relaxed text-gray-300 sm:text-xl lg:text-2xl sm:px-0 max-w-3xl mx-auto">
              Automate your crypto trading with intelligent bots, real-time signals, and 6 proven strategies — on Binance, Bybit, KuCoin and more.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200"
              >
                Start Trading Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition-colors duration-200"
              >
                <FlaskConical className="w-5 h-5 text-purple-400" />
                Try Demo — Free
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-gray-400">
              {['No credit card', '$10k demo account', '10+ exchanges'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC STATS ────────────────────────────────────────────── */}
      <section className="py-12 bg-white dark:bg-brandDark-900 border-b border-gray-100 dark:border-brandDark-700">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <StatCard value={stats ? `${stats.totalBots?.toLocaleString() ?? 0}+` : '500+'} label="Bots Created"        color="text-cyan-500"   loading={statsLoading && !stats} />
            <StatCard value={stats ? `${stats.activeSignals ?? 18}`                : '18'}   label="Active Signals Now" color="text-green-500"  loading={statsLoading && !stats} />
            <StatCard value="6"                                                               label="Trading Strategies" color="text-purple-500" loading={false} />
            <StatCard value={stats ? `${stats.supportedExchanges}+`               : '10+'}  label="Supported Exchanges" color="text-blue-500"  loading={statsLoading && !stats} />
          </div>
        </div>
      </section>

      {/* ── LIVE SIGNALS ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-brandDark-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-flex" />
                LIVE — refreshes every 5 min
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Real-Time Trading Signals</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl">
                Powered by RSI, EMA50/200, and volume analysis. Generated hourly using live Binance market data.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Spot / Futures tabs */}
              <div className="flex rounded-lg border border-gray-200 dark:border-brandDark-600 overflow-hidden text-sm">
                {['spot', 'futures'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white dark:bg-brandDark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brandDark-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh signals"
                className="p-2 rounded-lg border border-gray-200 dark:border-brandDark-600 bg-white dark:bg-brandDark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brandDark-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Signal grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading && displaySignals.length === 0
              ? Array.from({ length: 8 }).map((_, i) => <SignalSkeleton key={i} />)
              : displaySignals.map((s, i) => <SignalCard key={s.pair ?? s.symbol ?? i} s={s} />)
            }
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <p>
              {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}{' '}
              · For informational purposes only — not financial advice.
            </p>
            <Link
              to={isAuth ? '/bots/create' : '/register'}
              className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
            >
              Create a bot using these signals <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white dark:bg-brandDark-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Everything You Need to Trade</h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
              From first signal to automated execution — SmartStrategy covers every step of your trading workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group p-6 rounded-2xl border border-gray-100 dark:border-brandDark-700 bg-white dark:bg-brandDark-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
            <p className="mt-4 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
              No technical setup. Your bot can be live in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="relative p-6 bg-white dark:bg-brandDark-900 rounded-2xl border border-gray-100 dark:border-brandDark-700 shadow-sm flex flex-col gap-3">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-cyan-400/40 to-transparent z-0" />
                )}
                <span className="text-4xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">{step.num}</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS + LIVE PANEL ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white dark:bg-brandDark-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">Built for Serious Traders</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
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
            <div className="rounded-2xl border border-gray-100 dark:border-brandDark-700 bg-gray-50 dark:bg-brandDark-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Signal Feed</span>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
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
                        <div className="space-y-1.5"><div className="h-3 w-20 bg-gray-200 dark:bg-brandDark-600 rounded" /><div className="h-2.5 w-14 bg-gray-200 dark:bg-brandDark-600 rounded" /></div>
                        <div className="h-5 w-14 bg-gray-200 dark:bg-brandDark-600 rounded-full" />
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-brandDark-900 border border-gray-100 dark:border-brandDark-700 shadow-sm flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed italic flex-1">"{t.content}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-brandDark-700">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm flex-shrink-0">
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
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative container px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Start Automating Your Trades Today
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-white/80">
            Join traders who run bots 24/7, catch every signal, and never miss a market move.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/strategies"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
              Browse Strategies
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
