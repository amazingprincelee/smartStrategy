import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FlaskConical, RotateCcw, TrendingUp, TrendingDown, PlusCircle,
  Trophy, AlertTriangle, Loader, Info
} from 'lucide-react';
import { fetchDemoAccount, fetchDemoPerformance, resetDemoAccount } from '../redux/slices/demoSlice';
import { fetchBots } from '../redux/slices/botSlice';

const DemoAccount = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const demo = useSelector(state => state.demo);
  const allBots = useSelector(state => state.bots.list);
  const demoBots = allBots.filter(b => b.isDemo);

  useEffect(() => {
    dispatch(fetchDemoAccount());
    dispatch(fetchDemoPerformance());
    dispatch(fetchBots());
  }, [dispatch]);

  const handleReset = async () => {
    if (!window.confirm('Reset demo account? This will clear all trade history and return balance to $10,000.')) return;
    try {
      await dispatch(resetDemoAccount()).unwrap();
      toast.success('Demo account reset to $10,000');
      dispatch(fetchDemoPerformance());
    } catch (err) {
      toast.error(err || 'Failed to reset demo account');
    }
  };

  const pnl = demo.totalRealizedPnL || 0;
  const pnlPositive = pnl >= 0;
  const balanceChange = demo.virtualBalance - demo.initialBalance;

  const formatCurrency = (v) =>
    v?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';

  const statCards = [
    {
      label: 'Total P&L',
      value: `${pnlPositive ? '+' : ''}$${formatCurrency(pnl)}`,
      sub: `${demo.pnlPercent >= 0 ? '+' : ''}${demo.pnlPercent}% return`,
      color: pnlPositive ? 'text-green-600' : 'text-red-500',
      icon: pnlPositive ? TrendingUp : TrendingDown,
    },
    {
      label: 'Win Rate',
      value: `${demo.winRate}%`,
      sub: `${demo.winningTrades}W / ${demo.losingTrades}L`,
      color: 'text-blue-600',
      icon: Trophy,
    },
    {
      label: 'Total Trades',
      value: demo.totalTrades,
      sub: 'executed (simulated)',
      color: 'text-purple-600',
      icon: TrendingUp,
    },
    {
      label: 'Fees Paid',
      value: `$${formatCurrency(demo.totalFeesPaid)}`,
      sub: '0.1% per trade',
      color: 'text-orange-500',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demo Account</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
              Paper Trading
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Practice with real market prices — no real money involved
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={demo.loading.reset}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-brandDark-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors text-sm"
        >
          {demo.loading.reset ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reset Account
        </button>
      </div>

      {/* Virtual Balance */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
        <p className="text-blue-100 text-sm font-medium mb-1">Virtual Balance</p>
        <p className="text-4xl font-bold mb-2">${formatCurrency(demo.virtualBalance)}</p>
        <p className={`text-sm ${balanceChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {balanceChange >= 0 ? '+' : ''}${formatCurrency(balanceChange)} from initial
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Demo mode uses live market prices for realistic simulation. Orders execute at real bid/ask prices
          with 0.1% simulated trading fees. No real funds are at risk.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Balance history chart */}
      {demo.balanceLine && demo.balanceLine.length > 1 && (
        <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Balance History</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demo.balanceLine}>
              <defs>
                <linearGradient id="demoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Balance']} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#demoGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / Worst trades */}
      {(demo.bestTrade || demo.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demo.bestTrade && (
            <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-green-200 dark:border-green-800 p-4">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Best Trade</p>
              <p className="text-2xl font-bold text-green-600">+${demo.bestTrade.pnl?.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{demo.bestTrade.symbol}</p>
            </div>
          )}
          {demo.worstTrade && (
            <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
              <p className="text-xs font-medium text-red-500 mb-2">Worst Trade</p>
              <p className="text-2xl font-bold text-red-500">${demo.worstTrade.pnl?.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{demo.worstTrade.symbol}</p>
            </div>
          )}
        </div>
      )}

      {/* Demo bots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Demo Bots</h2>
          <button
            onClick={() => navigate('/bots/create')}
            className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <PlusCircle className="w-4 h-4" />
            Create Demo Bot
          </button>
        </div>

        {demoBots.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700">
            <FlaskConical className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No demo bots yet</p>
            <button
              onClick={() => navigate('/bots/create')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mx-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Create Demo Bot
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {demoBots.map(bot => (
              <div
                key={bot._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-brandDark-800 rounded-lg border border-gray-200 dark:border-brandDark-700 hover:shadow-sm cursor-pointer"
                onClick={() => navigate(`/bots/${bot._id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${bot.status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{bot.name}</p>
                    <p className="text-xs text-gray-500">{bot.symbol} · {bot.exchange}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${(bot.stats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(bot.stats?.totalPnL || 0) >= 0 ? '+' : ''}${(bot.stats?.totalPnL || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{bot.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoAccount;
