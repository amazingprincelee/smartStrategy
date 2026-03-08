import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronRight, ChevronLeft, Bot, FlaskConical, Zap, Shield, CheckCircle,
  Loader, Star, AlertCircle, Plus, Lock, Crown, Info, Search, X
} from 'lucide-react';
import { createBot, fetchStrategies } from '../redux/slices/botSlice';
import { fetchAccounts } from '../redux/slices/exchangeAccountSlice';
import { fetchAllExchangePairs, fetchExchangePairsForExchange } from '../redux/slices/signalSlice';

const isPremiumUser = (role) => role === 'premium' || role === 'admin';

// Free tier: only DCA is available
const FREE_STRATEGIES = ['dca'];

// Pairs actively scanned by SmartStrategy's signal engine — best signal coverage
const COIN_GROUPS = [
  {
    label: 'SmartStrategy signal pairs — actively scanned every 15 min',
    coins: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LINK/USDT', 'DOT/USDT'],
  },
  {
    label: 'Other popular pairs',
    coins: ['MATIC/USDT', 'ATOM/USDT', 'NEAR/USDT', 'ARB/USDT', 'OP/USDT', 'INJ/USDT', 'SUI/USDT', 'LTC/USDT', 'UNI/USDT'],
  },
];

const STRATEGY_ACTIVITY = {
  smart_signal: { label: 'High activity', detail: 'Checks SmartStrategy signals every 5 min and enters the best opportunities on your exchange' },
  dca:          { label: 'Very high activity', detail: 'Buys on a fixed schedule regardless of market conditions' },
};

const ACTIVITY_BADGE = {
  'Very high activity': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'High activity':      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Medium activity':    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Lower activity':     'bg-gray-100 text-gray-600 dark:bg-brandDark-600 dark:text-gray-400',
};

const RISK_COLORS = {
  low: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
  medium: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
  high: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
};

const RISK_BADGE = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const TP_MODE_INFO = {
  structure: {
    label: 'Structure-based (smart)',
    hint: 'Targets the nearest resistance level based on recent price structure. Most adaptive — exits near a real supply zone rather than a fixed number.',
  },
  atr: {
    label: 'ATR-based',
    hint: 'Sets take profit at 3× the Average True Range (ATR) above entry. Automatically widens on volatile days and tightens on calm days.',
  },
  fixed: {
    label: 'Fixed %',
    hint: 'Closes the position once price rises by the % you specify from your entry. Simple and predictable, but ignores actual market structure.',
  },
};

const steps = ['Mode & Exchange', 'Market & Pair', 'Strategy', 'Configure', 'Review & Launch'];

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

