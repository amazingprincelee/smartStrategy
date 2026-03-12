import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Flame,
  TrendingUp,
  BarChart2,
  Zap,
  Star,
  Lock,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { fetchAlphaSignals, fetchAlphaStats } from '../redux/slices/alphaSlice';

/* ── helpers ──────────────────────────────────────────────────────── */
const CATEGORY_META = {
  new_listing:       { label: 'New Listing',    icon: Star,      color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  volume_spike:      { label: 'Volume Spike',   icon: BarChart2, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30'   },
  trending:          { label: 'Trending',        icon: TrendingUp,color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  whale_accumulation:{ label: 'Whale Activity', icon: Flame,     color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  social_spike:      { label: 'Social Spike',   icon: Zap,       color: 'text-pink-400',   bg: 'bg-pink-500/15',   border: 'border-pink-500/30'   },
};

const scoreColor = (s) => {
  if (s >= 80) return 'text-red-400 bg-red-500/15 border-red-500/40';
  if (s >= 65) return 'text-orange-400 bg-orange-500/15 border-orange-500/40';
  if (s >= 50) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40';
  return 'text-gray-400 bg-gray-500/15 border-gray-500/30';
};

const scoreLabel = (s) => {
  if (s >= 80) return 'HOT';
  if (s >= 65) return 'STRONG';
  if (s >= 50) return 'WATCH';
  return 'WEAK';
};

const fmt = (n, dec = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtPct = (n) => {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Number(n).toFixed(2)}%`;
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const FILTERS = ['all', 'new_listing', 'volume_spike', 'trending', 'whale_accumulation'];

/* ── Premium gate banner ──────────────────────────────────────────── */
function PremiumGate() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/15">
        <Lock className="h-7 w-7 text-yellow-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white">Premium Feature</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Unlock full alpha signal details — scores, reasons, and real-time alerts.
        </p>
      </div>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition-colors"
      >
        Upgrade to Premium <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ── Signal card ──────────────────────────────────────────────────── */
function AlphaCard({ signal, gated }) {
  const meta = CATEGORY_META[signal.category] || CATEGORY_META.trending;
  const CatIcon = meta.icon;

  if (gated) {
    return (
      <div className={`relative flex flex-col gap-3 rounded-2xl border p-5 ${meta.border} bg-gradient-to-br from-gray-800/30 to-gray-900/30`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.bg}`}>
              <CatIcon className={`h-4 w-4 ${meta.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{signal.symbol}</p>
              <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
            </div>
          </div>
          <Lock className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-500/10 px-3 py-2">
          <EyeOff className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-500">Score & details hidden — upgrade to see</span>
        </div>
        {signal.priceChange != null && (
          <p className={`text-xs font-medium ${signal.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            24h: {fmtPct(signal.priceChange)}
          </p>
        )}
        <p className="text-xs text-gray-600 dark:text-gray-500">{timeAgo(signal.discoveredAt)}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-5 ${meta.border} bg-gradient-to-br from-gray-800/20 to-gray-900/20 hover:shadow-lg transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
            <CatIcon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{signal.symbol}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{signal.name}</p>
          </div>
        </div>
        {signal.score != null && (
          <div className={`flex flex-col items-center rounded-xl border px-3 py-1.5 ${scoreColor(signal.score)}`}>
            <span className="text-[10px] font-bold leading-none">{scoreLabel(signal.score)}</span>
            <span className="text-base font-extrabold leading-tight">{signal.score}</span>
          </div>
        )}
      </div>

      {/* Category badge */}
      <span className={`self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.color}`}>
        {meta.label}
      </span>

      {/* Market data */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {signal.priceChange != null && (
          <>
            <span className="text-gray-500 dark:text-gray-400">24h Change</span>
            <span className={`font-semibold ${signal.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtPct(signal.priceChange)}
            </span>
          </>
        )}
        {signal.priceChange1h != null && (
          <>
            <span className="text-gray-500 dark:text-gray-400">1h Change</span>
            <span className={`font-semibold ${signal.priceChange1h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtPct(signal.priceChange1h)}
            </span>
          </>
        )}
        {signal.volumeChange != null && (
          <>
            <span className="text-gray-500 dark:text-gray-400">Vol/MCap</span>
            <span className="font-semibold text-blue-400">{fmt(signal.volumeChange, 0)}%</span>
          </>
        )}
        {signal.rank != null && (
          <>
            <span className="text-gray-500 dark:text-gray-400">MC Rank</span>
            <span className="font-semibold text-gray-300">#{signal.rank}</span>
          </>
        )}
      </div>

      {/* Reasons */}
      {signal.reasons?.length > 0 && (
        <ul className="space-y-1">
          {signal.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
              <span className={`mt-0.5 flex-shrink-0 h-1.5 w-1.5 rounded-full ${meta.color.replace('text-', 'bg-')}`} />
              {r}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-gray-600 dark:text-gray-500">{timeAgo(signal.discoveredAt)}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function EarlyAlpha() {
  const dispatch = useDispatch();
  const { signals, meta, stats, loading, error } = useSelector(s => s.alpha);
  const userRole     = useSelector(s => s.auth?.user?.role ?? 'user');
  const subscription = useSelector(s => s.auth?.user?.subscription);
  const [activeFilter, setActiveFilter] = useState('all');

  const isPremium = userRole === 'admin' || userRole === 'premium';

  const load = (cat) => {
    dispatch(fetchAlphaSignals({ page: 1, limit: 20, category: cat === 'all' ? undefined : cat }));
  };

  useEffect(() => {
    dispatch(fetchAlphaStats());
    load(activeFilter);
  }, []);

  const handleFilter = (cat) => {
    setActiveFilter(cat);
    load(cat);
  };

  const statChips = stats ? [
    { label: 'Active Alerts',  value: stats.total,     color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Top Score',      value: stats.topScore,  color: 'text-red-400',    bg: 'bg-red-500/10'    },
    { label: 'Top Pick',       value: stats.topSymbol || '—', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ] : [];

  return (
    <div className="space-y-8 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Early Alpha
            </h1>
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
              NEW
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            AI-powered scanner that spots new listings, volume anomalies, trending coins,
            and whale accumulation signals before they go mainstream.
          </p>
        </div>
        <button
          onClick={() => load(activeFilter)}
          className="flex items-center gap-2 self-start rounded-lg border border-gray-200 dark:border-brandDark-700 bg-white dark:bg-brandDark-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-400 mt-0.5" />
        <p className="text-xs text-yellow-300/80">
          <strong>Not financial advice.</strong> Early alpha signals are experimental and carry
          high risk. New listings and low-cap tokens can be extremely volatile and are often
          targets for pump-and-dump schemes. Always do your own research before trading.
        </p>
      </div>

      {/* ── Stats chips ────────────────────────────────────────────── */}
      {statChips.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {statChips.map(({ label, value, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-brandDark-700 bg-white dark:bg-brandDark-800 p-3 shadow-sm">
              <div className={`rounded-lg p-2 ${bg}`}>
                <Flame className={`h-4 w-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{String(value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Category filter tabs ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const meta = CATEGORY_META[f];
          const label = f === 'all' ? 'All' : (meta?.label || f);
          const active = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-brandDark-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-brandDark-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Premium gate (non-premium only) ────────────────────────── */}
      {!isPremium && <PremiumGate />}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Signals grid ───────────────────────────────────────────── */}
      {loading && signals.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-200 dark:bg-brandDark-800" />
          ))}
        </div>
      ) : signals.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-brandDark-700 py-16 text-center">
          <Eye className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No alpha signals detected yet — the scanner runs every 5 minutes.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map(sig => (
              <AlphaCard key={sig._id} signal={sig} gated={sig.gated} />
            ))}
          </div>

          {/* Gated hint row */}
          {meta.gated && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Showing {meta.visibleCount} of {meta.total} signals —{' '}
              <Link to="/pricing" className="text-orange-400 hover:underline font-medium">
                upgrade for full access
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
