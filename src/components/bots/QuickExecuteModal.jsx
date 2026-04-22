import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { X, Zap, Bot, AlertTriangle, Shield, TrendingUp, TrendingDown, Loader, Wallet, Pencil, Check, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';
import { fetchBots } from '../../redux/slices/botSlice';
import { fetchDemoAccount } from '../../redux/slices/demoSlice';

const RISK_PRESETS = [
  { key: 'safe',       label: 'Safe',       pct: 1 },
  { key: 'moderate',   label: 'Moderate',   pct: 2 },
  { key: 'aggressive', label: 'Aggressive', pct: 5 },
];

export default function QuickExecuteModal({ signal, onClose }) {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const bots               = useSelector(s => s.bots?.list || []);
  const demoVirtualBalance = useSelector(s => s.demo?.virtualBalance ?? null);
  const liveAccounts       = useSelector(s => s.exchangeAccounts?.accounts || []);

  useEffect(() => {
    dispatch(fetchBots());
    dispatch(fetchDemoAccount());
  }, [dispatch]);

  const [mode, setMode]                   = useState('new');
  const [selectedBotId, setSelectedBotId] = useState('');
  const [selectedExchange, setSelectedExchange]   = useState('');
  const [riskPreset, setRiskPreset]       = useState('moderate');
  const [loading, setLoading]             = useState(false);
  const [resetingBalance, setResetingBalance] = useState(false);
  const [conflict, setConflict]           = useState(null);
  const [confirmConflict, setConfirmConflict] = useState(false);

  // Editable signal params
  const [editEntry,  setEditEntry]  = useState(signal?.entry     ?? '');
  const [editSL,     setEditSL]     = useState(signal?.stopLoss  ?? '');
  const [editTP,     setEditTP]     = useState(signal?.takeProfit ?? '');
  const [editingParams, setEditingParams] = useState(false);

  const activeBots = (bots || []).filter(b => b.status === 'running' || b.status === 'paused');
  const hasLiveAccounts = liveAccounts.length > 0;


  const maxLoss = () => {
    const bal = demoVirtualBalance || 0;
    const pct = RISK_PRESETS.find(r => r.key === riskPreset)?.pct || 2;
    return bal > 0 ? `$${(bal * pct / 100).toFixed(2)}` : '—';
  };

  const handleResetBalance = async () => {
    setResetingBalance(true);
    try {
      await authAPI.post('/demo/reset');
      dispatch(fetchDemoAccount());
      toast.success('Demo balance reset to $10,000');
    } catch {
      toast.error('Failed to reset balance');
    } finally {
      setResetingBalance(false);
    }
  };

  const effectiveSignal = {
    ...signal,
    entry:       parseFloat(editEntry)  || signal?.entry,
    stopLoss:    parseFloat(editSL)     || signal?.stopLoss,
    takeProfit:  parseFloat(editTP)     || signal?.takeProfit,
  };

  const handleExecute = async (forceConflict = false, isLiveTrade = false) => {
    if (mode === 'existing' && !selectedBotId) {
      toast.error('Please select a bot');
      return;
    }
    if (mode === 'new' && !isLiveTrade) {
      if (!selectedExchange) { toast.error('Please select an exchange'); return; }
    }

    setLoading(true);
    try {
      const payload = {
        signalData: effectiveSignal,
        riskPreset,
        ...(mode === 'existing'
          ? { botId: selectedBotId }
          : { isDemo: !isLiveTrade, exchange: selectedExchange, accountBalance: demoVirtualBalance }),
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
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {signal?.type}
              </span>
              <button
                onClick={() => setEditingParams(p => !p)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title={editingParams ? 'Done editing' : 'Edit entry / SL / TP'}
              >
                {editingParams ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Pencil className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Entry</span>
              {editingParams ? (
                <input
                  type="number"
                  value={editEntry}
                  onChange={e => setEditEntry(e.target.value)}
                  className="w-full mt-0.5 px-2 py-1 text-xs bg-black/30 border border-white/20 rounded text-white focus:outline-none focus:border-primary-400"
                />
              ) : (
                <div className="text-white font-medium">${(parseFloat(editEntry) || signal?.entry)?.toLocaleString()}</div>
              )}
            </div>
            <div>
              <span className="text-gray-500">SL</span>
              {editingParams ? (
                <input
                  type="number"
                  value={editSL}
                  onChange={e => setEditSL(e.target.value)}
                  className="w-full mt-0.5 px-2 py-1 text-xs bg-black/30 border border-white/20 rounded text-red-300 focus:outline-none focus:border-red-400"
                />
              ) : (
                <div className="text-red-400 font-medium">${(parseFloat(editSL) || signal?.stopLoss)?.toLocaleString()}</div>
              )}
            </div>
            <div>
              <span className="text-gray-500">TP</span>
              {editingParams ? (
                <input
                  type="number"
                  value={editTP}
                  onChange={e => setEditTP(e.target.value)}
                  className="w-full mt-0.5 px-2 py-1 text-xs bg-black/30 border border-white/20 rounded text-green-300 focus:outline-none focus:border-green-400"
                />
              ) : (
                <div className="text-green-400 font-medium">${(parseFloat(editTP) || signal?.takeProfit)?.toLocaleString()}</div>
              )}
            </div>
          </div>
          {editingParams && (
            <p className="mt-2 text-[10px] text-gray-500">Editing these values overrides the signal defaults for this trade only.</p>
          )}
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

          {/* New bot — exchange picker + demo balance */}
          {mode === 'new' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Exchange</label>
                <select
                  value={selectedExchange}
                  onChange={e => setSelectedExchange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-brandDark-800 border border-brandDark-600 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select exchange...</option>
                  {[
                    { id: 'binance', name: 'Binance' },
                    { id: 'bybit',   name: 'Bybit' },
                    { id: 'okx',     name: 'OKX' },
                    { id: 'kucoin',  name: 'KuCoin' },
                    { id: 'bitget',  name: 'Bitget' },
                    { id: 'gate',    name: 'Gate.io' },
                    { id: 'mexc',    name: 'MEXC' },
                    { id: 'huobi',   name: 'HTX (Huobi)' },
                  ].map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              {/* Demo balance info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-brandDark-800 border border-brandDark-600">
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                    <Wallet className="w-3 h-3" /> Demo Balance
                  </p>
                  <p className="text-lg font-bold text-white">
                    ${(demoVirtualBalance ?? 10000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-gray-400 ml-1">USDT</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetBalance}
                    disabled={resetingBalance}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-brandDark-500 text-gray-400 hover:text-white hover:border-gray-400 transition-colors disabled:opacity-50"
                    title="Reset demo balance to $10,000"
                  >
                    <RefreshCw className={`w-3 h-3 ${resetingBalance ? 'animate-spin' : ''}`} />
                    Reset
                  </button>
                  <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Demo</span>
                </div>
              </div>
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
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-brandDark-700" />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px bg-brandDark-700" />
            </div>
          )}
          {activeBots.length > 0 && (
            <button
              onClick={() => setMode(m => m === 'existing' ? 'new' : 'existing')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-brandDark-600 text-xs text-gray-400 hover:text-white hover:border-brandDark-500 hover:bg-brandDark-700 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              {mode === 'new' ? 'Apply to an existing bot' : 'Create a new bot instead'}
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
            {(demoVirtualBalance || 0) > 0 && (
              <p className="mt-2 text-xs text-gray-400 text-center">
                If this trade goes wrong, you lose a maximum of <span className="text-red-400 font-semibold">{maxLoss()}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-2">
          {/* Trade This Now — live exchange (shown when user has connected accounts) */}
          {hasLiveAccounts && mode === 'new' && (
            <button
              onClick={() => handleExecute(false, true)}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {loading ? 'Executing...' : 'Trade This Now — Live'}
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-brandDark-600 text-sm text-gray-300 hover:bg-brandDark-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => handleExecute(false)}
              disabled={loading || (mode === 'new' && !selectedExchange) || (mode === 'existing' && !selectedBotId)}
              className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Executing...' : 'Execute Demo Trade'}
            </button>
          </div>
          {!hasLiveAccounts && (
            <p className="text-center text-[10px] text-gray-600">
              Want to trade live? <button onClick={() => { navigate('/account'); onClose(); }} className="text-cyan-500 hover:underline">Connect an exchange</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
