import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Play, Square, Trash2, TrendingUp, TrendingDown,
  Activity, Loader, AlertCircle, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, RefreshCw
} from 'lucide-react';
import {
  fetchBotDetail, fetchBotTrades, fetchBotPositions, startBot, stopBot, deleteBot
} from '../redux/slices/botSlice';

const STRATEGY_LABELS = {
  smart_signal:  'SmartSignal Bot',
  swing_rider:   'Swing Rider',
  ai_signal:     'SmartSignal Bot',   // legacy alias
  dca:           'Simple DCA',
  adaptive_grid: 'Adaptive Grid Averager',
  rsi_reversal:  'RSI Reversal',
  ema_crossover: 'EMA Crossover',
  scalper:       'ATR Scalper',
  breakout:      'N-Day Breakout',
};

const REASON_COLORS = {
  take_profit: 'text-green-600',
  stop_loss: 'text-red-500',
  trailing_stop: 'text-orange-500',
  entry: 'text-blue-500',
  dca: 'text-purple-500',
  manual: 'text-gray-500',
};

// Timeframe label per strategy
const STRATEGY_TIMEFRAME = {
  smart_signal:  '5m',
  swing_rider:   '15m',
  ai_signal:     '5m',
  dca:           '4h',
  adaptive_grid: '1h',
  rsi_reversal:  '1h',
  ema_crossover: '4h',
  scalper:       '5m',
  breakout:      '1d',
};

// Build condition list per strategy using live analysis values
function getStrategyConditions(strategyId, params, analysis) {
  if (!analysis) return [];
  const rsi = analysis.rsi;
  const vr  = analysis.volumeRatio;

  switch (strategyId) {
    case 'smart_signal':
    case 'ai_signal':
      return [
        {
          label: 'Signal confidence',
          met: true,
          actual: `≥ ${params?.minConfidencePercent || 70}%`,
          need: 'threshold met',
        },
        {
          label: 'Concurrent trades',
          met: true,
          actual: `max ${params?.maxConcurrentTrades || 2}`,
          need: 'slots available',
        },
      ];
    case 'swing_rider':
      return [
        {
          label: 'Price near support',
          met: rsi != null && rsi < 50,
          actual: rsi != null ? `RSI ${rsi}` : '—',
          need: 'near swing low',
        },
        {
          label: 'Max scale-ins',
          met: true,
          actual: `${params?.maxScaleIns || 2} entries`,
          need: 'slots available',
        },
        {
          label: 'Min R:R',
          met: true,
          actual: `${params?.minRR || 1.5}:1`,
          need: 'target ≥ stop',
        },
      ];
    case 'adaptive_grid':
      return [
        {
          label: 'RSI Oversold',
          met: rsi != null && rsi < (params?.rsiOversold || 30),
          actual: rsi != null ? `RSI ${rsi}` : '—',
          need: `< ${params?.rsiOversold || 30}`,
        },
        {
          label: 'Volume Spike',
          met: vr != null && vr > 1.2,
          actual: vr != null ? `${vr}× avg` : '—',
          need: '> 1.2× avg',
        },
        {
          label: 'Trend Check',
          met: analysis.trend !== 'bearish_strong',
          actual: analysis.trend || '—',
          need: 'not strongly bearish',
        },
      ];
    case 'rsi_reversal':
      return [
        {
          label: 'RSI Oversold',
          met: rsi != null && rsi < (params?.rsiOversold || 30),
          actual: rsi != null ? `RSI ${rsi}` : '—',
          need: `< ${params?.rsiOversold || 30}`,
        },
        {
          label: 'Volume Confirmation',
          met: vr != null && vr > 1.1,
          actual: vr != null ? `${vr}× avg` : '—',
          need: '> 1.1× avg',
        },
      ];
    case 'ema_crossover':
      return [
        {
          label: 'EMA Crossover',
          met: analysis.trend === 'bullish',
          actual: analysis.trend || '—',
          need: 'bullish crossover',
        },
        {
          label: 'Volume Confirmation',
          met: vr != null && vr > 1.0,
          actual: vr != null ? `${vr}× avg` : '—',
          need: '> 1.0× avg',
        },
      ];
    case 'scalper':
      return [
        {
          label: 'ATR Grid Active',
          met: analysis.action !== 'waiting',
          actual: analysis.action || 'scanning',
          need: 'grid spacing hit',
        },
        {
          label: 'Volume Present',
          met: vr != null && vr > 0.8,
          actual: vr != null ? `${vr}× avg` : '—',
          need: '> 0.8× avg',
        },
      ];
    case 'breakout':
      return [
        {
          label: 'N-Day High Breakout',
          met: analysis.action === 'entry',
          actual: analysis.action === 'entry' ? 'breakout detected' : 'no breakout yet',
          need: `price above ${params?.breakoutLookbackDays || 20}-day high`,
        },
      ];
    case 'dca':
      return [
        {
          label: 'DCA Interval',
          met: analysis.action === 'entry',
          actual: analysis.action === 'entry' ? 'interval reached' : 'accumulating',
          need: `every ${params?.dcaIntervalHours || 24}h`,
        },
      ];
    default:
      return [];
  }
}

