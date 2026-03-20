import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, TrendingUp, ArrowRight, Clock, Lock, Crown, AlertCircle, Activity } from 'lucide-react';
import { fetchTriangularOpportunities } from '../../redux/slices/arbitrageslice';

const fmt2 = (n) => (n == null ? '—' : Number(n).toFixed(3));
const fmt4 = (n) => (n == null ? '—' : Number(n).toFixed(4));

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/* ── Path visualiser: USDT → BTC → ETH → USDT ── */
function PathFlow({ path, pairs, directions, prices, gated }) {
  if (!path || path.length < 3) return null;

  return (
    <div className="flex items-center flex-wrap gap-1 text-xs">
      {path.map((asset, i) => (
        <React.Fragment key={i}>
          {/* Asset bubble */}
          <span className={`px-2 py-0.5 rounded-full font-bold ${
            i === 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-brandDark-700 text-gray-200'
          }`}>
            {gated && i > 0 ? '???' : asset}
          </span>

          {/* Arrow + pair info */}
          {i < path.length - 1 && (
            <div className="flex flex-col items-center">
              <ArrowRight className="w-3 h-3 text-gray-500" />
              {!gated && pairs?.[i] && (
                <span className="text-[9px] text-gray-600 leading-none">{pairs[i]}</span>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
      {/* Close the loop back to start */}
      <div className="flex flex-col items-center">
        <ArrowRight className="w-3 h-3 text-gray-500" />
      </div>
      <span className="px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
        {path[0]}
      </span>
    </div>
  );
}

/* ── Single opportunity card ── */
function OpportunityCard({ opp, isPremium }) {
  const gated   = opp.gated || !isPremium;
  const profit  = opp.netProfitPercent;
  const color   = profit >= 0.5
    ? 'text-green-400 border-green-500/20 bg-green-500/5'
    : profit >= 0.2
    ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
    : 'text-gray-400 border-white/8 bg-white/3';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${color}`}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {opp.exchange ?? 'Gate.io'} · Triangular
            </span>
            {profit >= 0.5 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">HIGH</span>
            )}
          </div>
          <PathFlow
            path={opp.path}
            pairs={opp.pairs}
            directions={opp.directions}
            prices={opp.prices}
            gated={gated}
          />
        </div>

        {/* Profit badge */}
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-xs text-gray-500">Net profit</p>
          <p className={`text-xl font-extrabold ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit > 0 ? '+' : ''}{fmt2(profit)}%
          </p>
          <p className="text-[10px] text-gray-600">
            Gross: {fmt2(opp.grossProfitPercent)}%
          </p>
        </div>
      </div>

      {/* Steps grid — premium only */}
      {!gated ? (
        <div className="grid grid-cols-3 gap-2">
          {opp.pairs?.map((pair, i) => (
            <div key={i} className="p-2 rounded-xl bg-black/20 border border-white/6 text-center">
              <p className="text-[9px] text-gray-500 mb-0.5">Step {i + 1}</p>
              <p className="text-[10px] font-semibold text-gray-300">{pair}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${opp.directions?.[i] === 'buy' ? 'text-green-400' : 'text-orange-400'}`}>
                {opp.directions?.[i]?.toUpperCase()}
              </p>
              <p className="text-[10px] text-gray-500 font-mono">
                {opp.prices?.[`step${i + 1}`] != null ? fmt4(opp.prices[`step${i + 1}`]) : '—'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/6">
          <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <p className="text-xs text-gray-500">Upgrade to Premium to see pair details and prices</p>
        </div>
      )}

      {/* Simulation result */}
      {!gated && opp.endCapital != null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/20 border border-white/6 text-xs">
          <span className="text-gray-500">$1,000 simulation</span>
          <span className="font-semibold text-white">${opp.endCapital?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} end</span>
          <span className={profit > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
            {profit > 0 ? '+' : ''}${((opp.endCapital - 1000)).toFixed(2)}
          </span>
        </div>
      )}

      {opp.lastSeenAt && (
        <p className="text-[10px] text-gray-600 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Detected {timeAgo(opp.lastSeenAt ?? opp.firstDetectedAt)}
        </p>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function TriangularArbitrage() {
  const dispatch = useDispatch();
  const { triangular } = useSelector(s => s.arbitrage);
  const role     = useSelector(s => s.auth?.user?.role ?? 'user');
  const isPremium = role === 'premium' || role === 'admin';

  useEffect(() => {
    dispatch(fetchTriangularOpportunities());
    const interval = setInterval(() => dispatch(fetchTriangularOpportunities()), 120_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const { opportunities = [], loading, lastScan, isScanning, gated } = triangular;

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Triangular Arbitrage
            <span className="text-[10px] text-gray-500 font-normal">Gate.io · single exchange</span>
          </h2>
          {lastScan && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              Last scan: {timeAgo(lastScan)} · 0.1% fee per leg (3 legs total)
            </p>
          )}
        </div>
        <button
          onClick={() => dispatch(fetchTriangularOpportunities())}
          disabled={loading || isScanning}
          className="p-1.5 rounded-lg border border-white/10 bg-white/4 text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* How it works banner */}
      <div className="p-3 rounded-xl border border-brandDark-600 bg-brandDark-800 text-xs text-gray-400">
        <span className="font-semibold text-gray-300">How it works: </span>
        Start with USDT, trade through 3 pairs on the same exchange, end back in USDT with more than you started.
        Fees: 0.1% × 3 legs = 0.3% total deducted. Only net-positive paths are shown.
      </div>

      {/* Premium gate notice */}
      {gated && !isPremium && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-yellow-500/25 bg-yellow-500/8">
          <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-300">
            Showing {opportunities.length} of all opportunities. Upgrade to Premium for full pair details and prices.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && opportunities.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-4 h-28 animate-pulse" />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && opportunities.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">No triangular opportunities found right now</p>
          <p className="text-xs text-gray-600 max-w-xs">
            Opportunities appear when price imbalances between 3 pairs create a profitable cycle.
            The scanner runs every 2 minutes across 30 triangle paths.
          </p>
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <OpportunityCard key={i} opp={opp} isPremium={isPremium} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-600 text-center pt-2">
        For educational purposes only. Real execution requires low-latency infrastructure. Prices shown are indicative.
      </p>
    </div>
  );
}
