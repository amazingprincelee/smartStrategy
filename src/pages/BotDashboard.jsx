import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bot, PlusCircle, TrendingUp, TrendingDown, Play, Square,
  FlaskConical, BookOpen, Loader, AlertCircle, Activity,
  Crown, Zap, Lock,
} from 'lucide-react';
import { fetchBots, startBot, stopBot } from '../redux/slices/botSlice';

const STRATEGY_LABELS = {
  adaptive_grid: 'Adaptive Grid',
  dca: 'Simple DCA',
  rsi_reversal: 'RSI Reversal',
  ema_crossover: 'EMA Crossover',
  scalper: 'ATR Scalper',
  breakout: 'N-Day Breakout',
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

const BotCard = ({ bot, onStart, onStop, loading }) => {
  const pnl = bot.stats?.totalPnL ?? 0;
  const pnlPct = bot.stats?.totalPnLPercent ?? 0;
  const isPositive = pnl >= 0;
  const allocated = bot.capitalAllocation?.totalCapital ?? 0;
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
        <div className="flex gap-1 flex-shrink-0 ml-2">
          {bot.isDemo && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
              Demo
            </span>
          )}
          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-brandDark-700 dark:text-gray-300 rounded-full capitalize">
            {bot.marketType}
          </span>
        </div>
      </div>

      {/* Exchange / Symbol / Strategy */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{bot.symbol}</span>
        <span className="text-gray-300">·</span>
        <span className="capitalize">{bot.exchange}</span>
        <span className="text-gray-300">·</span>
        <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full font-medium">
          {STRATEGY_LABELS[bot.strategyId] || bot.strategyId}
        </span>
      </div>

      {/* Capital + Balance row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-brandDark-700/60 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Allocated</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            ${allocated.toLocaleString()} <span className="text-xs font-normal text-gray-400">{currency}</span>
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-brandDark-700/60 rounded-lg p-2.5">
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

const PREMIUM_STRATEGIES = [
  { name: 'ATR Scalper',     detail: 'Fast in-and-out trades every 5 min' },
  { name: 'RSI Reversal',    detail: 'Enter at oversold / overbought extremes' },
  { name: 'EMA Crossover',   detail: 'Golden / death cross trend signals' },
  { name: 'Adaptive Grid',   detail: 'Multi-level dip-buying with RSI + volume' },
  { name: 'N-Day Breakout',  detail: 'Momentum plays on volume-confirmed breakouts' },
];

const BotDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: bots, loading } = useSelector(state => state.bots);
  const demo = useSelector(state => state.demo);
  const role      = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  useEffect(() => {
    dispatch(fetchBots());
  }, [dispatch]);

  const handleStart = async (id) => {
    try {
      await dispatch(startBot(id)).unwrap();
      toast.success('Bot started');
    } catch (err) {
      toast.error(err || 'Failed to start bot');
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
  const totalPnL = bots.reduce((sum, b) => sum + (b.stats?.totalPnL || 0), 0);
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
      sub: 'all bots combined',
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

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Bot Dashboard</h1>
            {!isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Crown className="w-3.5 h-3.5" />
                Free Tier
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 hidden sm:block">
            Manage your automated trading bots
          </p>
        </div>
        <button
          onClick={() => navigate('/bots/create')}
          className="flex items-center gap-2 px-3 py-2 md:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Create Bot</span>
        </button>
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

      {/* Free-tier upgrade banner */}
      {!isPremium && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Free plan — DCA strategy only
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                You're currently limited to the DCA bot. Upgrade to Premium to run our advanced strategies that trade more frequently and adapt to market conditions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PREMIUM_STRATEGIES.map(s => (
                  <div key={s.name} className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5 border border-amber-200/60 dark:border-amber-800/30">
                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Bot Grid */}
      {loading.list ? (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
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
