import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bot,
  Activity,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ArrowUpRight,
  Radio,
  Trophy,
  CheckCircle,
  XCircle,
  Flame,
  DollarSign,
} from 'lucide-react';
import { fetchPlatformStats, fetchSignals, fetchSignalHistory, analyzeSignal, fetchAvailablePairs } from '../redux/slices/signalSlice';
import { fetchArbitrageOpportunities, fetchTriangularOpportunities } from '../redux/slices/arbitrageslice';
import { fetchTradeCalls, fetchTradeCallStats } from '../redux/slices/tradeCallSlice';
import { fetchBots } from '../redux/slices/botSlice';
import QuickExecuteModal from '../components/bots/QuickExecuteModal';
import TradeCallCard from '../components/TradeCalls/TradeCallCard';
import { isPremiumOrTrial, getTrialInfo } from '../utils/premiumUtils';

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
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};



/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* redux state */
  const user          = useSelector((s) => s.auth.user);
  const bots          = useSelector((s) => s.bots?.list || []);
  const spotSignals   = useSelector((s) => s.signals?.spot || []);
  const history       = useSelector((s) => s.signals?.history || []);
  const { opportunities, triangular } = useSelector((s) => s.arbitrage || { opportunities: [], triangular: { opportunities: [] } });
  const tradeCalls    = useSelector((s) => s.tradeCalls?.calls || []);
  const tradeStats    = useSelector((s) => s.tradeCalls?.stats || null);
  const isPremium     = isPremiumOrTrial(user);
  const trialInfo     = getTrialInfo(user);

  const [quickExecuteSignal, setQuickExecuteSignal] = useState(null);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchSignals('spot'));
    dispatch(fetchArbitrageOpportunities({ minProfit: 0.1, minVolume: 100, topCoins: 10 }));
    dispatch(fetchTriangularOpportunities());
    dispatch(fetchSignalHistory({ marketType: 'spot', limit: 5 }));
    dispatch(fetchAvailablePairs('spot'));
    dispatch(fetchTradeCalls({ limit: 5 }));
    dispatch(fetchTradeCallStats());
  }, [dispatch]);

  /* derived */
  const firstName   = user?.profile?.firstName || user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Trader';
  const activeBots  = bots.filter((b) => b.status === 'running').length;
  const totalPnL    = bots.reduce((s, b) => s + (b.stats?.totalPnL || 0), 0);

  const latestSignal = spotSignals.find(s => s.type === 'LONG') || spotSignals[0]
    || history.find(s => s.type === 'LONG') || null;

  const openCalls   = tradeCalls.filter(c => c.status === 'open' || c.status === 'tp1_hit');
  const topArb      = opportunities?.[0] || null;
  const topTriArb   = triangular?.opportunities?.[0] || null;

  const winRate     = tradeStats?.winRate  != null ? Math.round(tradeStats.winRate * 100) : null;
  const totalWins   = tradeStats?.wins     ?? 0;
  const totalLosses = tradeStats?.losses   ?? 0;
  const totalClosed = tradeStats?.total    ?? (totalWins + totalLosses);

  const winRateColor = winRate == null ? 'text-gray-400' : winRate >= 60 ? 'text-green-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="pb-10 -mt-4 space-y-6">

      {/* ── Greeting row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl">
            {greeting()}, <span className="text-amber-400">{firstName}</span>
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bots.length > 0 && (
            <Link
              to="/bots"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-cyan-500/40 transition-colors"
            >
              <Bot className="w-3 h-3 text-cyan-400" />
              {activeBots} bot{activeBots !== 1 ? 's' : ''} running
              <span className={`font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${fmt(totalPnL)}
              </span>
            </Link>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full" />
            </span>
            All systems live
          </div>
          {trialInfo.isTrial && !trialInfo.isExpired && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Flame className="w-3 h-3" />
              Trial: {trialInfo.daysLeft}d {trialInfo.hoursLeft}h left
            </span>
          )}
        </div>
      </div>

      {/* ── Trade call stats strip ── */}
      <div className="grid grid-cols-2 overflow-hidden bg-white border border-gray-100 divide-y divide-gray-100 sm:grid-cols-4 rounded-2xl dark:border-brandDark-700 dark:bg-brandDark-800 sm:divide-y-0 sm:divide-x dark:divide-brandDark-700">
        {[
          {
            label:  'Win Rate',
            value:  winRate != null ? `${winRate}%` : '—',
            color:  winRateColor,
            iconBg: winRate == null ? 'bg-gray-500/10' : winRate >= 60 ? 'bg-green-500/10' : winRate >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10',
            Icon:   Trophy,
          },
          {
            label:  'Wins',
            value:  totalWins,
            color:  'text-green-400',
            iconBg: 'bg-green-500/10',
            Icon:   CheckCircle,
          },
          {
            label:  'Losses',
            value:  totalLosses,
            color:  'text-red-400',
            iconBg: 'bg-red-500/10',
            Icon:   XCircle,
          },
          {
            label:  'Active Now',
            value:  openCalls.length,
            color:  openCalls.length > 0 ? 'text-amber-400' : 'text-gray-400',
            iconBg: openCalls.length > 0 ? 'bg-amber-500/10' : 'bg-gray-500/10',
            Icon:   Radio,
            pulse:  openCalls.length > 0,
          },
        ].map(({ label, value, color, iconBg, Icon, pulse }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${color} ${pulse ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TRADE CALLS HERO  (header + scroll strip)
      ══════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden bg-white border shadow-lg rounded-2xl border-amber-500/25 dark:bg-brandDark-800">

        {/* 3px amber accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 dark:border-brandDark-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15">
              <Radio className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Analyst Trade Calls</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-400 leading-snug">
                <span className="text-emerald-400 font-semibold">Price ≥ TP1 → WIN</span>
                <span className="mx-1.5 text-gray-600">·</span>
                <span className="text-red-400 font-semibold">Price ≤ Stop Loss → LOSS</span>
                <span className="ml-1.5 text-gray-500">— resolved automatically, 24/7</span>
              </p>
            </div>
          </div>
          <Link
            to="/trade-calls"
            className="flex items-center flex-shrink-0 gap-1 text-xs font-semibold transition-colors text-amber-500 hover:text-amber-400"
          >
            All calls <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal scroll strip */}
        <div className="px-4 pb-4">
          {openCalls.length > 0 ? (
            <>
              {/* Scrollable card row */}
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
                {openCalls.map((call) => (
                  <div key={call._id} className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start">
                    <TradeCallCard call={call} compact />
                  </div>
                ))}
                {/* Ghost card — "View All" CTA as last slide */}
                <div className="flex-shrink-0 w-[200px] snap-start flex items-center justify-center">
                  <Link
                    to="/trade-calls"
                    className="flex flex-col items-center gap-2 p-6 text-center transition-all border border-dashed rounded-2xl border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                      <ArrowUpRight className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-amber-400">View All Calls</span>
                    <span className="text-[10px] text-gray-500">Table &amp; history</span>
                  </Link>
                </div>
              </div>
              {/* Scroll hint dots */}
              {openCalls.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {openCalls.slice(0, Math.min(openCalls.length, 5)).map((_, i) => (
                    <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-4 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-white/15'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10">
                <Radio className="w-6 h-6 text-amber-500/50" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No active calls right now</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Our analyst posts calls before the move — check back soon.</p>
              <Link
                to="/trade-calls"
                className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-amber-500 hover:text-amber-400"
              >
                View call history <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Service cards (3: Analysis, Arbitrage, Trade4Me) ────── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
          Platform Services
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: 'AI Pair Analysis',
              description: 'Pick any pair and timeframe — our engine runs RSI, EMA, MACD & Bollinger Bands and returns a precise entry, stop-loss, and take-profit.',
              href: '/signals',
              badge: 'Premium',
              badgeCls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
              gradient: 'from-violet-500/8 to-purple-600/6',
              border: 'border-violet-500/20 hover:border-violet-500/50',
              iconBg: 'bg-violet-500/15',
              iconColor: 'text-violet-400',
              Icon: Activity,
              cta: 'Scan Pair',
              ctaColor: 'text-violet-400',
            },
            {
              title: 'Arbitrage',
              description: 'Scan 50+ exchanges in real time and surface cross-exchange and triangular price discrepancies before they close.',
              href: '/arbitrage',
              badge: 'Live',
              badgeCls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
              gradient: 'from-emerald-500/8 to-green-600/6',
              border: 'border-emerald-500/20 hover:border-emerald-500/50',
              iconBg: 'bg-emerald-500/15',
              iconColor: 'text-emerald-400',
              Icon: ArrowRightLeft,
              cta: 'Scan Markets',
              ctaColor: 'text-emerald-400',
            },
            {
              title: 'Trade4Me',
              description: 'Deposit and earn up to 20% APY — daily compounding, managed by our team, withdraw anytime after the lock period.',
              href: '/trade4me',
              badge: 'New',
              badgeCls: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
              gradient: 'from-orange-500/8 to-red-600/6',
              border: 'border-orange-500/20 hover:border-orange-500/50',
              iconBg: 'bg-orange-500/15',
              iconColor: 'text-orange-400',
              Icon: DollarSign,
              cta: 'Start Earning',
              ctaColor: 'text-orange-400',
            },
          ].map(({ title, description, href, badge, badgeCls, gradient, border, iconBg, iconColor, Icon, cta, ctaColor }) => (
            <Link key={title} to={href} className="block">
              <div className={`relative flex flex-col h-full p-5 rounded-2xl border bg-gradient-to-br bg-white dark:bg-brandDark-800 ${gradient} ${border} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
                {badge && (
                  <span className={`absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeCls}`}>
                    {badge}
                  </span>
                )}
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-4 ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="flex-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${ctaColor}`}>
                  {cta} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom row: Latest Signal + Top Arb ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Latest AI Signal */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest AI Signal</h3>
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full" />
              </span>
            </div>
            <Link to="/signals" className="flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300">
              All signals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {latestSignal ? (() => {
            const isLong    = latestSignal.type === 'LONG';
            const conf      = Math.round((latestSignal.confidenceScore || 0) * 100);
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
                <div className={`px-4 py-3 flex items-center justify-between ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold tracking-wide text-white">{latestSignal.pair}</span>
                    <span className="text-[10px] text-gray-400">{latestSignal.marketType || 'spot'} · {latestSignal.timeframe || '1h'}</span>
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

                <div className="grid grid-cols-3 gap-0 px-1 py-3 divide-x divide-white/5">
                  {[
                    { label: 'Entry',       val: latestSignal.entry,      color: 'text-white' },
                    { label: 'Stop Loss',   val: latestSignal.stopLoss,   color: 'text-red-400' },
                    { label: 'Take Profit', val: latestSignal.takeProfit, color: 'text-green-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="px-1 overflow-hidden text-center sm:px-3">
                      <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 truncate">{label}</p>
                      <p className={`text-[10px] sm:text-sm font-bold font-mono truncate ${color}`}>${fmt(val, 2)}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${confColor}`} style={{ width: `${conf}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${confText} w-14 text-right`}>{conf}% conf</span>
                  </div>
                  {latestSignal.riskReward != null && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Zap className="w-3 h-3 text-violet-400" />
                      R:R {Number(latestSignal.riskReward).toFixed(1)}
                    </div>
                  )}
                </div>

                {reasons.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {reasons.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-400">{r}</span>
                    ))}
                  </div>
                )}

                <div className="px-4 pt-1 pb-4">
                  <button
                    onClick={() => setQuickExecuteSignal({
                      pair: latestSignal.pair, type: latestSignal.type,
                      entry: latestSignal.entry, stopLoss: latestSignal.stopLoss,
                      takeProfit: latestSignal.takeProfit, marketType: latestSignal.marketType,
                      confidenceScore: latestSignal.confidenceScore,
                    })}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isLong ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'
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
              <Link to="/signals" className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300">Open Signals →</Link>
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
              <Link to="/arbitrage" className="inline-block mt-2 text-xs text-emerald-400 hover:text-emerald-300">Open Arbitrage →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {topArb ? (
                <div className="p-3 border rounded-xl border-emerald-500/25 bg-emerald-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CROSS</span>
                      <p className="text-sm font-bold text-white">{topArb.symbol || topArb.coin}</p>
                      {topArb.riskLevel && <span className="text-[10px] text-gray-500">{topArb.riskLevel} risk</span>}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-sm font-bold">{fmt(topArb.netProfitPercent ?? topArb.profitMargin)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">{topArb.buyExchange}</span>
                    <ArrowRightLeft className="flex-shrink-0 w-3 h-3 text-gray-500" />
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">{topArb.sellExchange}</span>
                    {opportunities.length > 1 && (
                      <span className="ml-auto text-[10px] text-gray-600">+{opportunities.length - 1} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-xl border-white/8 bg-white/3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">CROSS</span>
                  <p className="text-xs text-gray-600">Scanning cross-exchange markets…</p>
                </div>
              )}

              {topTriArb ? (
                <div className="p-3 border rounded-xl border-cyan-500/25 bg-cyan-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">TRI</span>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-300">
                        {(topTriArb.path || []).map((asset, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className={i === 0 ? 'text-cyan-300 font-bold' : ''}>{asset}</span>
                            {i < (topTriArb.path?.length ?? 0) - 1 && <ArrowRightLeft className="w-2.5 h-2.5 text-gray-600 rotate-90" />}
                          </span>
                        ))}
                        <ArrowRightLeft className="w-2.5 h-2.5 text-gray-600 rotate-90" />
                        <span className="font-bold text-cyan-300">{topTriArb.path?.[0]}</span>
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
                      <span className="ml-auto text-[10px] text-gray-600">+{triangular.opportunities.length - 1} more</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-xl border-white/8 bg-white/3">
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
                className="flex items-center justify-between p-3 transition-colors border border-gray-200 rounded-lg bg-gray-50 dark:bg-brandDark-900 dark:border-brandDark-700 hover:border-cyan-500/50"
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
                  <p className={`text-xs font-semibold ${(bot.stats?.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(bot.stats?.totalPnL || 0) >= 0 ? '+' : ''}${fmt(bot.stats?.totalPnL || 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">P&L</p>
                </div>
              </Link>
            ))}
            {bots.length > 4 && (
              <p className="pt-1 text-xs text-center text-gray-500 dark:text-gray-400">
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
