import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronRight, ChevronLeft, Bot, FlaskConical, Zap, Shield, CheckCircle,
  Loader, Star, AlertCircle, Plus
} from 'lucide-react';
import { createBot, fetchStrategies } from '../redux/slices/botSlice';
import { fetchAccounts } from '../redux/slices/exchangeAccountSlice';

const POPULAR_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'AVAX/USDT', 'MATIC/USDT', 'DOGE/USDT'];

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

const steps = ['Mode & Exchange', 'Market & Pair', 'Strategy', 'Configure', 'Review & Launch'];

const CreateBot = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { strategies, loading: botLoading } = useSelector(state => state.bots);
  const { accounts } = useSelector(state => state.exchangeAccounts);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    isDemo: true,
    exchangeAccountId: '',
    exchange: 'binance',
    symbol: 'BTC/USDT',
    marketType: 'spot',
    strategyId: searchParams.get('strategy') || 'adaptive_grid',
    name: '',
    capitalAllocation: { totalCapital: 100, currency: 'USDT', maxOpenPositions: 5 },
    riskParams: { globalDrawdownLimitPercent: 15, dailyLossLimitPercent: 5 },
    strategyParams: {},
  });

  useEffect(() => {
    dispatch(fetchStrategies());
    dispatch(fetchAccounts());
  }, [dispatch]);

  // Pre-select strategy if passed via URL
  useEffect(() => {
    const sid = searchParams.get('strategy');
    if (sid) setForm(f => ({ ...f, strategyId: sid }));
  }, [searchParams]);

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

  const portionSize = (form.capitalAllocation.totalCapital / (form.strategyParams.portions || form.capitalAllocation.maxOpenPositions || 5)).toFixed(2);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a bot name');
      return;
    }
    try {
      const bot = await dispatch(createBot(form)).unwrap();
      toast.success(`Bot "${form.name}" created!`);
      navigate(`/bots/${bot._id}`);
    } catch (err) {
      toast.error(err || 'Failed to create bot');
    }
  };

  const canProceed = () => {
    if (step === 0) return form.isDemo || form.exchangeAccountId;
    if (step === 1) return form.symbol && form.exchange;
    if (step === 2) return !!form.strategyId;
    if (step === 3) return form.capitalAllocation.totalCapital >= 10;
    return true;
  };

  // ────────────────────────────────────
  // Step 0: Mode & Exchange
  // ────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Trading Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => update('isDemo', true)}
          className={`p-5 rounded-xl border-2 text-left transition-colors ${form.isDemo ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-brandDark-700 hover:border-blue-300'}`}
        >
          <FlaskConical className="w-8 h-8 text-blue-500 mb-3" />
          <p className="font-semibold text-gray-900 dark:text-white">Demo Account</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Practice with $10,000 virtual balance. No real money at risk.
          </p>
          {form.isDemo && <CheckCircle className="w-5 h-5 text-blue-500 mt-3" />}
        </button>

        <button
          onClick={() => update('isDemo', false)}
          className={`p-5 rounded-xl border-2 text-left transition-colors ${!form.isDemo ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-brandDark-700 hover:border-primary-300'}`}
        >
          <Zap className="w-8 h-8 text-primary-500 mb-3" />
          <p className="font-semibold text-gray-900 dark:text-white">Live Trading</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Trade with real funds on your connected exchange.
          </p>
          {!form.isDemo && <CheckCircle className="w-5 h-5 text-primary-500 mt-3" />}
        </button>
      </div>

      {!form.isDemo && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Exchange Account</h3>
          {accounts.length === 0 ? (
            <div className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">No exchange accounts connected.</p>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-sm text-primary-600 hover:underline mt-1 flex items-center gap-1"
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
                    <div className="w-8 h-8 bg-gray-100 dark:bg-brandDark-700 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                      {acc.exchange[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{acc.label}</p>
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
  const renderStep1 = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Market & Pair</h2>

      {form.isDemo && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exchange</label>
          <select
            value={form.exchange}
            onChange={e => update('exchange', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            {['binance', 'bybit', 'kucoin', 'okx', 'gate', 'kraken'].map(ex => (
              <option key={ex} value={ex} className="capitalize">{ex}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Market Type</label>
        <div className="flex gap-3">
          {['spot', 'futures'].map(type => (
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trading Pair</label>
        <input
          type="text"
          value={form.symbol}
          onChange={e => update('symbol', e.target.value.toUpperCase())}
          placeholder="e.g. BTC/USDT"
          className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {POPULAR_PAIRS.map(pair => (
            <button
              key={pair}
              onClick={() => update('symbol', pair)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-mono ${
                form.symbol === pair
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'border-gray-200 dark:border-brandDark-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────
  // Step 2: Strategy
  // ────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Strategy</h2>
      {botLoading.strategies ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {strategies.map(s => (
            <button
              key={s.id}
              onClick={() => update('strategyId', s.id)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                form.strategyId === s.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-brandDark-700 hover:border-gray-300'
              } ${RISK_COLORS[s.riskLevel]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</span>
                  {s.isDefault && <Star className="w-4 h-4 text-yellow-500" />}
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${RISK_BADGE[s.riskLevel]}`}>
                  {s.riskLevel}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{s.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-gray-400">{s.timeframe}</span>
                <span className="text-gray-300">·</span>
                {s.supportedMarkets.map(m => <span key={m} className="text-xs text-gray-400 capitalize">{m}</span>)}
              </div>
            </button>
          ))}
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
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-brandDark-700/50 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Capital Allocation</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Total Capital (USDT)</label>
            <input
              type="number"
              min="10"
              value={form.capitalAllocation.totalCapital}
              onChange={e => updateNested('capitalAllocation', 'totalCapital', parseFloat(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Open Positions</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.capitalAllocation.maxOpenPositions}
              onChange={e => updateNested('capitalAllocation', 'maxOpenPositions', parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">Portion size: ~${portionSize} USDT each</p>
      </div>

      {/* Strategy params */}
      {selectedStrategy?.id === 'adaptive_grid' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-brandDark-700/50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Strategy Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grid Portions</label>
              <input type="number" min="2" max="10" value={form.strategyParams.portions || 5}
                onChange={e => updateParams('portions', parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">RSI Oversold Threshold</label>
              <input type="number" min="10" max="40" value={form.strategyParams.rsiOversold || 30}
                onChange={e => updateParams('rsiOversold', parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Take Profit Mode</label>
              <select value={form.strategyParams.takeProfitMode || 'structure'}
                onChange={e => updateParams('takeProfitMode', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white">
                <option value="structure">Structure-based (smart)</option>
                <option value="atr">ATR-based</option>
                <option value="fixed">Fixed %</option>
              </select>
            </div>
            {form.strategyParams.takeProfitMode === 'fixed' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Take Profit %</label>
                <input type="number" step="0.1" min="0.5" max="10" value={form.strategyParams.fixedTakeProfitPercent || 1.5}
                  onChange={e => updateParams('fixedTakeProfitPercent', parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
              </div>
            )}
          </div>
        </div>
      )}

      {selectedStrategy?.id === 'dca' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-brandDark-700/50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">DCA Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Interval (hours)</label>
              <input type="number" min="1" value={form.strategyParams.dcaIntervalHours || 24}
                onChange={e => updateParams('dcaIntervalHours', parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount per order (USDT)</label>
              <input type="number" min="10" value={form.strategyParams.dcaAmountPerOrder || 100}
                onChange={e => updateParams('dcaAmountPerOrder', parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Risk */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-brandDark-700/50 rounded-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Management</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Global Drawdown Limit (%)</label>
            <input type="number" min="5" max="50" value={form.riskParams.globalDrawdownLimitPercent}
              onChange={e => updateNested('riskParams', 'globalDrawdownLimitPercent', parseFloat(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Daily Loss Limit (%)</label>
            <input type="number" min="1" max="20" value={form.riskParams.dailyLossLimitPercent}
              onChange={e => updateNested('riskParams', 'dailyLossLimitPercent', parseFloat(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bot Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. My BTC Grid Bot"
          className="w-full rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
        />
      </div>

      <div className="space-y-2 p-4 bg-gray-50 dark:bg-brandDark-700/50 rounded-xl text-sm">
        {[
          ['Mode', form.isDemo ? 'Demo (Paper Trading)' : 'Live Trading'],
          ['Exchange', form.exchange],
          ['Pair', form.symbol],
          ['Market', form.marketType],
          ['Strategy', selectedStrategy?.name || form.strategyId],
          ['Capital', `$${form.capitalAllocation.totalCapital} USDT`],
          ['Max Positions', form.capitalAllocation.maxOpenPositions],
          ['Global Stop', `${form.riskParams.globalDrawdownLimitPercent}% drawdown`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">{value}</span>
          </div>
        ))}
      </div>

      {form.isDemo && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <FlaskConical className="w-4 h-4 flex-shrink-0" />
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
    <div className="p-6 max-w-2xl mx-auto">
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Step {step + 1} of {steps.length}: <span className="font-medium text-gray-700 dark:text-gray-300">{steps[step]}</span>
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
            Launch Bot
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateBot;
