/**
 * AlphaInspector.jsx
 *
 * Slide-in drawer panel that shows deep analysis for a single alpha signal:
 *  1. Momentum since discovery (current price vs discovery price)
 *  2. What-If P&L ($1000 invested at discovery)
 *  3. Whale entry detection (1h volume vs 20-bar avg)
 *  4. Pattern-based entry score vs historical category peers
 *  5. Live entry timing recommendation
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart2,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Activity,
  Flame,
} from 'lucide-react';
import { analyzeAlphaSignal, clearAlphaAnalysis } from '../../redux/slices/alphaSlice';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n, dec = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtPct = (n) => {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Number(n).toFixed(2)}%`;
};

const fmtPrice = (n) => {
  if (n == null) return '—';
  if (n >= 1) return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  return `$${Number(n).toFixed(6)}`;
};

/* ─── Entry timing config ─────────────────────────────────────────────────── */
const TIMING_CONFIG = {
  'Strong Entry':       { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40', icon: CheckCircle,    desc: 'Multiple green candles + rising volume — momentum confirmed.' },
  'Possible Entry':     { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', icon: Target,         desc: 'Positive price momentum — consider a small position.' },
  'Wait':               { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/40',  icon: Clock,          desc: 'Mixed signals — wait for a cleaner setup.' },
  'Caution':            { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',   icon: XCircle,        desc: 'Selling pressure detected — avoid entry for now.' },
  'Insufficient Data':  { color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/30',  icon: AlertTriangle,  desc: 'Not enough candle data for this symbol.' },
};

const WHALE_CONFIG = {
  Strong:   { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', label: 'Strong Whale Activity' },
  Moderate: { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', label: 'Moderate Accumulation' },
  Elevated: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   label: 'Elevated Volume' },
  None:     { color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   label: 'No Unusual Activity' },
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-brandDark-700 bg-white dark:bg-brandDark-800 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, valueClass = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function ScoreBar({ value, max = 100, colorClass = 'bg-orange-500' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-brandDark-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-900 dark:text-white w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function AlphaInspector({ signal, onClose }) {
  const dispatch = useDispatch();
  const { analysis, analysisLoading, analysisError } = useSelector(s => s.alpha);

  useEffect(() => {
    if (signal?._id) {
      dispatch(analyzeAlphaSignal(signal._id));
    }
    return () => {
      dispatch(clearAlphaAnalysis());
    };
  }, [signal?._id]);

  if (!signal) return null;

  const timingCfg  = TIMING_CONFIG[analysis?.entryTiming?.recommendation] || TIMING_CONFIG['Insufficient Data'];
  const TimingIcon = timingCfg.icon;
  const whaleCfg   = WHALE_CONFIG[analysis?.whale?.signal || 'None'];

  const patternBarColor = analysis?.patternScore >= 70 ? 'bg-green-500' : analysis?.patternScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white dark:bg-brandDark-900 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-brandDark-700 bg-white dark:bg-brandDark-900 px-5 py-4">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{signal.symbol}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Alpha Intelligence Analysis</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-brandDark-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-5 space-y-4">

          {/* Loading */}
          {analysisLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing {signal.symbol}…</p>
            </div>
          )}

          {/* Error */}
          {analysisError && !analysisLoading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{analysisError}</p>
              <button
                onClick={() => dispatch(analyzeAlphaSignal(signal._id))}
                className="mt-2 text-xs text-red-400 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {analysis && !analysisLoading && (
            <>

              {/* ── 1. Entry Timing ───────────────────────────────────── */}
              <div className={`rounded-2xl border p-4 ${timingCfg.border} ${timingCfg.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10`}>
                    <TimingIcon className={`h-5 w-5 ${timingCfg.color}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${timingCfg.color}`}>{analysis.entryTiming.recommendation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timingCfg.desc}</p>
                  </div>
                </div>

                {analysis.entryTiming.recommendation !== 'Insufficient Data' && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/5 px-2 py-2">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Candles</p>
                      <p className="text-xs font-bold text-green-400">{analysis.entryTiming.greenCount}G</p>
                      <p className="text-xs font-bold text-red-400">{analysis.entryTiming.redCount}R</p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2 py-2">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Volume</p>
                      <p className={`text-xs font-bold capitalize ${
                        analysis.entryTiming.volumeTrend === 'increasing' ? 'text-green-400' :
                        analysis.entryTiming.volumeTrend === 'decreasing' ? 'text-red-400' : 'text-gray-400'
                      }`}>{analysis.entryTiming.volumeTrend}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2 py-2">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Streak</p>
                      <p className="text-xs font-bold text-green-400">{analysis.entryTiming.consecutiveGreen} green</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 2. Momentum since discovery ───────────────────────── */}
              <SectionCard title="Momentum Since Discovery" icon={TrendingUp}>
                {analysis.momentum ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Discovery Price</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtPrice(analysis.momentum.discoveryPrice)}</p>
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="h-0.5 bg-gray-200 dark:bg-brandDark-700 relative">
                          <div
                            className={`absolute inset-y-0 left-0 ${analysis.momentum.gainPercent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.abs(analysis.momentum.gainPercent))}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Now</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtPrice(analysis.momentum.currentPrice)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded-xl p-3 text-center ${analysis.momentum.gainPercent >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {analysis.momentum.direction === 'up'
                            ? <TrendingUp className="h-3 w-3 text-green-400" />
                            : <TrendingDown className="h-3 w-3 text-red-400" />}
                        </div>
                        <p className={`text-lg font-extrabold ${analysis.momentum.gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(analysis.momentum.gainPercent)}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">since discovery</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-brandDark-700 p-3 text-center">
                        <DollarSign className="h-3 w-3 text-gray-400 mx-auto mb-0.5" />
                        <p className={`text-lg font-extrabold ${analysis.momentum.whatIfPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {analysis.momentum.whatIfPnl >= 0 ? '+' : ''}{fmt(analysis.momentum.whatIfPnl, 0)}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">if $1k entered</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <StatRow
                        label="Hours since discovery"
                        value={`${analysis.momentum.hoursElapsed}h`}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Price data unavailable — {signal.symbol} may not be listed on tracked exchanges yet.
                  </p>
                )}
              </SectionCard>

              {/* ── 3. Whale Detection ────────────────────────────────── */}
              <SectionCard title="Whale Activity" icon={Flame}>
                <div className={`rounded-xl border p-3 mb-3 ${whaleCfg.border} ${whaleCfg.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${analysis.whale.detected ? 'bg-orange-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className={`text-sm font-bold ${whaleCfg.color}`}>{whaleCfg.label}</span>
                  </div>
                  {analysis.whale.reasons?.length > 0 && (
                    <ul className="space-y-0.5 mt-1">
                      {analysis.whale.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                          <span className={`mt-1.5 h-1 w-1 flex-shrink-0 rounded-full ${whaleCfg.color.replace('text-', 'bg-')}`} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-1">
                  <StatRow
                    label="Volume multiplier"
                    value={`${analysis.whale.volMulti}×`}
                    valueClass={analysis.whale.volMulti >= 3 ? 'text-orange-400' : 'text-gray-900 dark:text-white'}
                  />
                  <StatRow
                    label="1h price change"
                    value={fmtPct(analysis.whale.priceChange1h)}
                    valueClass={analysis.whale.priceChange1h >= 0 ? 'text-green-400' : 'text-red-400'}
                  />
                </div>
              </SectionCard>

              {/* ── 4. Pattern Score ─────────────────────────────────── */}
              <SectionCard title="Historical Signal Quality" icon={Activity}>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-2">
                  How this signal compares to past signals in the same category (last 30 days). Not a current timing indicator.
                </p>
                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1.5">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category Strength</p>
                    <span className={`text-[10px] font-bold ${
                      analysis.patternScore >= 70 ? 'text-green-400' :
                      analysis.patternScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysis.patternScore >= 70 ? 'STRONG' : analysis.patternScore >= 50 ? 'AVERAGE' : 'WEAK'}
                    </span>
                  </div>
                  <ScoreBar value={analysis.patternScore} colorClass={patternBarColor} />
                </div>

                {analysis.historicalContext && (
                  <div className="space-y-1 border-t border-gray-100 dark:border-brandDark-700 pt-3">
                    <StatRow label="Historical signals compared" value={analysis.historicalContext.sampleSize} />
                    <StatRow
                      label="Avg category score"
                      value={analysis.historicalContext.avgCategoryScore}
                    />
                    <StatRow
                      label="This signal vs avg"
                      value={`${analysis.historicalContext.thisSignalVsAvg >= 0 ? '+' : ''}${analysis.historicalContext.thisSignalVsAvg}`}
                      valueClass={analysis.historicalContext.thisSignalVsAvg >= 0 ? 'text-green-400' : 'text-red-400'}
                    />
                    <StatRow
                      label="Strong signal rate (≥65)"
                      value={`${analysis.historicalContext.strongSignalRate}%`}
                    />
                    <StatRow
                      label="Positive discovery rate"
                      value={`${analysis.historicalContext.positiveDiscoveryRate}%`}
                      valueClass={analysis.historicalContext.positiveDiscoveryRate >= 60 ? 'text-green-400' : 'text-gray-900 dark:text-white'}
                    />
                  </div>
                )}

                {!analysis.historicalContext && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No historical data for this category yet.</p>
                )}
              </SectionCard>

              {/* ── 5. Current candle snapshot ────────────────────────── */}
              {analysis.entryTiming?.currentCandle && (
                <SectionCard title="Current 1h Candle" icon={BarChart2}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <StatRow label="Open"  value={fmtPrice(analysis.entryTiming.currentCandle.open)} />
                    <StatRow label="Close" value={fmtPrice(analysis.entryTiming.currentCandle.close)}
                      valueClass={analysis.entryTiming.currentCandle.close >= analysis.entryTiming.currentCandle.open ? 'text-green-400' : 'text-red-400'}
                    />
                    <StatRow label="High"  value={fmtPrice(analysis.entryTiming.currentCandle.high)} />
                    <StatRow label="Low"   value={fmtPrice(analysis.entryTiming.currentCandle.low)} />
                    <StatRow label="Volume" value={fmt(analysis.entryTiming.currentCandle.volume, 0)} />
                  </div>
                </SectionCard>
              )}

            </>
          )}

          {/* Idle (no analysis fetched yet) */}
          {!analysis && !analysisLoading && !analysisError && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Zap className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Starting analysis for {signal.symbol}…
              </p>
            </div>
          )}

        </div>

        {/* Footer disclaimer */}
        <div className="border-t border-gray-200 dark:border-brandDark-700 px-5 py-3">
          <p className="text-[10px] text-gray-500 dark:text-gray-500 text-center">
            Analysis uses live market data from Gate.io. Not financial advice — always DYOR.
          </p>
        </div>

      </div>
    </>
  );
}
