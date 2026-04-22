import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAlphaSignals } from '../redux/slices/alphaSlice';
import {
  TrendingUp, TrendingDown, Lock, Zap, RefreshCw, Crown,
  BarChart2, Clock, ChevronUp, ChevronDown,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(4)}`;
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function fmtTime(ms) {
  if (!ms || ms <= 0) return 'now';
  const m = Math.ceil(ms / 60000);
  return m < 2 ? `${Math.ceil(ms / 1000)}s` : `${m}m`;
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ signal }) {
  const isBuy     = signal.type === 'BUY';
  const confPct   = Math.round(signal.confidence * 100);

  return (
    <div className={`relative rounded-2xl overflow-hidden border ${
      isBuy
        ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-gray-900'
        : 'border-red-500/30 bg-gradient-to-br from-red-950/60 to-gray-900'
    }`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isBuy ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {signal.image ? (
              <img src={signal.image} alt={signal.symbol} className="w-10 h-10 rounded-full" onError={e => { e.target.style.display='none'; }} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                {signal.symbol.slice(0,2)}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-sm">{signal.name}</p>
              <p className="text-xs text-gray-400">{signal.symbol}</p>
            </div>
          </div>

          {/* BUY / SELL badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 ${
            isBuy
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-400 border border-red-500/40'
          }`}>
            {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {signal.type}
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-white">{fmt(signal.price)}</span>
          <div className="flex gap-3 text-xs">
            <span className={signal.priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              1h {fmtPct(signal.priceChange1h)}
            </span>
            <span className={signal.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              24h {fmtPct(signal.priceChange24h)}
            </span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Confidence</span>
            <span className={`font-bold ${confPct >= 75 ? 'text-emerald-400' : confPct >= 60 ? 'text-yellow-400' : 'text-gray-300'}`}>
              {confPct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confPct >= 75 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : confPct >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                : 'bg-gradient-to-r from-gray-500 to-gray-400'
              }`}
              style={{ width: `${confPct}%` }}
            />
          </div>
        </div>

        {/* Reason */}
        <p className="text-xs text-gray-400 leading-relaxed">{signal.reason}</p>
      </div>
    </div>
  );
}

// ── Locked placeholder card ────────────────────────────────────────────────────

function LockedCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-700/50 bg-gray-900">
      <div className="h-1 w-full bg-gray-700" />
      <div className="p-4 select-none">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
              <div className="h-2.5 w-12 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-16 h-6 bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="h-5 w-24 bg-gray-700 rounded mb-3 animate-pulse" />
        <div className="h-1.5 bg-gray-700 rounded-full mb-3 animate-pulse" />
        <div className="h-3 w-full bg-gray-700 rounded animate-pulse" />
      </div>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center">
        <Lock className="w-6 h-6 text-gray-500" />
      </div>
    </div>
  );
}

// ── Premium Gate Banner ───────────────────────────────────────────────────────

function PremiumGate({ lockedCount, onUpgrade }) {
  return (
    <div className="col-span-full mt-2">
      <div className="relative rounded-2xl overflow-hidden border border-yellow-500/30 bg-gradient-to-br from-yellow-950/40 to-gray-900 p-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/0 to-gray-900/80 pointer-events-none" />
        <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">
          {lockedCount} more signal{lockedCount !== 1 ? 's' : ''} available
        </h3>
        <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
          Upgrade to Premium to unlock all AI-generated trading opportunities with full confidence scores, reasons, and real-time updates.
        </p>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/20"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EarlyAlpha() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { signals, total, lockedCount, isPremium, generatedAt, nextRefreshMs, loading, error } =
    useSelector(s => s.alpha);

  const [filter, setFilter] = useState('ALL'); // ALL | BUY | SELL

  useEffect(() => { dispatch(fetchAlphaSignals()); }, [dispatch]);

  const filtered = signals.filter(s => filter === 'ALL' || s.type === filter);

  const buyCount  = signals.filter(s => s.type === 'BUY').length;
  const sellCount = signals.filter(s => s.type === 'SELL').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Early Alpha</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-400">
              AI-powered momentum signals generated from live market data
            </p>
          </div>

          <div className="flex items-center gap-3">
            {generatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Refreshes in {fmtTime(nextRefreshMs)}</span>
              </div>
            )}
            <button
              onClick={() => dispatch(fetchAlphaSignals())}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="max-w-6xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Signals', value: total || '—', icon: BarChart2, color: 'text-cyan-400' },
          { label: 'Buy Signals',   value: buyCount,  icon: ChevronUp,   color: 'text-emerald-400' },
          { label: 'Sell Signals',  value: sellCount, icon: ChevronDown, color: 'text-red-400' },
          { label: 'Your Access',   value: isPremium ? 'Premium' : 'Free', icon: Crown, color: isPremium ? 'text-yellow-400' : 'text-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter pills ── */}
      <div className="max-w-6xl mx-auto mb-5 flex gap-2">
        {['ALL', 'BUY', 'SELL'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? f === 'BUY'  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : f === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && signals.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Unlocked signals */}
            {filtered.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}

            {/* Locked placeholders */}
            {!isPremium && lockedCount > 0 && filter === 'ALL' && (
              <>
                {[...Array(Math.min(lockedCount, 3))].map((_, i) => (
                  <LockedCard key={`locked-${i}`} />
                ))}
                <PremiumGate lockedCount={lockedCount} onUpgrade={() => navigate('/pricing')} />
              </>
            )}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 text-gray-500">
                <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No {filter !== 'ALL' ? filter : ''} signals at the moment.</p>
                <p className="text-sm mt-1">Markets may be consolidating — check back soon.</p>
              </div>
            )}
          </div>
        )}

        {/* Premium upsell for non-premium users who filtered BUY/SELL */}
        {!isPremium && lockedCount > 0 && filter !== 'ALL' && (
          <div className="mt-6">
            <PremiumGate lockedCount={lockedCount} onUpgrade={() => navigate('/pricing')} />
          </div>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <div className="max-w-6xl mx-auto mt-8 text-xs text-gray-600 text-center px-4">
        Signals are generated algorithmically from market momentum data. Not financial advice.
        Always do your own research before trading.
      </div>
    </div>
  );
}
