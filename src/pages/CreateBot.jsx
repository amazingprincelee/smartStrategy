import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronRight, ChevronLeft, Bot, FlaskConical, Zap, Shield, CheckCircle,
  Loader, AlertCircle, Plus, Info, TrendingUp, TrendingDown, Target
} from 'lucide-react';
import { createBot, fetchStrategies } from '../redux/slices/botSlice';
import { fetchAccounts } from '../redux/slices/exchangeAccountSlice';

// Steps
const STEPS = ['Mode & Exchange', 'Configure', 'Review & Launch'];

const EXCHANGE_LIST = [
  { id: 'binance', name: 'Binance',     badge: 'Popular' },
  { id: 'bybit',   name: 'Bybit',       badge: 'Popular' },
  { id: 'okx',     name: 'OKX'         },
  { id: 'kucoin',  name: 'KuCoin'      },
  { id: 'bitget',  name: 'Bitget'      },
  { id: 'gate',    name: 'Gate.io'     },
  { id: 'mexc',    name: 'MEXC'        },
  { id: 'phemex',  name: 'Phemex'      },
  { id: 'huobi',   name: 'HTX (Huobi)' },
  { id: 'kraken',  name: 'Kraken'      },
];

/* ── Inline tooltip hint ── */
function FieldHint({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(v => !v)}
        className="inline-flex items-center justify-center w-4 h-4 text-gray-500 transition-colors bg-gray-200 rounded-full dark:bg-brandDark-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-brandDark-500"
        aria-label="More info"
      >
        <Info className="w-2.5 h-2.5" />
      </button>
      {show && (
        <span className="absolute z-50 w-56 px-3 py-2 mb-2 text-xs leading-relaxed text-white -translate-x-1/2 bg-gray-900 rounded-lg shadow-xl pointer-events-none bottom-full left-1/2 dark:bg-gray-950">
          {text}
          <span className="absolute -translate-x-1/2 border-4 border-transparent top-full left-1/2 border-t-gray-900 dark:border-t-gray-950" />
        </span>
      )}
    </span>
  );
}

const DEFAULTS = {
  isDemo: true,
  exchangeAccountId: '',
  exchange: '',
  symbol: 'MULTI',
  marketType: 'futures',
  strategyId: 'smart_signal',
  name: '',
  capitalAllocation: { totalCapital: 100, currency: 'USDT', maxOpenPositions: 3 },
  riskParams: { globalDrawdownLimitPercent: 10, dailyLossLimitPercent: 5 },
  strategyParams: {
    minConfidencePercent: 60,
    maxConcurrentTrades:  3,
    riskPerTrade:         2,
    signalMaxAgeMinutes:  120,
    leverage:             3,
  },
};

