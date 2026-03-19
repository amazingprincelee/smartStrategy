import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Wallet, RefreshCw, Plus, FlaskConical, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, XCircle, RotateCcw, ArrowUpRight, Bot,
  Clock, ChevronRight,
} from 'lucide-react';
import { fetchAccounts, fetchAccountBalance } from '../redux/slices/exchangeAccountSlice';
import { resetDemo } from '../redux/slices/demoSlice';
import { toast } from 'react-toastify';

const fmt = (n, dec = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function Account() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { accounts, balances, loading } = useSelector(s => s.exchangeAccounts);
  const demo     = useSelector(s => s.demo);
  const bots     = useSelector(s => s.bots?.list || []);
  const [resetting, setResetting] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleRefreshBalance = async (accountId) => {
    setRefreshingId(accountId);
    try {
      await dispatch(fetchAccountBalance(accountId)).unwrap();
    } catch {
      toast.error('Failed to fetch balance — check your API keys in Settings');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await dispatch(resetDemo()).unwrap();
      toast.success('Demo account reset to $10,000');
    } catch {
      toast.error('Failed to reset demo account');
    } finally {
      setResetting(false);
    }
  };

  // Total portfolio value: sum of USDT balances across all exchanges + demo
  const demoBalance    = demo?.virtualBalance ?? 10000;
  const demoPnL        = bots.filter(b => b.isDemo).reduce((s, b) => s + (b.stats?.totalPnL || 0), 0);
  const activeDemoBots = bots.filter(b => b.isDemo && b.status === 'running').length;

  const exchangeUsdtTotal = accounts.reduce((sum, acc) => {
    const bal = balances[acc._id]?.balances;
    if (!bal) return sum;
    const usdt = bal.find(b => b.asset === 'USDT');
    return sum + (usdt?.total ?? 0);
  }, 0);

  const portfolioTotal = demoBalance + exchangeUsdtTotal;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 p-4 md:p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Demo wallet + all connected exchange balances</p>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-cyan-500/50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Exchange
        </Link>
      </div>

      {/* ── Portfolio Total ── */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-extrabold text-white">${fmt(portfolioTotal)}</p>
        <p className="text-xs text-gray-500 mt-2">
          Demo ${fmt(demoBalance)}
          {accounts.length > 0 && <> · Exchanges ${fmt(exchangeUsdtTotal)} USDT</>}
        </p>
      </div>

      {/* ── Demo Account ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Demo Account</h2>
              <p className="text-[10px] text-gray-500">Paper trading · No real money</p>
            </div>
          </div>
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-brandDark-600 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {resetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Reset to $10,000
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Balance</p>
            <p className="text-lg font-bold text-white">${fmt(demoBalance)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Bot P&L</p>
            <p className={`text-lg font-bold ${demoPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {demoPnL >= 0 ? '+' : ''}${fmt(Math.abs(demoPnL))}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Active Bots</p>
            <p className="text-lg font-bold text-cyan-400">{activeDemoBots}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/8 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trades</p>
            <p className="text-lg font-bold text-gray-300">
              {bots.filter(b => b.isDemo).reduce((s, b) => s + (b.stats?.totalTrades || 0), 0)}
            </p>
          </div>
        </div>

        <Link
          to="/bots?mode=demo"
          className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs font-medium text-blue-400 hover:bg-blue-500/12 transition-colors"
        >
          <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Manage demo bots</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Exchange Balances ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-cyan-400" />
          Exchange Balances
          <span className="text-[10px] text-gray-500 font-normal">{accounts.length} connected</span>
        </h2>

        {accounts.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-sm text-gray-400">No exchange accounts connected yet</p>
            <p className="text-xs text-gray-600 max-w-xs">Connect your exchange API keys in Settings to see live balances here.</p>
            <Link
              to="/settings"
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/15 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Connect Exchange
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map(acc => {
              const balData    = balances[acc._id];
              const coins      = balData?.balances?.filter(b => (b.total ?? 0) > 0) ?? [];
              const usdt       = coins.find(b => b.asset === 'USDT');
              const fetchedAt  = balData?.fetchedAt;
              const isRefreshing = refreshingId === acc._id;

              return (
                <div key={acc._id} className="card">
                  {/* Exchange header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-sm font-bold text-white uppercase">
                        {acc.exchange[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{acc.exchange}</p>
                          <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            acc.isValid
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}>
                            {acc.isValid ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                            {acc.isValid ? 'Active' : 'Invalid key'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">{acc.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {fetchedAt && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Clock className="w-3 h-3" /> {timeAgo(fetchedAt)}
                        </span>
                      )}
                      <button
                        onClick={() => handleRefreshBalance(acc._id)}
                        disabled={isRefreshing || !acc.isValid}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/4 text-gray-400 hover:text-white hover:border-cyan-500/40 transition-colors disabled:opacity-40"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Balance display */}
                  {!balData && (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-500">Click refresh to load balances</p>
                    </div>
                  )}

                  {balData && coins.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-4">No assets found — account may be empty</p>
                  )}

                  {coins.length > 0 && (
                    <>
                      {/* USDT highlight */}
                      {usdt && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 mb-3">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Available USDT</p>
                            <p className="text-xl font-bold text-white">${fmt(usdt.free)}</p>
                            {usdt.used > 0 && <p className="text-[10px] text-gray-600">${fmt(usdt.used)} in orders</p>}
                          </div>
                          <p className="text-sm font-semibold text-cyan-400">${fmt(usdt.total)} total</p>
                        </div>
                      )}

                      {/* Other coins */}
                      {coins.filter(b => b.asset !== 'USDT').length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {coins.filter(b => b.asset !== 'USDT').slice(0, 6).map(b => (
                            <div key={b.asset} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 border border-white/6">
                              <span className="text-xs font-semibold text-gray-300">{b.asset}</span>
                              <span className="text-xs font-mono text-gray-400">{Number(b.total).toFixed(4)}</span>
                            </div>
                          ))}
                          {coins.filter(b => b.asset !== 'USDT').length > 6 && (
                            <div className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/3 border border-white/6 text-xs text-gray-600">
                              +{coins.filter(b => b.asset !== 'USDT').length - 6} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Bot count for this exchange */}
                  {(() => {
                    const exchBots = bots.filter(b => !b.isDemo && b.exchange === acc.exchange);
                    if (exchBots.length === 0) return null;
                    const running = exchBots.filter(b => b.status === 'running').length;
                    return (
                      <Link
                        to="/bots"
                        className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 border border-white/6 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3 h-3" />
                          {exchBots.length} bot{exchBots.length > 1 ? 's' : ''} on {acc.exchange}
                          {running > 0 && <span className="text-green-400">· {running} running</span>}
                        </span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
