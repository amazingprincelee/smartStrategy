import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bot, PlusCircle, TrendingUp, TrendingDown, Play, Square,
  FlaskConical, BookOpen, Loader, AlertCircle, Activity,
  Crown, Zap, Lock, CheckCircle, ArrowRight, ShieldCheck, Trash2,
} from 'lucide-react';
import { fetchBots, startBot, stopBot, deleteBot } from '../redux/slices/botSlice';

const STRATEGY_LABELS = {
  smart_signal:  'SmartSignal Bot',
  swing_rider:   'Swing Rider',
  ai_signal:     'SmartSignal Bot',   // legacy alias for old bots
  dca:           'Simple DCA',
  // kept for backwards-compat display of old bots
  adaptive_grid: 'Adaptive Grid',
  rsi_reversal:  'RSI Reversal',
  ema_crossover: 'EMA Crossover',
  scalper:       'ATR Scalper',
  breakout:      'N-Day Breakout',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_COLORS = {
  running: 'bg-green-500',
  stopped: 'bg-gray-400',
  paused: 'bg-yellow-500',
  error: 'bg-red-500',
};

const BotCard = ({ bot, onStart, onStop, onDelete, loading }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const realizedPnl   = bot.stats?.totalPnL ?? 0;
  const unrealizedPnl = bot.unrealizedPnL ?? 0;
  const pnl        = realizedPnl + unrealizedPnl;
  const allocated  = bot.capitalAllocation?.totalCapital ?? 0;
  const pnlPct     = allocated > 0 ? (pnl / allocated) * 100 : 0;
  const isPositive = pnl >= 0;
  const currency = bot.capitalAllocation?.currency || 'USDT';
  const currentCapital = bot.stats?.currentCapital ?? allocated;

  return (
    <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[bot.status] || 'bg-gray-400'}`} />
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{bot.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {bot.isDemo && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
              Demo
            </span>
          )}
          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-brandDark-700 dark:text-gray-300 rounded-full capitalize">
            {bot.marketType}
          </span>
          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400 font-medium">Delete?</span>
              <button
                onClick={() => { onDelete(bot._id); setConfirmDelete(false); }}
                className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-1.5 py-0.5 text-xs font-bold bg-gray-200 dark:bg-brandDark-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-brandDark-500 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete bot"
              className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Exchange / Symbol / Strategy */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
        <span className="capitalize">{bot.exchange}</span>
        <span className="text-gray-300">·</span>
        <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full font-medium">
          {STRATEGY_LABELS[bot.strategyId] || bot.strategyId}
        </span>
      </div>

      {/* Capital + Balance row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-brandDark-700 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Allocated</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            ${allocated.toLocaleString()} <span className="text-xs font-normal text-gray-400">{currency}</span>
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-brandDark-700 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Current Value</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            ${currentCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-400">{currency}</span>
          </p>
        </div>
      </div>

      {/* P&L + Stats row */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Total P&L</p>
          <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{pnl.toFixed(2)}
            <span className={`ml-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-400'}`}>
              ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </p>
          {(
            <p className="text-[10px] text-gray-500 mt-0.5">
              <span className="text-gray-600">${realizedPnl.toFixed(2)} realized</span>
              {' · '}
              <span className={unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-400'}>
                {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)} open
              </span>
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Positions</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{bot.openPositionsCount ?? 0}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Trades</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{bot.stats?.totalTrades ?? 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/bots/${bot._id}`}
          className="flex-1 text-center px-3 py-1.5 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
        >
          View Details
        </Link>
        {bot.status === 'running' ? (
          <button
            onClick={() => onStop(bot._id)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 transition-colors disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart(bot._id)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        )}
      </div>
    </div>
  );
};

const isPremiumUser = (role) => role === 'premium' || role === 'admin';

const FEATURE_BULLETS = [
  { icon: Zap,          text: 'Reads live AI signals and enters trades at the exact right moment' },
  { icon: ShieldCheck,  text: 'Auto-manages stop-loss & take-profit using ATR-based risk sizing' },
  { icon: Activity,     text: 'Runs 24/7 — catches moves even while you sleep' },
  { icon: TrendingUp,   text: 'Targets 2:1 reward-to-risk on every single trade' },
];

// A blurred mock of what a running SmartSignal bot card looks like
const MockBotCard = () => (
  <div className="relative select-none pointer-events-none">
    {/* Blur overlay */}
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/40 dark:bg-brandDark-900/60 backdrop-blur-[3px]">
      <Lock className="w-8 h-8 text-amber-500" />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Premium only</span>
    </div>
    {/* Mock card content (blurred behind overlay) */}
    <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4 opacity-60">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="font-semibold text-gray-900 dark:text-white">SmartSignal Bot</span>
        </div>
        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-brandDark-700 dark:text-gray-300 rounded-full">spot</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">BTCUSDT</span>
        <span>·</span>
        <span>binance</span>
        <span>·</span>
        <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full font-medium">SmartSignal Bot</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-brandDark-700 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Allocated</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">$500 <span className="text-xs font-normal text-gray-400">USDT</span></p>
        </div>
        <div className="bg-gray-50 dark:bg-brandDark-700 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Current Value</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">$512.00 <span className="text-xs font-normal text-gray-400">USDT</span></p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 px-0.5">
        <div>
          <p className="text-xs text-gray-400">Total P&L</p>
          <p className="text-sm font-bold text-green-600">+12.00 <span className="ml-1 text-xs font-medium text-green-500">(+2.4%)</span></p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Positions</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">2</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Trades</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">18</p>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 text-center px-3 py-1.5 text-sm border border-primary-200 rounded-lg text-primary-600">View Details</div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 border border-red-200 rounded-lg text-red-600">
          <Square className="w-3.5 h-3.5" /> Stop
        </div>
      </div>
    </div>
  </div>
);

const PremiumGate = () => (
  <div className="space-y-6">
    {/* Hero */}
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-brandDark-800 p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8">

        {/* Left: value prop */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 mb-4">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Premium Feature</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
            Let SmartSignal trade<br className="hidden sm:block" /> for you — automatically
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-md">
            Our AI-powered SmartSignal bot reads live market signals and executes trades on your connected exchange with zero manual effort.
          </p>

          <ul className="space-y-2.5 mb-6">
            {FEATURE_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="flex flex-wrap gap-4 text-center mb-6">
            {[
              { label: 'Active bots right now', value: '247' },
              { label: 'Avg monthly ROI', value: '+18.3%' },
              { label: 'Avg win rate', value: '64%' },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 min-w-[80px] bg-white/70 dark:bg-white/5 rounded-xl border border-amber-200/60 dark:border-amber-800/30 px-3 py-2.5">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-md shadow-amber-200 dark:shadow-none"
          >
            <Crown className="w-4 h-4" />
            Unlock SmartSignal Bot — Go Premium
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right: blurred mock bot card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium uppercase tracking-wider">Preview</p>
          <MockBotCard />
        </div>
      </div>
    </div>

    {/* Secondary CTA: try demo */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        to="/demo"
        className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
      >
        <FlaskConical className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Try Demo Account</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Practice with $10,000 virtual balance — no risk</p>
        </div>
      </Link>
      <Link
        to="/strategies"
        className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
      >
        <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">How SmartSignal Works</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Read about the strategy before you subscribe</p>
        </div>
      </Link>
    </div>
  </div>
);

const BotDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: bots, loading, error } = useSelector(state => state.bots);
  const demo = useSelector(state => state.demo);
  const role      = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  useEffect(() => {
    dispatch(fetchBots());
  }, [dispatch]);

  // Auto-retry once after 3 s if the initial fetch failed (handles transient server/network hiccups)
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => dispatch(fetchBots()), 3000);
    return () => clearTimeout(timer);
  }, [error, dispatch]);

  const handleRefresh = () => dispatch(fetchBots());

  const handleStart = async (id) => {
    try {
      await dispatch(startBot(id)).unwrap();
      toast.success('Bot started');
    } catch (err) {
      toast.error(err || 'Failed to start bot');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteBot(id)).unwrap();
      toast.info('Bot deleted');
      dispatch(fetchBots());
    } catch (err) {
      toast.error(err || 'Failed to delete bot');
    }
  };

  const handleStop = async (id) => {
    try {
      await dispatch(stopBot(id)).unwrap();
      toast.info('Bot stopped');
    } catch (err) {
      toast.error(err || 'Failed to stop bot');
    }
  };

  // Aggregate stats
  const totalBots = bots.length;
  const runningBots = bots.filter(b => b.status === 'running').length;
  const totalRealizedPnL   = bots.reduce((sum, b) => sum + (b.stats?.totalPnL || 0), 0);
  const totalUnrealizedPnL = bots.reduce((sum, b) => sum + (b.unrealizedPnL || 0), 0);
  const totalPnL           = totalRealizedPnL + totalUnrealizedPnL;
  const totalPositions = bots.reduce((sum, b) => sum + (b.openPositionsCount || 0), 0);
  const totalTrades = bots.reduce((sum, b) => sum + (b.stats?.totalTrades || 0), 0);
  const totalWins = bots.reduce((sum, b) => sum + (b.stats?.winningTrades || 0), 0);
  const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : 0;

  const statCards = [
    {
      label: 'Total Bots',
      value: `${runningBots} / ${totalBots}`,
      sub: 'running / total',
      icon: Bot,
      color: 'text-blue-500'
    },
    {
      label: 'Total P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`,
      sub: `$${totalRealizedPnL.toFixed(2)} realized · ${totalUnrealizedPnL >= 0 ? '+' : ''}$${totalUnrealizedPnL.toFixed(2)} open`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      label: 'Active Positions',
      value: totalPositions,
      sub: 'open right now',
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      sub: `${totalWins} / ${totalTrades} trades`,
      icon: TrendingUp,
      color: 'text-yellow-500'
    },
  ];

  // For free users — show the showcase gate, nothing else
  if (!isPremium) {
    return (
      <div className="p-4 md:p-6 space-y-5 md:space-y-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Bot Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 hidden sm:block">
            Automated trading — Premium feature
          </p>
        </div>
        <PremiumGate />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Bot Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 hidden sm:block">
            Manage your automated trading bots
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={loading.list}
            title="Refresh bots"
            className="p-2 rounded-lg border border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brandDark-700 transition-colors disabled:opacity-50"
          >
            <Loader className={`w-4 h-4 ${loading.list ? 'animate-spin text-primary-500' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/bots/create')}
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create Bot</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Bot Grid */}
      {/* Only show full-page spinner on first load (no bots in state yet).
          On subsequent visits bots are already in Redux — show them immediately
          while the background refresh runs silently. */}
      {loading.list && bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading your bots…</p>
        </div>
      ) : error && bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-brandDark-800 rounded-xl border border-red-200 dark:border-red-800/50 text-center px-6">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">Could not load bots</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
            {error} — Retrying automatically. You can also try manually.
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Loader className="w-4 h-4" />
            Retry Now
          </button>
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700">
          <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No bots yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-6">Create your first trading bot to get started</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/bots/create')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Bot
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-brandDark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 font-medium text-sm"
            >
              <FlaskConical className="w-4 h-4" />
              Try Demo
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bots.map(bot => (
              <BotCard
                key={bot._id}
                bot={bot}
                onStart={handleStart}
                onStop={handleStop}
                onDelete={handleDelete}
                loading={loading.action}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/bots/create')}
          className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-left"
        >
          <PlusCircle className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Create Bot</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set up a new automated trading bot</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/demo')}
          className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
        >
          <FlaskConical className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Demo Account</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Practice with ${demo?.virtualBalance?.toLocaleString() || '10,000'} virtual balance
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate('/strategies')}
          className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
        >
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Strategy Library</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Browse and learn about 6 strategies</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default BotDashboard;
