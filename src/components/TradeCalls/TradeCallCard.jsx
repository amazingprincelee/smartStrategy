import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp, TrendingDown, Target, ShieldAlert, CheckCircle2, XCircle, Clock, BarChart2 } from 'lucide-react';

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
  if (s < 60)         return `${s}s ago`;
  if (s < 3600)       return `${Math.floor(s/60)}m ago`;
  if (s < 86400)      return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS = {
  open:     { label: 'Active',   icon: Clock,         color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  tp1_hit:  { label: 'TP1 Hit',  icon: Target,        color: 'text-cyan-400',   bg: 'bg-cyan-500/15 border-cyan-500/30' },
  win:      { label: 'WIN',      icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/15 border-emerald-500/30' },
  loss:     { label: 'LOSS',     icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30' },
  cancelled:{ label: 'Cancelled',icon: XCircle,       color: 'text-gray-400',   bg: 'bg-gray-500/15 border-gray-500/30' },
};

// ── Main Card ──────────────────────────────────────────────────────────────────

export default function TradeCallCard({ call, compact = false }) {
  const livePrices = useSelector(s => s.tradeCalls?.livePrices || {});
  const livePrice  = livePrices[call.pair] ?? null;
  const status     = STATUS[call.status] || STATUS.open;
  const StatusIcon = status.icon;
  const isLong     = call.direction === 'long';
  const isOpen     = call.status === 'open' || call.status === 'tp1_hit';

  // Flash ring when call resolves in real-time while the card is visible
  const [justResolved, setJustResolved] = useState(false);
  const prevStatusRef = useRef(call.status);
  useEffect(() => {
    if (prevStatusRef.current !== call.status && (call.status === 'win' || call.status === 'loss')) {
      setJustResolved(true);
      const t = setTimeout(() => setJustResolved(false), 2500);
      prevStatusRef.current = call.status;
      return () => clearTimeout(t);
    }
    prevStatusRef.current = call.status;
  }, [call.status]);

  // Profit % if live price available
  const livePnlPct = livePrice ? pctDiff(call.entryPrice, livePrice) : null;
  const isInProfit = livePnlPct !== null && (isLong ? parseFloat(livePnlPct) > 0 : parseFloat(livePnlPct) < 0);

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-500 ${
      call.status === 'win'  ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-gray-900' :
      call.status === 'loss' ? 'border-red-500/30 bg-gradient-to-br from-red-950/40 to-gray-900' :
      isLong                 ? 'border-green-500/20 bg-gradient-to-br from-green-950/30 to-gray-900' :
                               'border-red-500/20 bg-gradient-to-br from-red-950/30 to-gray-900'
    } ${justResolved
      ? call.status === 'win'
        ? 'ring-2 ring-emerald-400/70 ring-offset-1 ring-offset-gray-900'
        : 'ring-2 ring-red-400/70 ring-offset-1 ring-offset-gray-900'
      : ''
    }`}>

      {/* Direction accent bar */}
      <div className={`h-0.5 w-full ${
        call.status === 'win'  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' :
        call.status === 'loss' ? 'bg-gradient-to-r from-red-600 to-rose-500' :
        isLong                 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                 'bg-gradient-to-r from-red-500 to-orange-400'
      }`} />

      <div className={compact ? 'p-3' : 'p-4'}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{call.pair.replace('USDT','')}<span className="text-gray-500 font-normal text-xs">/USDT</span></span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
              isLong
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {call.direction.toUpperCase()}
            </span>
          </div>

          {/* Status badge */}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* ── Price levels ── */}
        <div className="space-y-1.5 mb-3">
          {/* Entry */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 w-14">Entry</span>
            <span className="text-white font-medium">${fmt(call.entryPrice)}</span>
            <span className="w-16" />
          </div>

          {/* TP1 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 w-14 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-500" /> TP1
            </span>
            <span className={`font-medium ${call.tp1Hit ? 'text-emerald-400 line-through opacity-60' : 'text-emerald-400'}`}>
              ${fmt(call.tp1)}
            </span>
            <span className={`text-[10px] w-16 text-right ${call.tp1Hit ? 'text-emerald-400' : 'text-gray-600'}`}>
              {call.tp1Hit ? '✓ Hit' : pctDiff(call.entryPrice, call.tp1) !== null ? `+${pctDiff(call.entryPrice, call.tp1)}%` : ''}
            </span>
          </div>

          {/* TP2 (if exists) */}
          {call.tp2 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 w-14 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" /> TP2
              </span>
              <span className={`font-medium ${call.tp2Hit ? 'text-emerald-400 line-through opacity-60' : 'text-blue-400'}`}>
                ${fmt(call.tp2)}
              </span>
              <span className={`text-[10px] w-16 text-right ${call.tp2Hit ? 'text-emerald-400' : 'text-gray-600'}`}>
                {call.tp2Hit ? '✓ Hit' : pctDiff(call.entryPrice, call.tp2) !== null ? `+${pctDiff(call.entryPrice, call.tp2)}%` : ''}
              </span>
            </div>
          )}

          {/* SL */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 w-14 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-500" /> SL
            </span>
            <span className="text-red-400 font-medium">${fmt(call.stopLoss)}</span>
            <span className="text-[10px] text-gray-600 w-16 text-right">
              {pctDiff(call.entryPrice, call.stopLoss) !== null ? `${pctDiff(call.entryPrice, call.stopLoss)}%` : ''}
            </span>
          </div>
        </div>

        {/* ── Price bar: live when open, closing price when resolved ── */}
        {isOpen ? (
          livePrice ? (
            <div className={`flex items-center justify-between py-2 px-3 rounded-xl mb-3 text-xs border ${
              isInProfit
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <span className="text-gray-400">Live Price</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">${fmt(livePrice)}</span>
                <span className={isInProfit ? 'text-emerald-400' : 'text-red-400'}>
                  {isInProfit ? '+' : ''}{livePnlPct}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1.5 px-3 rounded-xl mb-3 text-xs border border-white/5 bg-white/2">
              <span className="text-gray-600">Live Price</span>
              <span className="text-gray-700 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-600 animate-pulse" />
                Fetching…
              </span>
            </div>
          )
        ) : call.closingPrice ? (
          <div className={`flex items-center justify-between py-2 px-3 rounded-xl mb-3 text-xs border ${
            call.status === 'win'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <span className="text-gray-400">Closed at</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">${fmt(call.closingPrice)}</span>
              <span className={`font-bold ${call.status === 'win' ? 'text-emerald-400' : 'text-red-400'}`}>
                {call.status === 'win' ? '✓ Win' : '✗ Loss'}
              </span>
            </div>
          </div>
        ) : null}

        {/* ── R/R + footer ── */}
        <div className="flex items-center justify-between text-xs">
          {call.riskReward ? (
            <div className="flex items-center gap-1 text-gray-400">
              <BarChart2 className="w-3 h-3" />
              <span>R/R <span className="text-white font-medium">1:{call.riskReward}</span></span>
            </div>
          ) : <span />}
          <span className="text-gray-600">{timeAgo(call.openedAt)}</span>
        </div>

        {/* ── Notes ── */}
        {!compact && call.notes && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-gray-400 leading-relaxed">{call.notes}</p>
          </div>
        )}

        {/* ── Loss disclaimer (only for open calls) ── */}
        {!compact && isOpen && (
          <p className="mt-2 text-[10px] text-gray-600">
            Loss is triggered when price hits the stop loss level
          </p>
        )}
      </div>
    </div>
  );
}
