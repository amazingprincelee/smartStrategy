import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTradeCalls, fetchTradeCallStats } from '../redux/slices/tradeCallSlice';
import TradeCallCard from '../components/TradeCalls/TradeCallCard';
import {
  Zap, Trophy, TrendingUp, Target, XCircle, BarChart2,
  RefreshCw, Filter, History, Radio,
} from 'lucide-react';

// ── Win Rate Badge ─────────────────────────────────────────────────────────────

function WinRateBadge({ rate, label = 'Win Rate', sub, large = false }) {
  const color = rate >= 70 ? 'text-emerald-400' : rate >= 50 ? 'text-yellow-400' : 'text-red-400';
  const ring  = rate >= 70 ? 'border-emerald-500/40' : rate >= 50 ? 'border-yellow-500/40' : 'border-red-500/40';
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border bg-gray-900 ${ring} ${large ? 'p-6' : 'p-4'}`}>
      <span className={`font-black leading-none ${large ? 'text-5xl' : 'text-3xl'} ${color}`}>{rate}%</span>
      <span className="mt-1 text-xs font-medium text-gray-400">{label}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-0.5">{sub}</span>}
    </div>
  );
}

// ── Stats row ──────────────────────────────────────────────────────────────────

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
      <WinRateBadge rate={stats.winRate} label="Overall Win Rate" sub={`${stats.totalClosed} closed calls`} />
      <WinRateBadge rate={stats.recentWinRate} label="30-Day Win Rate" sub={`${stats.recentTotal} recent calls`} />
      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-2xl">
        <span className="text-2xl font-black text-emerald-400">{stats.wins}</span>
        <span className="mt-1 text-xs text-gray-400">Wins</span>
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-2xl">
        <span className="text-2xl font-black text-red-400">{stats.losses}</span>
        <span className="mt-1 text-xs text-gray-400">Losses</span>
      </div>
    </div>
  );
}

// ── Filter pills ───────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',      label: 'All',        icon: Filter },
  { key: 'open',     label: 'Active',     icon: Radio },
  { key: 'tp1_hit',  label: 'TP1 Hit',    icon: Target },
  { key: 'win',      label: 'Wins',       icon: Trophy },
  { key: 'loss',     label: 'Losses',     icon: XCircle },
  { key: 'history',  label: 'History',    icon: History, isHistory: true },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TradeCalls() {
  
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { calls, total, stats, loading, error } = useSelector(s => s.tradeCalls);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchTradeCallStats());
    dispatch(fetchTradeCalls({ status: filter === 'history' ? undefined : filter === 'all' ? undefined : filter }));
  }, [dispatch, filter]);

  const displayCalls = filter === 'history'
    ? calls.filter(c => ['win', 'loss', 'cancelled'].includes(c.status))
    : calls;

  return (
    <div className="min-h-screen text-white bg-gray-950">
      {/* ── Header ── */}
      <div className="px-4 py-6 border-b border-gray-800 sm:px-6">
        <div className="flex flex-col max-w-6xl gap-3 mx-auto sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Trade Calls</h1>
              {stats?.open > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {stats.open} Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Real analyst trade calls, auto-tracked against live market prices
            </p>
          </div>

          <button
            onClick={() => { dispatch(fetchTradeCallStats()); dispatch(fetchTradeCalls()); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200 border-transparent'
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

        {/* ── Grid ── */}
        {loading && !calls.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayCalls.length === 0 ? (
          <div className="py-20 text-center">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500">No trade calls found</p>
            <p className="mt-1 text-sm text-gray-600">Check back soon — new calls are posted daily</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayCalls.map(call => (
              <TradeCallCard key={call._id} call={call} />
            ))}
          </div>
        )}

        {/* ── Disclaimer ── */}
        <p className="mt-8 text-xs text-center text-gray-700">
          Trade calls are analyst opinions, not financial advice. Always manage your own risk.
          Loss is declared when price hits the stop loss level.
        </p>
      </div>
    </div>
  );
}
