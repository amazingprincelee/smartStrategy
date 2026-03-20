import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, Eye, EyeOff, Loader, Plus, Shield } from 'lucide-react';
import { addAccount } from '../../redux/slices/exchangeAccountSlice';
import { toast } from 'react-toastify';

export const SUPPORTED_EXCHANGES = [
  { id: 'binance',  name: 'Binance',      needsPassphrase: false },
  { id: 'bybit',    name: 'Bybit',        needsPassphrase: false },
  { id: 'okx',      name: 'OKX',          needsPassphrase: true  },
  { id: 'kucoin',   name: 'KuCoin',       needsPassphrase: true  },
  { id: 'bitget',   name: 'Bitget',       needsPassphrase: true  },
  { id: 'gate',     name: 'Gate.io',      needsPassphrase: false },
  { id: 'mexc',     name: 'MEXC',         needsPassphrase: false },
  { id: 'huobi',    name: 'HTX (Huobi)',  needsPassphrase: false },
];

/**
 * Inline exchange connect form — no routing required.
 *
 * Props:
 *   onSuccess(account) — called after a successful connection
 *   compact           — if true, uses a denser layout (for wizard modals)
 */
export default function ConnectExchangeForm({ onSuccess, compact = false }) {
  const dispatch     = useDispatch();
  const actionLoading = useSelector(s => s.exchangeAccounts.loading.action);

  const [form, setForm]         = useState({ exchange: '', apiKey: '', secretKey: '', passphrase: '', label: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError]       = useState('');

  const selected    = SUPPORTED_EXCHANGES.find(e => e.id === form.exchange);
  const needsPass   = selected?.needsPassphrase ?? false;
  const set         = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConnect = async () => {
    setError('');
    if (!form.exchange)          { setError('Please select an exchange'); return; }
    if (!form.apiKey.trim())     { setError('API key is required'); return; }
    if (!form.secretKey.trim())  { setError('Secret key is required'); return; }
    if (needsPass && !form.passphrase.trim()) {
      setError('Passphrase is required for this exchange'); return;
    }

    try {
      const account = await dispatch(addAccount({
        exchange:   form.exchange,
        apiKey:     form.apiKey.trim(),
        secretKey:  form.secretKey.trim(),
        passphrase: form.passphrase.trim() || undefined,
        label:      form.label.trim() || selected?.name || form.exchange,
      })).unwrap();
      toast.success(`${selected?.name || form.exchange} connected!`);
      onSuccess?.(account);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to connect — check your API keys');
    }
  };

  const inputCls = `w-full px-3 py-2 text-sm bg-brandDark-800 border border-brandDark-600 rounded-xl
    text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500`;

  return (
    <div className={`space-y-3 ${compact ? '' : 'p-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/5'}`}>
      {!compact && (
        <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Connect a Live Exchange
        </p>
      )}

      {/* Exchange selector */}
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">Exchange</label>
        <select
          value={form.exchange}
          onChange={e => set('exchange', e.target.value)}
          className={inputCls}
        >
          <option value="">Select exchange…</option>
          {SUPPORTED_EXCHANGES.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">API Key</label>
        <input
          type="text"
          value={form.apiKey}
          onChange={e => set('apiKey', e.target.value)}
          placeholder="Paste your API key"
          className={inputCls}
        />
      </div>

      {/* Secret Key */}
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">Secret Key</label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            value={form.secretKey}
            onChange={e => set('secretKey', e.target.value)}
            placeholder="Paste your secret key"
            className={`${inputCls} pr-9`}
          />
          <button
            type="button"
            onClick={() => setShowSecret(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Passphrase — only for exchanges that need it */}
      {needsPass && (
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Passphrase</label>
          <input
            type="password"
            value={form.passphrase}
            onChange={e => set('passphrase', e.target.value)}
            placeholder="Required for this exchange"
            className={inputCls}
          />
        </div>
      )}

      {/* Label */}
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">
          Label <span className="text-gray-600">(optional)</span>
        </label>
        <input
          type="text"
          value={form.label}
          onChange={e => set('label', e.target.value)}
          placeholder="e.g. Main trading account"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </p>
      )}

      <p className="text-[11px] text-gray-600">
        Use <strong className="text-gray-500">read-only + trade</strong> permissions. Never enable withdrawals.
      </p>

      <button
        onClick={handleConnect}
        disabled={actionLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {actionLoading
          ? <Loader className="w-4 h-4 animate-spin" />
          : <Plus className="w-4 h-4" />}
        {actionLoading ? 'Connecting…' : 'Connect Exchange'}
      </button>
    </div>
  );
}
