import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronRight, ChevronLeft, Bot, FlaskConical, Zap, Shield, CheckCircle,
  Loader, AlertCircle, Plus, Info, TrendingUp, TrendingDown, Target, RefreshCw, Wallet
} from 'lucide-react';
import { createBot, fetchStrategies } from '../redux/slices/botSlice';
import { fetchAccounts, fetchAccountBalance } from '../redux/slices/exchangeAccountSlice';
import { fetchDemoAccount } from '../redux/slices/demoSlice';

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
  executionMode: 'auto',
  cooldownMinutes: 30,
  name: '',
  capitalAllocation: { totalCapital: 100, currency: 'USDT', maxOpenPositions: 1 },
  riskParams: { globalDrawdownLimitPercent: 10, dailyLossLimitPercent: 5 },
  strategyParams: {
    minConfidencePercent: 60,
    maxConcurrentTrades:  1,
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

  const { loading: botLoading }   = useSelector(state => state.bots);
  const { accounts, balances }    = useSelector(state => state.exchangeAccounts);
  const demoAccount               = useSelector(state => state.demo?.account);

  const [step, setStep]           = useState(0);
  const [fetchedBalance, setFetchedBalance] = useState(null);   // { usdt, total, fetchedAt }
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError]     = useState(null);
  const [allocPct, setAllocPct]   = useState(20); // % of balance to allocate

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
    dispatch(fetchDemoAccount());
  }, [dispatch]);

  // Auto-fetch balance when demo/exchange account changes
  const loadBalance = useCallback(async () => {
    setFetchedBalance(null);
    setBalanceError(null);

    if (form.isDemo) {
      // Demo: use demo account balance directly
      const bal = demoAccount?.balance ?? null;
      if (bal !== null) {
        setFetchedBalance({ usdt: bal, source: 'demo' });
        const alloc = Math.round(bal * allocPct / 100 * 100) / 100;
        setForm(f => ({ ...f, capitalAllocation: { ...f.capitalAllocation, totalCapital: alloc } }));
      }
      return;
    }

    if (!form.exchangeAccountId) return;

    setBalanceLoading(true);
    try {
      const res = await dispatch(fetchAccountBalance(form.exchangeAccountId)).unwrap();
      const usdtEntry = (res.balances || []).find(b =>
        b.currency === 'USDT' || b.asset === 'USDT'
      );
      const usdt = usdtEntry?.free ?? usdtEntry?.available ?? usdtEntry?.total ?? 0;
      setFetchedBalance({ usdt, fetchedAt: res.fetchedAt, source: 'live' });
      const alloc = Math.round(usdt * allocPct / 100 * 100) / 100;
      setForm(f => ({ ...f, capitalAllocation: { ...f.capitalAllocation, totalCapital: alloc } }));
    } catch (err) {
      setBalanceError('Could not fetch balance. You can enter it manually below.');
    } finally {
      setBalanceLoading(false);
    }
  }, [dispatch, form.isDemo, form.exchangeAccountId, demoAccount, allocPct]);

  // Fetch when account selection changes or demo toggles
  useEffect(() => {
    if (form.isDemo || form.exchangeAccountId) loadBalance();
  }, [form.isDemo, form.exchangeAccountId]);

  // Recompute allocation when slider changes
  useEffect(() => {
    if (fetchedBalance?.usdt) {
      const alloc = Math.round(fetchedBalance.usdt * allocPct / 100 * 100) / 100;
      setForm(f => ({ ...f, capitalAllocation: { ...f.capitalAllocation, totalCapital: alloc } }));
    }
  }, [allocPct, fetchedBalance]);

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
          <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">SmartSignal Bot — quality over quantity</p>
        </div>
        <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
          The bot scans and scores signals every 5 minutes across multiple indicators — trend alignment,
          momentum, volume, and confidence. It picks only the single highest-scoring opportunity and
          waits for it to close before looking again.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            ['Signal selection', 'Best scored signal only'],
            ['Scoring factors',  'MTF · Momentum · Volume'],
            ['Trades at once',   '1 (focus, not scatter)'],
            ['R:R minimum',      '1:2 guaranteed'],
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

      {/* Execution Mode */}
      <div className="p-4 space-y-3 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Execution Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update('executionMode', 'auto')}
            className={`p-3 rounded-xl border text-left transition-colors ${form.executionMode === 'auto' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-200 dark:border-brandDark-600 hover:bg-gray-100 dark:hover:bg-brandDark-600'}`}
          >
            <div className={`text-sm font-semibold mb-1 ${form.executionMode === 'auto' ? 'text-primary-400' : 'text-gray-900 dark:text-white'}`}>
              ⚡ Auto
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bot selects and executes the best signal automatically. No action needed.</div>
          </button>
          <button
            type="button"
            onClick={() => update('executionMode', 'manual')}
            className={`p-3 rounded-xl border text-left transition-colors ${form.executionMode === 'manual' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-200 dark:border-brandDark-600 hover:bg-gray-100 dark:hover:bg-brandDark-600'}`}
          >
            <div className={`text-sm font-semibold mb-1 ${form.executionMode === 'manual' ? 'text-primary-400' : 'text-gray-900 dark:text-white'}`}>
              👆 Manual
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bot shows you the top 3 signals. You pick which one to execute.</div>
          </button>
        </div>
        {form.executionMode === 'manual' && (
          <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            In manual mode the bot won't trade on its own. You'll receive signal suggestions and confirm each trade before it executes.
          </p>
        )}
      </div>

      {/* Account Balance */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-primary-400" /> Account Balance
          </h3>
          <button
            type="button"
            onClick={loadBalance}
            disabled={balanceLoading}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${balanceLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Fetched balance display */}
        {balanceLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader className="w-4 h-4 animate-spin" /> Fetching your balance...
          </div>
        ) : fetchedBalance ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-600">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                {fetchedBalance.source === 'demo' ? 'Demo Account Balance' : 'Available USDT'}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${fetchedBalance.usdt?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-gray-400 ml-1">USDT</span>
              </p>
            </div>
            {fetchedBalance.source === 'live' && (
              <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">Live</span>
            )}
            {fetchedBalance.source === 'demo' && (
              <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">Demo</span>
            )}
          </div>
        ) : balanceError ? (
          <div className="space-y-2">
            <p className="text-xs text-yellow-400">{balanceError}</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter balance manually, e.g. 500"
              value={form.capitalAllocation.totalCapital}
              onFocus={e => e.target.select()}
              onChange={e => {
                const v = e.target.value.trim();
                updateNested('capitalAllocation', 'totalCapital', v === '' ? '' : parseFloat(v));
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        ) : null}

        {/* Allocation slider */}
        {fetchedBalance && !balanceError && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1">
                How much to allocate to this bot?
                <FieldHint text="You don't have to give the bot your full balance. Allocate only what you're comfortable with this bot managing." />
              </label>
              <span className="text-xs font-bold text-primary-400">{allocPct}%</span>
            </div>
            <input
              type="range"
              min={5} max={100} step={5}
              value={allocPct}
              onChange={e => setAllocPct(parseInt(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5%</span>
              <span className="text-white font-semibold">
                Bot gets: ${form.capitalAllocation.totalCapital?.toFixed(2)} USDT
              </span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Risk preset */}
        <div>
          <label className="flex items-center mb-2 text-xs font-medium text-gray-900 dark:text-white">
            How much can you afford to lose per trade?
            <FieldHint text="The bot uses this to calculate how many units to buy. Your actual loss is capped at this amount if the stop-loss is hit." />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'safe',       pct: 1, label: 'Safe',       color: 'border-green-500 bg-green-500/10 text-green-400' },
              { key: 'moderate',   pct: 2, label: 'Moderate',   color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
              { key: 'aggressive', pct: 5, label: 'Aggressive', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
            ].map(r => {
              const selected = (form.strategyParams.riskPerTrade ?? 2) === r.pct;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => updateParams('riskPerTrade', r.pct)}
                  className={`p-3 rounded-xl border text-center transition-colors ${selected ? r.color : 'border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brandDark-600'}`}
                >
                  <div className="text-sm font-bold">{r.label}</div>
                  <div className="text-xs mt-0.5 opacity-75">{r.pct}% risk</div>
                </button>
              );
            })}
          </div>
          {(form.capitalAllocation.totalCapital || 0) > 0 && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              If this trade goes wrong, you lose a maximum of{' '}
              <span className="text-red-400 font-semibold">
                ${((form.capitalAllocation.totalCapital || 0) * (form.strategyParams.riskPerTrade ?? 2) / 100).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 leading-relaxed">
          Entry price, stop-loss, and take-profit are calculated automatically using ATR — always at least 1:2 risk-to-reward.
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
        <div className="space-y-4">
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Stop trading if I lose this much in a day (%)
              <FieldHint text="Once daily losses hit this percentage of your balance, the bot pauses until tomorrow. Recommended: 3–5%." />
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={form.riskParams.dailyLossLimitPercent}
                onFocus={e => e.target.select()}
                onChange={e => updateNested('riskParams', 'dailyLossLimitPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-28 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
              />
              {(form.capitalAllocation.totalCapital || 0) > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  = <span className="text-red-400 font-semibold">${((form.capitalAllocation.totalCapital || 0) * (form.riskParams.dailyLossLimitPercent || 5) / 100).toFixed(2)}</span> max daily loss
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Wait this long between trades (minutes)
              <FieldHint text="Prevents the bot from overtrading. After each trade closes, the bot waits this long before entering again. Recommended: 30 min." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.cooldownMinutes ?? 30}
              onFocus={e => e.target.select()}
              onChange={e => update('cooldownMinutes', e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-28 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 rounded-lg px-3 py-2">
          ⚠ After 2 losing trades in a row, the bot automatically pauses for 1 hour before trying again.
        </p>
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
            ['Mode',           form.isDemo ? 'Demo (Paper Trading)' : 'Live Trading'],
            ['Exchange',       accountLabel ? `${form.exchange} — ${accountLabel}` : form.exchange],
            ['Market',         form.marketType],
            ['Execution',      form.executionMode === 'auto' ? '⚡ Auto — bot trades on its own' : '👆 Manual — you approve each trade'],
            ['Strategy',       prefill ? 'AI Signal (single pair)' : 'SmartSignal Bot'],
            ['Pair',           prefill ? prefill.pair?.replace('USDT', '/USDT') : 'Automatic (best scored signal)'],
            ['Balance',        fetchedBalance ? `$${fetchedBalance.usdt?.toFixed(2)} USDT (${fetchedBalance.source})` : '—'],
            ['Bot Allocation', `$${form.capitalAllocation.totalCapital} USDT (${allocPct}% of balance)`],
            ['Max Trades',     1],
            ['Risk/Trade',     `${form.strategyParams.riskPerTrade}%`],
            ['Max Loss/Trade', `$${((form.capitalAllocation.totalCapital || 0) * (form.strategyParams.riskPerTrade || 2) / 100).toFixed(2)}`],
            ['Cooldown',       `${form.cooldownMinutes ?? 30} min between trades`],
            ...(form.marketType === 'futures' ? [['Leverage', `${form.strategyParams.leverage}×`]] : []),
            ['Daily Loss Cap', `${form.riskParams.dailyLossLimitPercent}%`],
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
