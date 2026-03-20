import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { X, Zap, Bot, AlertTriangle, Shield, TrendingUp, TrendingDown, Loader, RefreshCw, Wallet } from 'lucide-react';
import { authAPI } from '../../services/api';
import { fetchBots } from '../../redux/slices/botSlice';
import { fetchAccounts, fetchAccountBalance } from '../../redux/slices/exchangeAccountSlice';

const RISK_PRESETS = [
  { key: 'safe',       label: 'Safe',       pct: 1 },
  { key: 'moderate',   label: 'Moderate',   pct: 2 },
  { key: 'aggressive', label: 'Aggressive', pct: 5 },
];

export default function QuickExecuteModal({ signal, onClose }) {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const bots      = useSelector(s => s.bots?.list || []);
  const accounts  = useSelector(s => s.exchangeAccounts?.accounts || []);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchAccounts());
  }, [dispatch]);

  const [mode, setMode]                   = useState('new'); // 'new' is default
  const [selectedBotId, setSelectedBotId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fetchedBalance, setFetchedBalance]       = useState(null); // { usdt, fetchedAt }
  const [balanceLoading, setBalanceLoading]       = useState(false);
  const [balanceError, setBalanceError]           = useState(null);
  const [riskPreset, setRiskPreset]       = useState('moderate');
  const [loading, setLoading]             = useState(false);
  const [conflict, setConflict]           = useState(null);
  const [confirmConflict, setConfirmConflict] = useState(false);

  const activeBots = (bots || []).filter(b => b.status === 'running' || b.status === 'paused');

  // Auto-fetch balance when exchange account is selected
  const loadBalance = useCallback(async () => {
    if (!selectedAccountId) return;
    setFetchedBalance(null);
    setBalanceError(null);
    setBalanceLoading(true);
    try {
      const res = await dispatch(fetchAccountBalance(selectedAccountId)).unwrap();
      const usdtEntry = (res.balances || []).find(b =>
        b.currency === 'USDT' || b.asset === 'USDT'
      );
      const usdt = usdtEntry?.free ?? usdtEntry?.available ?? usdtEntry?.total ?? 0;
      setFetchedBalance({ usdt, fetchedAt: res.fetchedAt });
    } catch {
      setBalanceError('Could not fetch balance. Check your API connection.');
    } finally {
      setBalanceLoading(false);
    }
  }, [dispatch, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId) loadBalance();
  }, [selectedAccountId]);

  const maxLoss = () => {
    const bal = fetchedBalance?.usdt || 0;
    const pct = RISK_PRESETS.find(r => r.key === riskPreset)?.pct || 2;
    return bal > 0 ? `$${(bal * pct / 100).toFixed(2)}` : '—';
  };

  const handleExecute = async (forceConflict = false) => {
    if (mode === 'existing' && !selectedBotId) {
      toast.error('Please select a bot');
      return;
    }
    if (mode === 'new') {
      if (!selectedAccountId) { toast.error('Please select an exchange account'); return; }
      if (!fetchedBalance?.usdt || fetchedBalance.usdt < 10) { toast.error('Account balance must be at least $10'); return; }
    }

    setLoading(true);
    try {
      const payload = {
        signalData: signal,
        riskPreset,
        ...(mode === 'existing'
          ? { botId: selectedBotId }
          : { exchangeAccountId: selectedAccountId, accountBalance: fetchedBalance.usdt }),
      };

      const res = await authAPI.post('/bots/quick-execute', payload);
      const data = res.data;

      if (data.conflict && !forceConflict) {
        setConflict(data);
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success(`Trade opened on ${signal.pair}!`);
        navigate(`/bots/${data.data.botId}`);
        onClose();
      } else {
        toast.error(data.message || 'Execution failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const isLong = signal?.type === 'LONG';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brandDark-900 border border-brandDark-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brandDark-700">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-400" />
            <span className="font-semibold text-white">Execute Trade</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-brandDark-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Signal summary */}
        <div className={`mx-5 mt-4 p-3 rounded-xl border ${isLong ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white">{signal?.pair}</span>
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {signal?.type}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-gray-500">Entry</span><div className="text-white font-medium">${signal?.entry?.toLocaleString()}</div></div>
            <div><span className="text-gray-500">SL</span><div className="text-red-400 font-medium">${signal?.stopLoss?.toLocaleString()}</div></div>
            <div><span className="text-gray-500">TP</span><div className="text-green-400 font-medium">${signal?.takeProfit?.toLocaleString()}</div></div>
          </div>
        </div>

        {/* Conflict warning */}
        {conflict && !confirmConflict && (
          <div className="mx-5 mt-4 p-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">Pair Conflict Detected</p>
                <p className="text-xs text-yellow-300/80 mt-0.5">{conflict.message}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConflict(null)} className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-600 text-gray-300 hover:bg-brandDark-700">Cancel</button>
              <button onClick={() => { setConfirmConflict(true); setConflict(null); handleExecute(true); }} className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30">Proceed Anyway</button>
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-4">

          {/* New bot — exchange account + auto-fetched balance */}
          {mode === 'new' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Exchange Account</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-brandDark-800 border border-brandDark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Choose exchange...</option>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>{a.exchange} — {a.label || a.apiKey?.slice(0, 8) + '...'}</option>
                  ))}
                </select>
              </div>

              {/* Auto-fetched balance */}
              {selectedAccountId && (
                <div className="p-3 rounded-xl bg-brandDark-800 border border-brandDark-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Available Balance
                    </span>
                    <button
                      onClick={loadBalance}
                      disabled={balanceLoading}
                      className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${balanceLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  {balanceLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Loader className="w-3 h-3 animate-spin" /> Fetching balance...
                    </div>
                  ) : fetchedBalance ? (
                    <p className="text-lg font-bold text-white">
                      ${fetchedBalance.usdt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-gray-400 ml-1">USDT</span>
                    </p>
                  ) : balanceError ? (
                    <p className="text-xs text-yellow-400">{balanceError}</p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Existing bot selector */}
          {mode === 'existing' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Select Bot</label>
              {activeBots.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No active bots found. Create a new one instead.</p>
              ) : (
                <select
                  value={selectedBotId}
                  onChange={e => setSelectedBotId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-brandDark-800 border border-brandDark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Choose a bot...</option>
                  {activeBots.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.exchange})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Use existing bot — secondary option */}
          {activeBots.length > 0 && (
            <button
              onClick={() => setMode(m => m === 'existing' ? 'new' : 'existing')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              {mode === 'new' ? 'Or apply to an existing bot instead →' : '← Back to creating a new bot'}
            </button>
          )}

          {/* Risk preset */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              <Shield className="inline w-3 h-3 mr-1" />
              How much can you afford to lose on this trade?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_PRESETS.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRiskPreset(r.key)}
                  className={`py-2 px-2 rounded-xl text-xs border transition-colors ${
                    riskPreset === r.key
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-brandDark-600 text-gray-400 hover:bg-brandDark-700'
                  }`}
                >
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-gray-500 text-[10px]">{r.pct}% risk</div>
                </button>
              ))}
            </div>
            {fetchedBalance?.usdt > 0 && (
              <p className="mt-2 text-xs text-gray-400 text-center">
                If this trade goes wrong, you lose a maximum of <span className="text-red-400 font-semibold">{maxLoss()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-brandDark-600 text-sm text-gray-300 hover:bg-brandDark-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => handleExecute(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Executing...' : 'Execute Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
