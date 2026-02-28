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
import { fetchPlatformStats } from '../redux/slices/signalSlice';
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
  const { opportunities } = useSelector((s) => s.arbitrage || { opportunities: [] });

  useEffect(() => {
    dispatch(fetchPlatformStats());
    dispatch(fetchArbitrageOpportunities({ minProfit: 0.1, minVolume: 100, topCoins: 10 }));
  }, [dispatch]);

  /* derived */
  const firstName    = user?.profile?.firstName || user?.email?.split('@')[0] || 'Trader';
  const activeBots   = bots.filter((b) => b.status === 'running').length;
  const totalPnL     = bots.reduce((s, b) => s + (b.stats?.totalPnL || 0), 0);
  const latestSignal = spotSignals[0] || null;
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
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest AI Signal</h3>
            </div>
            <Link to="/signals" className="flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300">
              All signals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {latestSignal ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-brandDark-900 border border-gray-200 dark:border-brandDark-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{latestSignal.pair}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  latestSignal.type === 'LONG'
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {latestSignal.type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Entry</p>
                  <p className="font-semibold text-gray-900 dark:text-white">${fmt(latestSignal.entry)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Stop Loss</p>
                  <p className="font-semibold text-red-400">${fmt(latestSignal.stopLoss)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Take Profit</p>
                  <p className="font-semibold text-green-400">${fmt(latestSignal.takeProfit)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-brandDark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${Math.round((latestSignal.confidenceScore || 0) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round((latestSignal.confidenceScore || 0) * 100)}% conf
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No signals yet</p>
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
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{topArb.coin}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{topArb.coinName}</p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-sm font-bold">{fmt(topArb.profitMargin)}%</span>
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
              {opportunities.length > 1 && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
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