// Countdown component — ticks every second
function NextTickCountdown({ nextTickAt, timeframe }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      if (!nextTickAt) { setRemaining('—'); return; }
      const diff = new Date(nextTickAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('any moment…'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      if (m > 0 || h > 0) parts.push(`${m}m`);
      parts.push(`${s}s`);
      setRemaining(parts.join(' '));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextTickAt]);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Clock className="w-4 h-4 text-primary-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Next analysis in</span>
      <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{remaining}</span>
      <span className="text-xs text-gray-400">({timeframe} candle)</span>
    </div>
  );
}

// Bot status + conditions panel
function BotStatusPanel({ bot }) {
  const analysis = bot?.lastAnalysis;
  const conditions = getStrategyConditions(bot?.strategyId, bot?.strategyParams, analysis);
  const metCount = conditions.filter(c => c.met).length;
  const timeframe = STRATEGY_TIMEFRAME[bot?.strategyId] || '1h';

  if (bot?.status !== 'running') return null;

  return (
    <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-500" />
          Strategy Conditions
        </h2>
        {analysis?.timestamp && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Last checked {new Date(analysis.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Current price */}
      {analysis?.currentPrice && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Current price</span>
          <span className="font-mono font-bold text-gray-900 dark:text-white">
            ${Number(analysis.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </div>
      )}

      {/* Conditions list */}
      {conditions.length === 0 ? (
        <p className="text-sm text-gray-400">No analysis data yet — waiting for first tick…</p>
      ) : (
        <>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {metCount} / {conditions.length} conditions met to open a trade
          </div>
          <div className="space-y-2 mb-4">
            {conditions.map(c => (
              <div key={c.label} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-brandDark-700">
                <div className="flex items-center gap-2 min-w-0">
                  {c.met
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  }
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-mono font-semibold block ${c.met ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {c.actual}
                  </span>
                  <span className="text-xs text-gray-400">needs {c.need}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Countdown */}
      <NextTickCountdown nextTickAt={analysis?.nextTickAt} timeframe={timeframe} />
    </div>
  );
}

// Tick log panel
function TickLogPanel({ tickLog }) {
  if (!tickLog || tickLog.length === 0) return null;

  return (
    <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4 text-primary-500" />
        Analysis Log
        <span className="text-xs font-normal text-gray-400">(last {tickLog.length} checks)</span>
      </h2>
      <div className="overflow-x-auto">
        <div className="min-w-[420px] space-y-1">
          {[...tickLog].reverse().map((entry, i) => {
            const actionColor = entry.action === 'entry'
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
              : entry.action === 'exit'
              ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-brandDark-700';
            return (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg text-sm">
                <span className="text-gray-400 dark:text-gray-500 text-xs w-24 flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-mono text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">
                  ${entry.currentPrice != null ? Number(entry.currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                </span>
                <span className="text-gray-500 dark:text-gray-400 w-16 flex-shrink-0 text-xs">
                  RSI {entry.rsi ?? '—'}
                </span>
                <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0 text-xs">
                  Vol {entry.volumeRatio != null ? `${entry.volumeRatio}×` : '—'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${actionColor}`}>
                  {entry.action || '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BotDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { detail, openPositions, trades, tradesMeta, loading } = useSelector(state => state.bots);
  const [tradePage, setTradePage] = useState(1);

  const bot = detail?.bot;

  useEffect(() => {
    dispatch(fetchBotDetail(id));
    dispatch(fetchBotPositions({ id, status: 'open' }));
    dispatch(fetchBotTrades({ id, page: 1 }));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(fetchBotTrades({ id, page: tradePage }));
  }, [dispatch, id, tradePage]);

  const handleStart = async () => {
    try {
      await dispatch(startBot(id)).unwrap();
      toast.success('Bot started');
      dispatch(fetchBotDetail(id));
    } catch (err) { toast.error(err || 'Failed to start'); }
  };

  const handleStop = async () => {
    try {
      await dispatch(stopBot(id)).unwrap();
      toast.info('Bot stopped');
      dispatch(fetchBotDetail(id));
    } catch (err) { toast.error(err || 'Failed to stop'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete bot "${bot?.name}"? This cannot be undone.`)) return;
    try {
      await dispatch(deleteBot(id)).unwrap();
      toast.info('Bot deleted');
      navigate('/bots');
    } catch (err) { toast.error(err || 'Failed to delete'); }
  };

  if (loading.detail) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Bot not found</p>
        <button onClick={() => navigate('/bots')} className="mt-4 text-primary-600 hover:underline">
          Back to bots
        </button>
      </div>
    );
  }

  const pnl = bot.stats?.totalPnL ?? 0;
  const winRate = bot.stats?.totalTrades > 0
    ? ((bot.stats.winningTrades / bot.stats.totalTrades) * 100).toFixed(1)
    : 0;

  // Build a simple P&L chart from trades
  const pnlChartData = trades
    .filter(t => t.side === 'sell' && t.pnl != null)
    .map((t, i) => ({
      trade: i + 1,
      pnl: parseFloat(t.pnl?.toFixed(2) || 0),
      symbol: t.symbol
    }));

  const STATUS_DOT = {
    running: 'bg-green-500',
    stopped: 'bg-gray-400',
    paused: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        {/* Top row: back + name */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/bots')} className="mt-0.5 p-1.5 hover:bg-gray-100 dark:hover:bg-brandDark-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[bot.status] || 'bg-gray-400'}`} />
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{bot.name}</h1>
              {bot.isDemo && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  Demo
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">{bot.symbol}</span>
              <span>·</span>
              <span className="capitalize">{bot.exchange}</span>
              <span>·</span>
              <span className="capitalize">{bot.marketType}</span>
              <span>·</span>
              <span>{STRATEGY_LABELS[bot.strategyId] || bot.strategyId}</span>
            </div>
          </div>
        </div>
        {/* Control buttons — below name on all sizes, aligned under name */}
        <div className="flex gap-2 pl-10">
          {bot.status === 'running' ? (
            <button
              onClick={handleStop}
              disabled={loading.action}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-sm font-medium disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading.action}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-sm font-medium disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Allocated capital */}
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Allocated Capital</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            ${(bot.capitalAllocation?.totalCapital ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{bot.capitalAllocation?.currency || 'USDT'}</p>
        </div>
        {/* Current value */}
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            ${(bot.stats?.currentCapital ?? bot.capitalAllocation?.totalCapital ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{bot.capitalAllocation?.currency || 'USDT'}</p>
        </div>
        {/* P&L */}
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total P&L</p>
          <p className={`text-xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
          <p className={`text-xs mt-0.5 ${pnl >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{(bot.stats?.totalPnLPercent ?? 0).toFixed(2)}%
          </p>
        </div>
        {/* Win rate */}
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Win Rate</p>
          <p className="text-xl font-bold text-blue-600">{winRate}%</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {bot.stats?.winningTrades ?? 0}W / {bot.stats?.losingTrades ?? 0}L · {bot.stats?.totalTrades ?? 0} total
          </p>
        </div>
      </div>

      {/* Strategy conditions + countdown */}
      <BotStatusPanel bot={bot} />

      {/* Analysis log */}
      <TickLogPanel tickLog={bot.tickLog} />

      {/* P&L Chart */}
      {pnlChartData.length > 1 && (
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">P&L Per Trade</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pnlChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="trade" tick={{ fontSize: 11 }} label={{ value: 'Trade #', position: 'insideBottom', offset: -2 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'P&L']} />
              <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Open Positions */}
      <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Open Positions ({openPositions.length})
        </h2>
        {openPositions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-brandDark-700">
                  <th className="text-left py-2 pr-4">Pair</th>
                  <th className="text-left py-2 pr-4">Market</th>
                  <th className="text-left py-2 pr-4">Portion</th>
                  <th className="text-right py-2 pr-4">Entry</th>
                  <th className="text-right py-2 pr-4">Current</th>
                  <th className="text-right py-2 pr-4">Unrealized P&L</th>
                  <th className="text-right py-2 pr-4">Stop Loss</th>
                  <th className="text-right py-2">Take Profit</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map(pos => {
                  const upnl = pos.unrealizedPnL || 0;
                  return (
                    <tr key={pos._id} className="border-b border-gray-50 dark:border-brandDark-700 hover:bg-gray-50 dark:hover:bg-brandDark-700">
                      <td className="py-2 pr-4 font-mono font-semibold text-gray-900 dark:text-white">
                        {(pos.symbol || '—').replace('/', '')}
                      </td>
                      <td className="py-2 pr-4">
                        {(() => {
                          const mt = (pos.marketType || bot?.marketType || 'spot').toLowerCase();
                          return mt === 'futures'
                            ? <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">FUTURES</span>
                            : <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">SPOT</span>;
                        })()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">#{pos.portionIndex + 1}</td>
                      <td className="text-right py-2 pr-4 font-mono text-gray-800 dark:text-gray-200">${pos.entryPrice?.toFixed(4)}</td>
                      <td className="text-right py-2 pr-4 font-mono text-gray-800 dark:text-gray-200">${(pos.currentPrice || pos.entryPrice)?.toFixed(4)}</td>
                      <td className={`text-right py-2 pr-4 font-medium font-mono ${upnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {upnl >= 0 ? '+' : ''}${upnl.toFixed(4)}
                      </td>
                      <td className="text-right py-2 pr-4 font-mono text-red-500 dark:text-red-400">${pos.stopLossPrice?.toFixed(4)}</td>
                      <td className="text-right py-2 font-mono text-green-600 dark:text-green-400">
                        {pos.takeProfitPrice ? `$${pos.takeProfitPrice.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade History */}
      <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Trade History ({tradesMeta.total})
        </h2>
        {loading.trades ? (
          <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : trades.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No trades yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-brandDark-700">
                    <th className="text-left py-2 pr-4">Pair</th>
                    <th className="text-left py-2 pr-4">Market</th>
                    <th className="text-left py-2 pr-4">Time</th>
                    <th className="text-left py-2 pr-4">Side</th>
                    <th className="text-right py-2 pr-4">Price</th>
                    <th className="text-right py-2 pr-4">Amount</th>
                    <th className="text-right py-2 pr-4">Fee</th>
                    <th className="text-right py-2 pr-4">P&L</th>
                    <th className="text-left py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(trade => (
                    <tr
                      key={trade._id}
                      className={`border-b border-gray-50 dark:border-brandDark-700 ${
                        trade.pnl != null && trade.pnl < 0 ? 'bg-red-50/30 dark:bg-red-900/10' :
                        trade.pnl != null && trade.pnl > 0 ? 'bg-green-50/30 dark:bg-green-900/10' : ''
                      }`}
                    >
                      <td className="py-2 pr-4 text-xs">
                        {(() => {
                          const sym = (trade.symbol || detail?.tradingPair || '').replace('/', '');
                          if (!sym || sym === 'MULTI') return (
                            <span className="text-gray-400 dark:text-gray-500 italic text-[10px]">multi-pair</span>
                          );
                          return <span className="font-mono font-semibold text-gray-900 dark:text-white">{sym}</span>;
                        })()}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {(() => {
                          const mt = (trade.marketType || bot?.marketType || 'spot').toLowerCase();
                          return mt === 'futures'
                            ? <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">FUT</span>
                            : <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">SPOT</span>;
                        })()}
                      </td>
                      <td className="py-2 pr-4 text-gray-400 text-xs">
                        {new Date(trade.executedAt).toLocaleString()}
                      </td>
                      <td className={`py-2 pr-4 font-medium uppercase text-xs ${trade.side === 'buy' ? 'text-blue-600' : 'text-orange-500'}`}>
                        {trade.side}
                      </td>
                      <td className="text-right py-2 pr-4 text-gray-800 dark:text-gray-200">${trade.price?.toFixed(4)}</td>
                      <td className="text-right py-2 pr-4 text-gray-800 dark:text-gray-200">{trade.amount?.toFixed(6)}</td>
                      <td className="text-right py-2 pr-4 text-gray-400">${trade.fee?.cost?.toFixed(4) || '—'}</td>
                      <td className={`text-right py-2 pr-4 font-medium ${trade.pnl == null ? 'text-gray-400' : trade.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(4)}` : '—'}
                      </td>
                      <td className={`py-2 text-xs ${REASON_COLORS[trade.triggerReason] || 'text-gray-500'}`}>
                        {trade.triggerReason?.replace('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {tradesMeta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-brandDark-700">
                <span className="text-sm text-gray-500">
                  Page {tradesMeta.page} of {tradesMeta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={tradePage === 1}
                    onClick={() => setTradePage(p => p - 1)}
                    className="p-1.5 rounded border border-gray-200 dark:border-brandDark-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-brandDark-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={tradePage === tradesMeta.totalPages}
                    onClick={() => setTradePage(p => p + 1)}
                    className="p-1.5 rounded border border-gray-200 dark:border-brandDark-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-brandDark-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BotDetail;