const CreateBot = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { strategies, loading: botLoading } = useSelector(state => state.bots);
  const { accounts } = useSelector(state => state.exchangeAccounts);
  const role = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  const exchangePairsMap      = useSelector(state => state.signals.exchangePairsMap);
  const exchangePairsFetching = useSelector(state => state.signals.exchangePairsFetching);

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    isDemo: true,
    exchangeAccountId: '',
    exchange: '',
    symbol: 'MULTI',          // SmartSignal trades any pair; DCA overrides this in step 2
    marketType: 'futures',
    strategyId: searchParams.get('strategy') || 'smart_signal',
    name: '',
    capitalAllocation: { totalCapital: 100, currency: 'USDT', maxOpenPositions: 3 },
    riskParams: { globalDrawdownLimitPercent: 10, dailyLossLimitPercent: 5 },
    strategyParams: {
      // SmartSignal defaults
      minConfidencePercent: 70,
      maxConcurrentTrades:  2,
      riskPerTrade:         2,
      signalMaxAgeMinutes:  20,
      leverage:             3,
      // DCA defaults
      dcaIntervalHours:   24,
      dcaAmountPerOrder:  25,
    },
  });

  useEffect(() => {
    dispatch(fetchStrategies());
    dispatch(fetchAccounts());
    // Preload all exchange pairs into global Redux state (no-op if already loaded)
    if (Object.keys(exchangePairsMap).length === 0) {
      dispatch(fetchAllExchangePairs());
    }
  }, [dispatch]);

  // Pre-select strategy if passed via URL
  useEffect(() => {
    const sid = searchParams.get('strategy');
    if (sid) setForm(f => ({ ...f, strategyId: sid }));
  }, [searchParams]);

  // Ensure free users always have an allowed strategy selected
  useEffect(() => {
    if (!isPremium && !FREE_STRATEGIES.includes(form.strategyId)) {
      setForm(f => ({ ...f, strategyId: FREE_STRATEGIES[0] }));
    }
  }, [isPremium]);

  // When user picks an exchange, fetch its pairs if not already in Redux.
  // This handles the first-run race where the DB refresh hasn't completed yet.
  useEffect(() => {
    if (!form.exchange) return;
    if ((exchangePairsMap[form.exchange]?.[form.marketType] || []).length > 0) return;
    dispatch(fetchExchangePairsForExchange({ exchange: form.exchange, market: form.marketType }));
  }, [form.exchange, form.marketType]);


  const selectedStrategy = strategies.find(s => s.id === form.strategyId);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const updateNested = (parent, key, value) => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: value } }));
  const updateParams = (key, value) => setForm(f => ({ ...f, strategyParams: { ...f.strategyParams, [key]: value } }));

  // Build default strategy params when strategy changes
  useEffect(() => {
    if (selectedStrategy?.defaultParams) {
      setForm(f => ({ ...f, strategyParams: { ...selectedStrategy.defaultParams, ...f.strategyParams } }));
    }
  }, [form.strategyId]);

  const portionSize = (
    (form.capitalAllocation.totalCapital || 0) /
    (form.strategyParams.portions || form.capitalAllocation.maxOpenPositions || 5)
  ).toFixed(2);

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

  const canProceed = () => {
    if (step === 0) return form.isDemo || form.exchangeAccountId;
    if (step === 1) {
      // SmartSignal doesn't need a pair — only an exchange
      if (form.strategyId === 'smart_signal') return !!form.exchange;
      return !!(form.symbol && form.symbol !== 'MULTI' && form.exchange);
    }
    if (step === 2) return !!form.strategyId;
    if (step === 3) return (form.capitalAllocation.totalCapital || 0) >= 10;
    return true;
  };

  // ────────────────────────────────────
  // Step 0: Mode & Exchange
  // ────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Trading Mode</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => update('isDemo', true)}
          className={`p-5 rounded-xl border-2 text-left transition-colors ${form.isDemo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-brandDark-700 hover:border-blue-300'}`}
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
          className={`p-5 rounded-xl border-2 text-left transition-colors ${!form.isDemo ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-brandDark-700 hover:border-primary-300'}`}
        >
          <Zap className="w-8 h-8 mb-3 text-primary-500" />
          <p className="font-semibold text-gray-900 dark:text-white">Live Trading</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Trade with real funds on your connected exchange.
          </p>
          {!form.isDemo && <CheckCircle className="w-5 h-5 mt-3 text-primary-500" />}
        </button>
      </div>

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
                  onClick={() => { update('exchangeAccountId', acc._id); update('exchange', acc.exchange); }}
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
    </div>
  );

  // ────────────────────────────────────
  // Step 1: Market & Pair
  // ────────────────────────────────────
  const renderStep1 = () => {
    const isSmartSignal = form.strategyId === 'smart_signal';
    const EXCHANGE_LIST = [
      { id: 'okx',    name: 'OKX'        },
      { id: 'kucoin', name: 'KuCoin'     },
      { id: 'bitget', name: 'Bitget'     },
      { id: 'phemex', name: 'Phemex'     },
      { id: 'gate',   name: 'Gate.io'    },
      { id: 'mexc',   name: 'MEXC'       },
      { id: 'huobi',  name: 'HTX (Huobi)'},
      { id: 'kraken', name: 'Kraken'     },
    ];

    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Market & Exchange</h2>

        {/* Exchange selector — always shown */}
        {form.isDemo ? (
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              Exchange
              <FieldHint text="The exchange whose live price data the bot will use to simulate trades in demo mode." />
            </label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">Choose an exchange to pull live market data from.</p>
            <select
              value={form.exchange}
              onChange={e => update('exchange', e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            >
              <option value="" disabled>Select Exchange</option>
              {EXCHANGE_LIST.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
        ) : (
          /* Live trading — exchange comes from the selected account */
          form.exchangeAccountId && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Using exchange from your connected account — <span className="font-semibold capitalize">{form.exchange}</span>
            </div>
          )
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

        {/* SmartSignal — auto-pair info panel */}
        {isSmartSignal ? (
          <div className="p-5 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">Pairs are selected automatically</p>
            </div>
            <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
              SmartSignal Bot doesn't trade a single fixed pair. Instead, it continuously monitors
              SmartStrategy's signal engine and enters trades on whichever pairs currently have the
              highest-confidence setups — across your entire exchange.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                ['Signal scan',    'Every 5 minutes'],
                ['Min confidence', '70%+ (configurable)'],
                ['Max open trades','2 at once (configurable)'],
                ['Entry / SL / TP','Set by signal engine'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[10px] font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wide">{k}</span>
                  <span className="text-xs font-semibold text-primary-900 dark:text-primary-200">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* DCA — normal pair picker */
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Trading Pair</label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">
              {form.exchange
                ? 'Search or type any USDT pair from the selected exchange.'
                : 'Type any USDT pair (e.g. PEPE/USDT, WIF/USDT) or pick from the list below.'}
            </p>

            {/* Search / custom pair input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={form.symbol === 'MULTI' ? '' : form.symbol}
                onChange={e => update('symbol', e.target.value.toUpperCase())}
                placeholder="Search or type any pair — e.g. BTC/USDT, PEPE/USDT…"
                className="w-full pl-9 pr-9 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              {form.symbol && form.symbol !== 'MULTI' && (
                <button
                  type="button"
                  onClick={() => update('symbol', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {exchangePairsFetching && form.exchange ? (
              <div className="flex items-center gap-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                <Loader className="w-4 h-4 animate-spin text-primary-500" />
                Loading {form.exchange} pairs…
              </div>
            ) : (() => {
              const exchangePairs = form.exchange
                ? (exchangePairsMap[form.exchange]?.[form.marketType] || [])
                : [];
              const allCoins    = exchangePairs.length > 0 ? exchangePairs : COIN_GROUPS.flatMap(g => g.coins);
              const rawSymbol   = form.symbol === 'MULTI' ? '' : form.symbol;
              const searchTerm  = rawSymbol.replace('/USDT', '').replace('USDT', '').trim();
              const isSearching = searchTerm.length > 0;
              const filtered    = isSearching
                ? allCoins.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50)
                : allCoins.slice(0, exchangePairs.length > 0 ? 30 : allCoins.length);
              const isCustom    = rawSymbol && rawSymbol.includes('/') && !allCoins.includes(rawSymbol);

              return (
                <>
                  {isCustom && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs font-mono font-semibold text-green-700 dark:text-green-300">{rawSymbol}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">— custom pair confirmed</span>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-500">
                      {exchangePairs.length > 0
                        ? isSearching
                          ? `${filtered.length} pair${filtered.length !== 1 ? 's' : ''} found on ${form.exchange} — click to select`
                          : `Showing top 30 of ${allCoins.length} ${form.exchange} USDT pairs — type to search all`
                        : isSearching && filtered.length < allCoins.length
                          ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''} — click to select`
                          : 'Popular pairs — click to select'}
                    </p>
                    {filtered.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filtered.map(pair => (
                          <button
                            key={pair}
                            onClick={() => update('symbol', pair)}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-mono ${
                              form.symbol === pair
                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                : 'border-gray-200 dark:border-brandDark-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600'
                            }`}
                          >
                            {pair}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        No matches — your custom pair above will be used.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────
  // Step 2: Strategy
  // ────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Strategy</h2>
        {!isPremium && (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
            <Crown className="w-3.5 h-3.5" />
            Free plan
          </span>
        )}
      </div>

      {!isPremium && (
        <div className="flex items-start gap-3 p-3 text-xs border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
          <Crown className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Free plan includes <strong>Simple DCA</strong> only. Upgrade to Premium to unlock <strong>SmartSignal Bot</strong> — automated trading on high-confidence signals across any pair.</span>
        </div>
      )}

      {botLoading.strategies ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {strategies.map(s => {
            const isLocked = !isPremium && !FREE_STRATEGIES.includes(s.id);
            const isSelected = form.strategyId === s.id;

            return (
              <div key={s.id} className="relative">
                <button
                  onClick={() => {
                    if (isLocked) {
                      toast.info('Upgrade to Premium to unlock this strategy.');
                      return;
                    }
                    update('strategyId', s.id);
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden ${
                    isLocked
                      ? 'opacity-60 cursor-not-allowed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                      : isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-gray-700 shadow-lg ring-1 ring-primary-400/30'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md'
                  }`}
                >
                  {/* Left accent strip for selected */}
                  {isSelected && !isLocked && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-l-xl" />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center min-w-0 gap-2 pl-1">
                      {isLocked && <Lock className="flex-shrink-0 w-4 h-4 text-gray-400" />}
                      <span className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{s.name}</span>
                      {s.isDefault && !isLocked && <Star className="flex-shrink-0 w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="flex flex-wrap items-center justify-end flex-shrink-0 gap-1.5">
                      {isSelected && !isLocked ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-500 text-white">
                          <CheckCircle className="w-3 h-3" />
                          Selected
                        </span>
                      ) : isLocked ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 whitespace-nowrap">
                          <Crown className="w-3 h-3" />
                          Premium
                        </span>
                      ) : (
                        <>
                          {STRATEGY_ACTIVITY[s.id] && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${ACTIVITY_BADGE[STRATEGY_ACTIVITY[s.id].label]}`}>
                              {STRATEGY_ACTIVITY[s.id].label}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${RISK_BADGE[s.riskLevel]}`}>
                            {s.riskLevel} risk
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{s.description}</p>
                  {!isLocked && STRATEGY_ACTIVITY[s.id] && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{STRATEGY_ACTIVITY[s.id].detail}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{s.timeframe}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    {s.supportedMarkets.map(m => <span key={m} className="text-xs text-gray-400 dark:text-gray-500 capitalize">{m}</span>)}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ────────────────────────────────────
  // Step 3: Configure
  // ────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Bot</h2>

      {/* Capital */}
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Capital Allocation</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Total Capital (USDT)
              <FieldHint text="Total USDT the bot is allowed to use. This amount is split into equal portions across multiple buy orders." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              min="10"
              value={form.capitalAllocation.totalCapital}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('capitalAllocation', 'totalCapital', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Max Open Positions
              <FieldHint text="Maximum number of concurrent trades. Your capital is divided by this number — e.g. $500 capital ÷ 5 positions = $100 per trade." />
            </label>
            <input
              type="text"
              inputMode="numeric"
              min="1"
              max="10"
              value={form.capitalAllocation.maxOpenPositions}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('capitalAllocation', 'maxOpenPositions', e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">Portion size: ~${portionSize} USDT each</p>
      </div>

      {/* SmartSignal params */}
      {selectedStrategy?.id === 'smart_signal' && (
        <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">SmartSignal Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Min Confidence (%)
                <FieldHint text="Only trade signals with at least this confidence score. Higher = fewer but stronger entries. 70% is a solid starting point." />
              </label>
              <input type="text" inputMode="numeric" min="50" max="99"
                value={form.strategyParams.minConfidencePercent ?? 70}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('minConfidencePercent', e.target.value === '' ? '' : Math.max(50, Math.min(99, parseInt(e.target.value) || 70)))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Max Concurrent Trades
                <FieldHint text="The maximum number of open positions the bot can hold at once. Recommended: 2–4." />
              </label>
              <input type="text" inputMode="numeric" min="1" max="10"
                value={form.strategyParams.maxConcurrentTrades ?? 2}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('maxConcurrentTrades', e.target.value === '' ? '' : Math.max(1, Math.min(10, parseInt(e.target.value) || 2)))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Risk per Trade (%)
                <FieldHint text="Percentage of total capital used per trade. 2% means a $1,000 account risks $20 per position." />
              </label>
              <input type="text" inputMode="numeric" min="0.5" max="10" step="0.5"
                value={form.strategyParams.riskPerTrade ?? 2}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('riskPerTrade', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Max Signal Age (min)
                <FieldHint text="Reject signals older than this many minutes. Fresher signals = closer to original entry price. Recommended: 15–30." />
              </label>
              <input type="text" inputMode="numeric" min="5" max="120"
                value={form.strategyParams.signalMaxAgeMinutes ?? 20}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('signalMaxAgeMinutes', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 leading-relaxed">
            Entry price, stop-loss, and take-profit are set automatically by SmartStrategy's signal engine — 1:2 R:R minimum.
          </p>
        </div>
      )}

      {/* DCA params */}
      {selectedStrategy?.id === 'dca' && (
        <div className="p-4 space-y-4 bg-gray-50 dark:bg-brandDark-700 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">DCA Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Interval (hours)
                <FieldHint text="How often the bot places a new buy order. 24 = once per day, 168 = once per week. Smaller intervals accumulate faster but use capital quicker." />
              </label>
              <input type="text" inputMode="numeric" min="1" value={form.strategyParams.dcaIntervalHours ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('dcaIntervalHours', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
            <div>
              <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
                Amount per order (USDT)
                <FieldHint text="How much USDT is spent on each scheduled buy. Keep this within your Total Capital budget to avoid running out of funds." />
              </label>
              <input type="text" inputMode="numeric" min="10" value={form.strategyParams.dcaAmountPerOrder ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => updateParams('dcaAmountPerOrder', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Leverage — shown for futures bots using DCA or SmartSignal */}
      {form.marketType === 'futures' && ['dca', 'smart_signal'].includes(selectedStrategy?.id) && (
        <div className="p-4 space-y-3 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl">
          <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Futures Leverage</h3>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-orange-700 dark:text-orange-400">
              Leverage (1×–20×)
              <FieldHint text="Multiplies your position size. 3× means $100 USDT controls a $300 position. The bot's ATR stop-loss exits well before liquidation risk. Recommended: 2–5×. Avoid going above 10× as a beginner." />
            </label>
            <input
              type="text" inputMode="numeric" min="1" max="20" step="1"
              value={form.strategyParams.leverage ?? ''}
              onFocus={e => e.target.select()}
              onChange={e => updateParams('leverage', e.target.value === '' ? '' : Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-orange-300 rounded-lg dark:border-orange-700 dark:bg-brandDark-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              ⚠ Higher leverage increases both potential profit and risk of liquidation.
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
              <FieldHint text="If your account loses this % of its starting capital in total, the bot stops all trading automatically to prevent further losses. E.g. 15 means the bot halts when you're down 15%." />
            </label>
            <input type="text" inputMode="numeric" min="5" max="50" value={form.riskParams.globalDrawdownLimitPercent}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('riskParams', 'globalDrawdownLimitPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
          </div>
          <div>
            <label className="flex items-center mb-1 text-xs font-medium text-gray-900 dark:text-white">
              Daily Loss Limit (%)
              <FieldHint text="Maximum loss the bot is allowed to take within a single day. Once hit, the bot pauses until the next trading session. Helps contain runaway losses on bad market days." />
            </label>
            <input type="text" inputMode="numeric" min="1" max="20" value={form.riskParams.dailyLossLimitPercent}
              onFocus={e => e.target.select()}
              onChange={e => updateNested('riskParams', 'dailyLossLimitPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-brandDark-600 dark:bg-brandDark-800 dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────
  // Step 4: Review
  // ────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review & Launch</h2>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Bot Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. My BTC Grid Bot"
          className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
        />
      </div>

      <div className="p-4 space-y-2 text-sm bg-gray-50 dark:bg-brandDark-700 rounded-xl">
        {[
          ['Mode', form.isDemo ? 'Demo (Paper Trading)' : 'Live Trading'],
          ['Exchange', form.exchange || '—'],
          ['Pair', form.symbol === 'MULTI' ? 'Auto (signal-based)' : form.symbol],
          ['Market', form.marketType],
          ['Strategy', selectedStrategy?.name || form.strategyId],
          ['Capital', `$${form.capitalAllocation.totalCapital} USDT`],
          ['Max Positions', form.capitalAllocation.maxOpenPositions],
          ['Global Stop', `${form.riskParams.globalDrawdownLimitPercent}% drawdown`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
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

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="max-w-2xl p-4 mx-auto md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Bot</h1>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 ${
                i < step ? 'bg-primary-600 text-white' :
                i === step ? 'bg-primary-600 text-white ring-2 ring-primary-300' :
                'bg-gray-200 dark:bg-brandDark-700 text-gray-400'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-brandDark-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Step {step + 1} of {steps.length}: <span className="font-medium text-gray-700 dark:text-gray-100">{steps[step]}</span>
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

        {step < steps.length - 1 ? (
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