const CreateBot = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const prefill   = location.state?.prefill ?? null;

  const { loading: botLoading } = useSelector(state => state.bots);
  const { accounts }            = useSelector(state => state.exchangeAccounts);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    if (!prefill) return DEFAULTS;
    const base = prefill.pair?.replace('USDT', '') ?? '';
    return {
      ...DEFAULTS,
      symbol:     prefill.pair      ?? DEFAULTS.symbol,
      marketType: prefill.marketType ?? DEFAULTS.marketType,
      strategyId: 'ai_signal',
      name: `${base} ${prefill.signal ?? ''} Trade`.trim(),
    };
  });

  useEffect(() => {
    dispatch(fetchStrategies());
    dispatch(fetchAccounts());
  }, [dispatch]);

  const update       = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateNested = (parent, key, val) => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: val } }));
  const updateParams = (key, val) => setForm(f => ({ ...f, strategyParams: { ...f.strategyParams, [key]: val } }));

  // ── canProceed ───────────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 0) {
      if (!form.isDemo && !form.exchangeAccountId) return false;
      if (!form.exchange) return false;
      return true;
    }
    if (step === 1) return (form.capitalAllocation.totalCapital || 0) >= 10;
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a bot name');
      return;
    }
    try {
      const bot = await dispatch(createBot(form)).unwrap();
      toast.success(`"${form.name}" is live and trading!`);
      navigate(`/bots/${bot._id}`);
    } catch (err) {
      toast.error(err || 'Failed to create bot');
    }
  };

  // ── Step 0: Mode & Exchange ───────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Trading Mode</h2>

      {/* Demo / Live toggle */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => update('isDemo', true)}
          className={`p-5 rounded-xl border-2 text-left transition-colors ${
            form.isDemo
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-brandDark-700 hover:border-blue-300'
          }`}
        >
          <FlaskConical className="w-8 h-8 mb-3 text-blue-500" />
          <p className="font-semibold text-gray-900 dark:text-white">Demo Account</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Practice with $10,000 virtual balance. No real money at risk.
          </p>
          {form.isDemo && <CheckCircle className="w-5 h-5 mt-3 text-blue-500" />}
        </button>

        <button
          onClick={() => update('isDemo', false)}
          className={`p-5 rounded-xl border-2 text-left transition-colors ${
            !form.isDemo
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-brandDark-700 hover:border-primary-300'
          }`}
        >
          <Zap className="w-8 h-8 mb-3 text-primary-500" />
          <p className="font-semibold text-gray-900 dark:text-white">Live Trading</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Trade with real funds on your connected exchange.
          </p>
          {!form.isDemo && <CheckCircle className="w-5 h-5 mt-3 text-primary-500" />}
        </button>
      </div>

      {/* Live → pick connected account */}
      {!form.isDemo && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Select Exchange Account</h3>
          {accounts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 border border-yellow-200 rounded-lg dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="flex-shrink-0 w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">No exchange accounts connected.</p>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-1 mt-1 text-sm text-primary-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add exchange in Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map(acc => (
                <button
                  key={acc._id}
                  onClick={() => {
                    update('exchangeAccountId', acc._id);
                    update('exchange', acc.exchange);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                    form.exchangeAccountId === acc._id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-brandDark-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 text-xs font-bold uppercase bg-gray-100 rounded-full dark:bg-brandDark-700">
                      {acc.exchange[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{acc.label}</p>
                      <p className="text-xs text-gray-500 capitalize">{acc.exchange}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${acc.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {acc.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Demo → pick exchange for price data */}
      {form.isDemo && (
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            Exchange
            <FieldHint text="Which exchange's live prices the bot will use to simulate trades in demo mode." />
          </label>
          <select
            value={form.exchange}
            onChange={e => update('exchange', e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
          >
            <option value="" disabled>Select Exchange</option>
            {EXCHANGE_LIST.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.badge ? `★ ${ex.name}` : ex.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Market type */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Market Type</label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">Spot buys actual coins; Futures trades contracts with optional leverage.</p>
        <div className="flex gap-3">
          {['futures', 'spot'].map(type => (
            <button
              key={type}
              onClick={() => update('marketType', type)}
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                form.marketType === type
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'border-gray-200 dark:border-brandDark-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* SmartSignal info panel */}
      <div className="p-4 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">SmartSignal Bot — pairs selected automatically</p>
        </div>
        <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
          Instead of trading one fixed pair, SmartSignal monitors the signal engine every 5 minutes
          and enters whichever pairs have the highest-confidence setups. Entry price, stop-loss, and
          take-profit are all set by the engine automatically.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            ['Signal scan',     'Every 5 minutes'],
            ['Min confidence',  '60%+ (configurable)'],
            ['Max open trades', '3 at once (configurable)'],
            ['R:R minimum',     '1:2 guaranteed'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[10px] font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wide">{k}</span>
              <span className="text-xs font-semibold text-primary-900 dark:text-primary-200">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Step 1: Configure ─────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Bot</h2>

      {/* Capital */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Capital Allocation</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Total Capital (USDT)
              <FieldHint text="Total USDT the bot is allowed to use across all open trades." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.capitalAllocation.totalCapital}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateNested('capitalAllocation', 'totalCapital', v === '' ? '' : parseFloat(v));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Max Open Positions
              <FieldHint text="Maximum number of trades the bot can hold at once. Capital is split across these slots." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.capitalAllocation.maxOpenPositions}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateNested('capitalAllocation', 'maxOpenPositions', v === '' ? '' : parseInt(v));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ~${((form.capitalAllocation.totalCapital || 0) / (form.capitalAllocation.maxOpenPositions || 3)).toFixed(2)} USDT per trade slot
        </p>
      </div>

      {/* SmartSignal params */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Signal Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Min Confidence
              <FieldHint text="Only enter trades where the signal engine's confidence is at or above this level. Higher = fewer but stronger entries." />
            </label>
            <select
              value={form.strategyParams.minConfidencePercent ?? 60}
              onChange={e => updateParams('minConfidencePercent', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            >
              {[50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map(v => (
                <option key={v} value={v}>{v}%</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Max Concurrent Trades
              <FieldHint text="How many positions the bot can hold at the same time. Recommended: 2–4." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.strategyParams.maxConcurrentTrades ?? 3}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateParams('maxConcurrentTrades', v === '' ? '' : Math.max(1, Math.min(10, parseInt(v) || 3)));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Risk per Trade (%)
              <FieldHint text="Percentage of total capital used per trade. 2% on a $500 account = $10 per position." />
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.strategyParams.riskPerTrade ?? 2}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateParams('riskPerTrade', v === '' ? '' : parseFloat(v));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Max Signal Age (min)
              <FieldHint text="Reject signals older than this. The signal sweep runs every 30 min, so 60–120 min is safe." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.strategyParams.signalMaxAgeMinutes ?? 120}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateParams('signalMaxAgeMinutes', v === '' ? '' : parseInt(v));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 leading-relaxed">
          Entry price, stop-loss, and take-profit are set automatically by the signal engine — 1:2 R:R minimum.
        </p>
      </div>

      {/* Leverage — futures only */}
      {form.marketType === 'futures' && (
        <div className="p-4 space-y-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl">
          <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Futures Leverage</h3>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-orange-700 dark:text-orange-400">
              Leverage (1×–20×)
              <FieldHint text="Multiplies your position size. 3× means $100 controls a $300 position. The ATR stop-loss exits before liquidation risk. Recommended: 2–5×." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.strategyParams.leverage ?? 3}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateParams('leverage', v === '' ? '' : Math.max(1, Math.min(20, parseInt(v) || 1)));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-orange-300 rounded-lg dark:border-orange-700 dark:bg-brandDark-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              ⚠ Higher leverage increases both potential profit and liquidation risk.
            </p>
          </div>
        </div>
      )}

      {/* Risk */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Risk Management</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Global Drawdown Limit (%)
              <FieldHint text="If total losses reach this % of starting capital, the bot halts automatically. E.g. 10 = bot stops after losing 10%." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.riskParams.globalDrawdownLimitPercent}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('riskParams', 'globalDrawdownLimitPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Daily Loss Limit (%)
              <FieldHint text="Maximum loss allowed in one day. Once hit, the bot pauses until tomorrow. Recommended: 3–5%." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.riskParams.dailyLossLimitPercent}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('riskParams', 'dailyLossLimitPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Review & Launch ───────────────────────────────────────────────
  const renderStep2 = () => {
    const accountLabel = accounts.find(a => a._id === form.exchangeAccountId)?.label;
    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review & Launch</h2>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Bot Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. My SmartSignal Bot"
            className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
          />
        </div>

        {prefill && (
          <div className={`p-3 rounded-lg border mb-2 flex items-center gap-2 text-xs ${
            prefill.signal === 'LONG'
              ? 'border-green-500/30 bg-green-500/8 text-green-300'
              : 'border-red-500/30 bg-red-500/8 text-red-300'
          }`}>
            <Target className="w-3.5 h-3.5 flex-shrink-0" />
            Trading: <span className="font-bold ml-1">{prefill.pair?.replace('USDT', '/USDT')} {prefill.signal}</span>
            <span className="ml-auto font-mono">Entry {fmtPrice(prefill.entry)} · SL {fmtPrice(prefill.stopLoss)} · TP {fmtPrice(prefill.takeProfit)}</span>
          </div>
        )}
        <div className="p-4 space-y-2 text-sm bg-gray-50 dark:bg-brandDark-700 rounded-xl">
          {[
            ['Mode',         form.isDemo ? 'Demo (Paper Trading)' : 'Live Trading'],
            ['Exchange',     accountLabel ? `${form.exchange} — ${accountLabel}` : form.exchange],
            ['Market',       form.marketType],
            ['Strategy',     prefill ? 'AI Signal (single pair)' : 'SmartSignal Bot'],
            ['Pair',         prefill ? prefill.pair?.replace('USDT', '/USDT') : 'Automatic (signal-based)'],
            ['Capital',      `$${form.capitalAllocation.totalCapital} USDT`],
            ['Max Trades',   form.capitalAllocation.maxOpenPositions],
            ['Confidence',   `≥ ${form.strategyParams.minConfidencePercent}%`],
            ['Risk/Trade',   `${form.strategyParams.riskPerTrade}%`],
            ...(form.marketType === 'futures' ? [['Leverage', `${form.strategyParams.leverage}×`]] : []),
            ['Drawdown Cap', `${form.riskParams.globalDrawdownLimitPercent}%`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 capitalize dark:text-white">{value}</span>
            </div>
          ))}
        </div>

        {form.isDemo && (
          <div className="flex items-center gap-2 p-3 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
            <FlaskConical className="flex-shrink-0 w-4 h-4" />
            Demo mode: Uses $10,000 virtual balance with live market prices.
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      default: return null;
    }
  };

  const fmtPrice = (p) => {
    if (!p && p !== 0) return '—';
    if (p >= 1000) return `$${Number(p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 1)    return `$${Number(p).toFixed(4)}`;
    return `$${Number(p).toFixed(6)}`;
  };

  return (
    <div className="max-w-2xl p-4 mx-auto md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {prefill ? 'Trade This Signal' : 'Create SmartSignal Bot'}
        </h1>
      </div>

      {/* Signal banner — shown when coming from "Trade This" */}
      {prefill && (
        <div className={`mb-6 p-4 rounded-xl border-2 flex flex-wrap gap-4 items-start ${
          prefill.signal === 'LONG'
            ? 'border-green-500/40 bg-green-500/8'
            : 'border-red-500/40 bg-red-500/8'
        }`}>
          <div className="flex items-center gap-2">
            {prefill.signal === 'LONG'
              ? <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
            }
            <div>
              <p className="text-sm font-bold text-white">
                {prefill.pair?.replace('USDT', '/USDT')} — {prefill.signal}
              </p>
              <p className="text-xs text-gray-400 capitalize">{prefill.marketType ?? 'spot'} signal</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs flex-wrap">
            <div>
              <p className="text-gray-500 mb-0.5">Entry</p>
              <p className="font-mono font-bold text-cyan-300">{fmtPrice(prefill.entry)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Stop Loss</p>
              <p className="font-mono font-bold text-red-400">{fmtPrice(prefill.stopLoss)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Take Profit</p>
              <p className="font-mono font-bold text-green-400">{fmtPrice(prefill.takeProfit)}</p>
            </div>
          </div>
          <p className="w-full text-xs text-gray-500">
            Configure your exchange and capital below, then launch to execute this trade automatically.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 ${
                i < step  ? 'bg-primary-600 text-white' :
                i === step ? 'bg-primary-600 text-white ring-2 ring-primary-300' :
                             'bg-gray-200 dark:bg-brandDark-700 text-gray-400'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-brandDark-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Step {step + 1} of {STEPS.length}: <span className="font-medium text-gray-700 dark:text-gray-100">{STEPS[step]}</span>
        </p>
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-6 mb-6 min-h-[320px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step === 0 ? navigate('/bots') : setStep(s => s - 1)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-brandDark-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || botLoading.action}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {botLoading.action ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {botLoading.action ? 'Launching...' : 'Launch & Start Trading'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateBot;
