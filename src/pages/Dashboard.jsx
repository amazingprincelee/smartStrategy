import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bot,
  Activity,
  ArrowRightLeft,
  Lock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { fetchPlatformStats, fetchSignals, fetchSignalHistory } from '../redux/slices/signalSlice';
import { fetchArbitrageOpportunities } from '../redux/slices/arbitrageslice';

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
    key: 'options',
    title: 'Options Trading',
    description: 'Advanced options strategies with automated Greeks management. Launching soon.',
    href: null,
    badge: 'Soon',
    badgeColor: 'bg-gray-500',
    gradient: 'from-gray-500/5 to-gray-600/5',
    border: 'border-gray-600/20',
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-500',
    Icon: Lock,
    cta: null,
  },
];

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const dispatch = useDispatch();

  /* redux state */
  const user         = useSelector((s) => s.auth.user);
  const bots         = useSelector((s) => s.bots?.list || []);
  const platformStats = useSelector((s) => s.signals?.stats);
  const spotSignals  = useSelector((s) => s.signals?.spot || []);
  const history      = useSelector((s) => s.signals?.history || []);
  const { opportunities } = useSelector((s) => s.arbitrage || { opportunities: [] });

  useEffect(() => {
    dispatch(fetchPlatformStats());
    dispatch(fetchSignals('spot'));
    dispatch(fetchArbitrageOpportunities({ minProfit: 0.1, minVolume: 100, topCoins: 10 }));
    // Always pre-load history so the signal card has something to show
    // even if the live in-memory cache is cold (e.g. right after server restart)
    dispatch(fetchSignalHistory({ marketType: 'spot', limit: 10 }));
  }, [dispatch]);

  /* derived */
  const firstName    = user?.profile?.firstName || user?.email?.split('@')[0] || 'Trader';
  const activeBots   = bots.filter((b) => b.status === 'running').length;
  const totalPnL     = bots.reduce((s, b) => s + (b.stats?.totalPnL || 0), 0);
  // Live signals first; fall back to most recent DB history entry
  const latestSignal = spotSignals[0] || history[0] || null;
  const topArb       = opportunities?.[0] || null;

  /* quick-stat chips */
  const chips = [
    {
      label: 'Active Bots',
      value: activeBots,
      icon: Bot,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Bot P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${fmt(totalPnL)}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bg: totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      label: 'AI Signals',
      value: platformStats?.totalSignals ?? '—',
      icon: Zap,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Arb Opportunities',
      value: opportunities?.length ?? '—',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
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
        {chips.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-700 shadow-sm"
          >
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{String(value)}</p>
            </div>
          </div>
        ))}
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

          {topArb ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-brandDark-900 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {topArb.symbol || topArb.coin}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {topArb.riskLevel ? `${topArb.riskLevel} risk` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-sm font-bold">
                    {fmt(topArb.netProfitPercent ?? topArb.profitMargin)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-medium">
                  Buy: {topArb.buyExchange}
                </span>
                <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 font-medium">
                  Sell: {topArb.sellExchange}
                </span>
              </div>
              {topArb.expectedProfitUSD != null && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Est. profit: <span className="text-emerald-400 font-medium">${fmt(topArb.expectedProfitUSD)}</span>
                  {' · '} trade size: ${fmt(topArb.optimalTradeValueUSD, 0)}
                </p>
              )}
              {opportunities.length > 1 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  +{opportunities.length - 1} more opportunities found
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Scanning markets…</p>
              <Link to="/arbitrage" className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300">
                Open Arbitrage →
              </Link>
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

    </div>
  );
};

export default Dashboard;
