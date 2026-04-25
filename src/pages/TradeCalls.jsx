import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTradeCalls, fetchTradeCallStats } from '../redux/slices/tradeCallSlice';
import TradeCallCard from '../components/TradeCalls/TradeCallCard';
import {
  Zap, Trophy, TrendingUp, TrendingDown, Target, XCircle, BarChart2,
  RefreshCw, Filter, History, Radio, LayoutGrid, List,
  CheckCircle, Clock, ShieldAlert,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = n => {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
};

const pctDiff = (a, b) => {
  if (!a || !b) return null;
  return ((b - a) / a * 100).toFixed(2);
};

const timeAgo = iso => {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const fmtDate = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS = {
  open:      { label: 'Active',    cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',     dot: 'bg-cyan-400 animate-pulse' },
  tp1_hit:   { label: 'TP1 Hit',   cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',     dot: 'bg-blue-400' },
  win:       { label: 'Win',       cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  loss:      { label: 'Loss',      cls: 'bg-red-500/15 text-red-300 border-red-500/30',        dot: 'bg-red-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30',     dot: 'bg-gray-500' },
};

// ── Win Rate Badge ─────────────────────────────────────────────────────────────

function WinRateBadge({ rate, label = 'Win Rate', sub, large = false }) {
  const r     = rate ?? 0;
  const color = r >= 70 ? 'text-emerald-400' : r >= 50 ? 'text-yellow-400' : 'text-red-400';
  const ring  = r >= 70 ? 'border-emerald-500/40' : r >= 50 ? 'border-yellow-500/40' : 'border-red-500/40';
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border bg-gray-900 dark:bg-gray-900 ${ring} ${large ? 'p-6' : 'p-4'}`}>
      <span className={`font-black leading-none ${large ? 'text-5xl' : 'text-3xl'} ${color}`}>{r}%</span>
      <span className="mt-1 text-xs font-medium text-gray-400">{label}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-0.5">{sub}</span>}
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
      <WinRateBadge rate={stats.winRate}       label="Overall Win Rate"  sub={`${stats.totalClosed ?? 0} closed calls`} />
      <WinRateBadge rate={stats.recentWinRate} label="30-Day Win Rate"   sub={`${stats.recentTotal  ?? 0} recent calls`} />
      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-2xl">
        <span className="text-2xl font-black text-emerald-400">{stats.wins ?? 0}</span>
        <span className="mt-1 text-xs text-gray-400">Wins</span>
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-2xl">
        <span className="text-2xl font-black text-red-400">{stats.losses ?? 0}</span>
        <span className="mt-1 text-xs text-gray-400">Losses</span>
      </div>
    </div>
  );
}

// ── Filter pills ───────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',      label: 'All',      icon: Filter },
  { key: 'open',     label: 'Active',   icon: Radio },
  { key: 'tp1_hit',  label: 'TP1 Hit',  icon: Target },
  { key: 'win',      label: 'Wins',     icon: Trophy },
  { key: 'loss',     label: 'Losses',   icon: XCircle },
  { key: 'history',  label: 'History',  icon: History },
];

// ── Table Row ──────────────────────────────────────────────────────────────────

function TableRow({ call, idx }) {
  const isLong   = call.direction === 'long';
  const st       = STATUS[call.status] || STATUS.open;
  const tp1Pct   = pctDiff(call.entryPrice, call.tp1);
  const slPct    = pctDiff(call.entryPrice, call.stopLoss);
  const isHistory = ['win', 'loss', 'cancelled'].includes(call.status);

  return (
    <tr className={`border-b border-white/5 transition-colors hover:bg-white/3 ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
      {/* Pair */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
          <span className="text-sm font-bold text-white">{call.pair?.replace('USDT', '')}</span>
          <span className="text-[10px] text-gray-500">/USDT</span>
        </div>
      </td>

      {/* Direction */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
          isLong
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30'
        }`}>
          {isLong ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {call.direction?.toUpperCase()}
        </span>
      </td>

      {/* Entry */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs font-mono text-gray-200">${fmt(call.entryPrice)}</span>
      </td>

      {/* TP1 */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div>
          <span className={`text-xs font-mono ${call.tp1Hit ? 'text-emerald-400' : 'text-emerald-500'}`}>${fmt(call.tp1)}</span>
          {tp1Pct && <span className="text-[10px] text-gray-600 ml-1">+{tp1Pct}%</span>}
        </div>
      </td>

      {/* SL */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div>
          <span className="text-xs font-mono text-red-400">${fmt(call.stopLoss)}</span>
          {slPct && <span className="text-[10px] text-gray-600 ml-1">{slPct}%</span>}
        </div>
      </td>

      {/* R/R */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-amber-400 font-medium">
          {call.riskReward ? `1:${Number(call.riskReward).toFixed(2)}` : '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
          {st.label}
        </span>
      </td>

      {/* Outcome % (history only) */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isHistory && call.status !== 'cancelled' ? (
          <span className={`text-xs font-bold ${call.status === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
            {call.status === 'win'
              ? tp1Pct ? `+${tp1Pct}%` : 'Win'
              : slPct  ? `${slPct}%`   : 'Loss'}
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        )}
      </td>

      {/* Posted */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-[11px] text-gray-500">
          <div>{fmtDate(call.openedAt)}</div>
          <div className="text-gray-700">{timeAgo(call.openedAt)}</div>
        </div>
      </td>
    </tr>
  );
}

// ── Table View ─────────────────────────────────────────────────────────────────

function TableView({ calls }) {
  if (!calls.length) return (
    <div className="py-20 text-center">
      <BarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-700" />
      <p className="text-gray-500">No calls to display</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8">
      <table className="w-full text-left min-w-[700px]">
        <thead>
          <tr className="border-b border-white/8 bg-white/3">
            {['Pair', 'Direction', 'Entry', 'TP1', 'SL', 'R/R', 'Status', 'Outcome', 'Posted'].map(h => (
              <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calls.map((call, i) => <TableRow key={call._id} call={call} idx={i} />)}
        </tbody>
      </table>
    </div>
  );
}

// ── History Section Header ─────────────────────────────────────────────────────

function HistoryHeader({ calls }) {
  const wins   = calls.filter(c => c.status === 'win').length;
  const losses = calls.filter(c => c.status === 'loss').length;
  const total  = wins + losses;
  const rate   = total ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 p-4 rounded-2xl border border-white/8 bg-white/3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">Closed Call History</span>
      </div>
      <div className="flex items-center gap-4 sm:ml-auto text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-semibold">{wins} wins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-red-400 font-semibold">{losses} losses</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
          <span className={`font-bold text-xs ${rate >= 60 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {rate}% win rate
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TradeCalls() {
  const dispatch = useDispatch();
  const { calls, stats, loading, error } = useSelector(s => s.tradeCalls);

  const [filter,   setFilter]   = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  useEffect(() => {
    dispatch(fetchTradeCallStats());
    dispatch(fetchTradeCalls({
      status: filter === 'history' || filter === 'all' ? undefined : filter,
      limit: 50,
    }));
  }, [dispatch, filter]);

  const displayCalls = filter === 'history'
    ? calls.filter(c => ['win', 'loss', 'cancelled'].includes(c.status))
    : calls;

  const isHistory = filter === 'history';

  return (
    <div className="min-h-screen text-white bg-gray-950 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="px-4 py-6 border-b border-gray-800 sm:px-6">
        <div className="flex flex-col max-w-6xl gap-3 mx-auto sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Trade Calls</h1>
              {stats?.open > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {stats.open} Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Real analyst trade calls, auto-tracked against live market prices
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-800 border border-gray-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-gray-700 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-gray-700 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            <button
              onClick={() => { dispatch(fetchTradeCallStats()); dispatch(fetchTradeCalls({ limit: 50 })); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors disabled:opacity-50 border border-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl px-4 py-6 mx-auto sm:px-6">

        {/* ── Stats ── */}
        <StatsBar stats={stats} />

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === key
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 border-transparent hover:border-gray-700'
              }`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 mb-5 text-sm text-red-300 border bg-red-900/30 border-red-500/30 rounded-xl">{error}</div>
        )}

        {/* ── History header (when history filter active) ── */}
        {isHistory && displayCalls.length > 0 && (
          <HistoryHeader calls={displayCalls} />
        )}

        {/* ── Content ── */}
        {loading && !calls.length ? (
          <div className={viewMode === 'table' ? 'space-y-2' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayCalls.length === 0 ? (
          <div className="py-20 text-center">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500">No trade calls found</p>
            <p className="mt-1 text-sm text-gray-600">
              {isHistory ? 'No closed calls yet — check back as calls resolve.' : 'Check back soon — new calls are posted regularly.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <TableView calls={displayCalls} />
        ) : (
          <div className={`grid gap-4 ${
            isHistory
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {displayCalls.map(call => (
              <TradeCallCard key={call._id} call={call} />
            ))}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <p className="mt-10 text-xs text-center text-gray-700">
          Trade calls are analyst opinions, not financial advice. Always manage your own risk.
          Loss is declared when price hits the stop loss level.
        </p>
      </div>
    </div>
  );
}
