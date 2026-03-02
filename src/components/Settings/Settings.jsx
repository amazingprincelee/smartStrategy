import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Settings as SettingsIcon,
  TrendingUp,
  Key,
  Bell,
  Palette,
  RefreshCw,
  Save,
  RotateCcw,
  Check,
  X,
  Filter,
  BarChart3,
  Percent,
  Shield,
  ArrowUpDown,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  Plus,
  Trash2,
  Globe,
  Zap,
  Lock
} from 'lucide-react';
import {
  fetchUserSettings,
  updateArbitrageSettings,
  setArbitrageFilter,
  setArbitrageDisplay,
  clearMessages,
  resetSettings
} from '../../redux/slices/settingsSlice';
import {
  fetchAccounts,
  fetchSupportedExchanges,
  addAccount,
  testAccount,
  removeAccount,
} from '../../redux/slices/exchangeAccountSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const {
    arbitrage,
    ui,
    loading,
    error,
    successMessage,
    hasLoaded
  } = useSelector((state) => state.settings);

  const {
    accounts: exchangeAccounts,
    supportedExchanges,
    loading: exchLoading,
    error: exchError,
  } = useSelector((state) => state.exchangeAccounts);

  const [activeTab, setActiveTab] = useState('arbitrage');
  const [hasChanges, setHasChanges] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exchange API tab state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    label: '',
    exchange: 'binance',
    apiKey: '',
    apiSecret: '',
    apiPassphrase: '',
    isSandbox: false,
  });
  const [testingId, setTestingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Load settings on mount
  useEffect(() => {
    if (!hasLoaded) {
      dispatch(fetchUserSettings());
    }
    // Load exchange API accounts and supported exchanges
    dispatch(fetchAccounts());
    dispatch(fetchSupportedExchanges());
  }, [dispatch, hasLoaded]);

  // Clear messages after showing
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    dispatch(setArbitrageFilter({ key, value }));
    setHasChanges(true);
  };

  // Handle display change
  const handleDisplayChange = (key, value) => {
    dispatch(setArbitrageDisplay({ key, value }));
    setHasChanges(true);
  };

  // Save arbitrage settings
  const handleSaveArbitrageSettings = () => {
    dispatch(updateArbitrageSettings({
      settings: {
        filters: arbitrage.filters,
        display: arbitrage.display,
        notifications: arbitrage.notifications
      }
    }));
    setHasChanges(false);
  };

  // Reset settings
  const handleResetSettings = (section) => {
    if (window.confirm(`Are you sure you want to reset ${section} settings to defaults?`)) {
      dispatch(resetSettings({ section }));
      setHasChanges(false);
    }
  };

  // Exchange API handlers
  const handleAddAccount = async () => {
    if (!newAccount.label || !newAccount.apiKey || !newAccount.apiSecret) return;
    await dispatch(addAccount(newAccount));
    setNewAccount({ label: '', exchange: 'binance', apiKey: '', apiSecret: '', apiPassphrase: '', isSandbox: false });
    setShowAddForm(false);
    dispatch(fetchAccounts());
  };

  const handleTestAccount = async (id) => {
    setTestingId(id);
    await dispatch(testAccount(id));
    setTestingId(null);
    dispatch(fetchAccounts());
  };

  const handleRemoveAccount = async (id) => {
    if (!window.confirm('Remove this exchange account? Bots using it will be stopped.')) return;
    setRemovingId(id);
    await dispatch(removeAccount(id));
    setRemovingId(null);
    dispatch(fetchAccounts());
  };

  const popularExchanges = (supportedExchanges?.popular || []).filter(e =>
    ['binance', 'bybit', 'kucoin', 'okx', 'gate', 'mexc', 'bitget', 'kraken'].includes(e.id)
  );

  const tabs = [
    { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
    { id: 'exchanges', label: 'Exchanges', icon: BarChart3 },
    { id: 'exchange_api', label: 'Exchange API', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your preferences and configurations
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Horizontal Tabs - Desktop */}
      <div className="hidden sm:block mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                    ${isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Tab Dropdown */}
      <div className="sm:hidden mb-6">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {activeTabData && <activeTabData.icon className="w-5 h-5 text-primary-600" />}
            <span className="font-medium text-gray-900 dark:text-white">{activeTabData?.label}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {mobileMenuOpen && (
          <div className="absolute z-10 w-[calc(100%-2rem)] mt-2 bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-brandDark-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {isActive && <Check className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Arbitrage Settings */}
        {activeTab === 'arbitrage' && (
          <>
            {/* Filter Settings Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Settings</h2>
                  <p className="text-sm text-gray-500">Configure which opportunities to display</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Min Profit Percent */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Minimum Profit Percentage
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    value={arbitrage.filters.minProfitPercent}
                    onChange={(e) => handleFilterChange('minProfitPercent', parseFloat(e.target.value) || 0)}
                    className="w-full input"
                  />
                  <p className="mt-1 text-xs text-gray-500">Show opportunities with profit above this threshold</p>
                </div>

                {/* Min Volume */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Minimum Volume
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={arbitrage.filters.minVolume}
                    onChange={(e) => handleFilterChange('minVolume', parseFloat(e.target.value) || 0)}
                    className="w-full input"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum tradeable volume in base currency</p>
                </div>

                {/* Max Risk */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Maximum Risk Level
                    </div>
                  </label>
                  <select
                    value={arbitrage.filters.maxRisk}
                    onChange={(e) => handleFilterChange('maxRisk', e.target.value)}
                    className="w-full input"
                  >
                    <option value="Low">Low Risk Only</option>
                    <option value="Medium">Low + Medium Risk</option>
                    <option value="High">All Risks (Include High)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={arbitrage.filters.showOnlyProfitable}
                      onChange={(e) => handleFilterChange('showOnlyProfitable', e.target.checked)}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Show Only Profitable</span>
                      <p className="text-xs text-gray-500">Hide opportunities that may not cover fees</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={arbitrage.filters.requireTransferable}
                      onChange={(e) => handleFilterChange('requireTransferable', e.target.checked)}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Require Transferable</span>
                      <p className="text-xs text-gray-500">Only show if deposits/withdrawals are enabled</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={arbitrage.filters.includeZeroVolume}
                      onChange={(e) => handleFilterChange('includeZeroVolume', e.target.checked)}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Include Zero Volume</span>
                      <p className="text-xs text-gray-500">Show opportunities with no 24h volume</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Display Settings Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display Settings</h2>
                  <p className="text-sm text-gray-500">Customize how opportunities are shown</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Sort By */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort By
                    </div>
                  </label>
                  <select
                    value={arbitrage.display.sortBy}
                    onChange={(e) => handleDisplayChange('sortBy', e.target.value)}
                    className="w-full input"
                  >
                    <option value="profitPercent">Profit Percentage</option>
                    <option value="profitDollar">Profit Dollar Amount</option>
                    <option value="volume">Volume</option>
                    <option value="riskLevel">Risk Level</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort Order
                  </label>
                  <select
                    value={arbitrage.display.sortOrder}
                    onChange={(e) => handleDisplayChange('sortOrder', e.target.value)}
                    className="w-full input"
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>

                {/* Page Size */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Results Per Page
                  </label>
                  <select
                    value={arbitrage.display.pageSize}
                    onChange={(e) => handleDisplayChange('pageSize', parseInt(e.target.value))}
                    className="w-full input"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Display Toggles */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={arbitrage.display.showOrderBookDepth}
                      onChange={(e) => handleDisplayChange('showOrderBookDepth', e.target.checked)}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Show Order Book Depth</span>
                      <p className="text-xs text-gray-500">Display bid/ask amounts in the table</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={arbitrage.display.compactView}
                      onChange={(e) => handleDisplayChange('compactView', e.target.checked)}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Compact View</span>
                      <p className="text-xs text-gray-500">Show less details for more opportunities</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-brandDark-800 rounded-xl">
              <button
                onClick={() => handleResetSettings('arbitrage')}
                disabled={loading.reset}
                className="w-full sm:w-auto btn-secondary"
              >
                <RotateCcw className={`w-4 h-4 ${loading.reset ? 'animate-spin' : ''}`} />
                Reset to Defaults
              </button>

              <button
                onClick={handleSaveArbitrageSettings}
                disabled={loading.updateArbitrage || !hasChanges}
                className="w-full sm:w-auto btn-primary"
              >
                <Save className={`w-4 h-4 ${loading.updateArbitrage ? 'animate-pulse' : ''}`} />
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </button>
            </div>
          </>
        )}

        {/* Arbitrage Exchanges — read-only info panel */}
        {activeTab === 'exchanges' && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arbitrage Exchanges</h2>
                  <p className="text-sm text-gray-500">Exchanges our scanner monitors 24/7 for price differences</p>
                </div>
              </div>

              {/* How-to banner */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">How to participate in arbitrage</p>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-0.5">
                    <li>Open accounts on at least 2 exchanges listed below</li>
                    <li>Keep USDT or stablecoins funded on each exchange</li>
                    <li>Our scanner finds price gaps automatically — you act on them</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Exchange cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'OKX',      id: 'okx',      fee: '0.10%', tier: 'Low fee',    url: 'https://www.okx.com',       note: 'Major global exchange, excellent liquidity' },
                { name: 'KuCoin',   id: 'kucoin',   fee: '0.10%', tier: 'Low fee',    url: 'https://www.kucoin.com',    note: 'Large altcoin selection, active community' },
                { name: 'Bitget',   id: 'bitget',   fee: '0.10%', tier: 'Low fee',    url: 'https://www.bitget.com',    note: 'Spot & derivatives, competitive fees' },
                { name: 'Phemex',   id: 'phemex',   fee: '0.10%', tier: 'Low fee',    url: 'https://phemex.com',        note: 'Fast execution, low-fee platform' },
                { name: 'Poloniex', id: 'poloniex', fee: '0.155%', tier: 'Mid fee',   url: 'https://poloniex.com',      note: 'Established exchange, many altcoins' },
                { name: 'Gate.io',  id: 'gateio',   fee: '0.20%', tier: 'Standard',  url: 'https://www.gate.io',       note: 'Huge variety — 1,400+ trading pairs' },
                { name: 'MEXC',     id: 'mexc',     fee: '0.20%', tier: 'Standard',  url: 'https://www.mexc.com',      note: 'Wide market coverage, new listings fast' },
                { name: 'HTX (Huobi)', id: 'huobi', fee: '0.20%', tier: 'Standard',  url: 'https://www.htx.com',       note: 'Major Asian exchange, deep liquidity' },
              ].map((ex) => (
                <div
                  key={ex.id}
                  className="flex flex-col gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-brandDark-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  {/* Name + active badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">{ex.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                      Active
                    </span>
                  </div>

                  {/* Fee */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Taker fee:</span>
                    <span className={`text-sm font-bold ${
                      ex.fee === '0.10%'
                        ? 'text-green-600 dark:text-green-400'
                        : ex.fee === '0.155%'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {ex.fee}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">{ex.note}</p>

                  {/* Visit link */}
                  <a
                    href={ex.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Open Account
                  </a>
                </div>
              ))}
            </div>

            {/* Fee comparison note */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-brandDark-800 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">Tip:</strong>{' '}
                For the best arbitrage results, prioritise accounts on the <span className="text-green-600 dark:text-green-400 font-medium">0.10% fee exchanges</span> (OKX, KuCoin, Bitget, Phemex).
                Lower fees mean a smaller spread is needed to be profitable — giving you more opportunities.
              </p>
            </div>
          </div>
        )}

        {/* Exchange API Settings */}
        {activeTab === 'exchange_api' && (
          <div className="space-y-6">
            {/* Security Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Security Reminder</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Only grant <strong>Read + Trade</strong> permissions. <strong>Never</strong> grant withdrawal permissions.
                  Use IP whitelisting on your exchange for extra security. API keys are encrypted at rest.
                </p>
              </div>
            </div>

            {/* Exchange Accounts Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <Key className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Exchanges</h2>
                    <p className="text-sm text-gray-500">API keys for live bot trading</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>

              {/* Error from exchange accounts */}
              {exchError && (
                <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{exchError}</p>
                </div>
              )}

              {/* Add Account Form */}
              {showAddForm && (
                <div className="mb-6 p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-brandDark-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Exchange Account
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exchange
                      </label>
                      <select
                        value={newAccount.exchange}
                        onChange={(e) => setNewAccount(a => ({ ...a, exchange: e.target.value }))}
                        className="w-full input"
                      >
                        {popularExchanges.length > 0 ? (
                          popularExchanges.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="binance">Binance</option>
                            <option value="bybit">Bybit</option>
                            <option value="kucoin">KuCoin</option>
                            <option value="okx">OKX</option>
                            <option value="gate">Gate.io</option>
                            <option value="mexc">MEXC</option>
                            <option value="bitget">Bitget</option>
                            <option value="kraken">Kraken</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Label <span className="text-gray-400">(e.g. "Main Binance")</span>
                      </label>
                      <input
                        type="text"
                        value={newAccount.label}
                        onChange={(e) => setNewAccount(a => ({ ...a, label: e.target.value }))}
                        placeholder="My Binance Account"
                        className="w-full input"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={newAccount.apiKey}
                        onChange={(e) => setNewAccount(a => ({ ...a, apiKey: e.target.value }))}
                        placeholder="Your API key"
                        className="w-full input font-mono text-sm"
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        API Secret
                      </label>
                      <input
                        type="password"
                        value={newAccount.apiSecret}
                        onChange={(e) => setNewAccount(a => ({ ...a, apiSecret: e.target.value }))}
                        placeholder="Your API secret"
                        className="w-full input font-mono text-sm"
                        autoComplete="off"
                      />
                    </div>

                    {newAccount.exchange === 'kucoin' && (
                      <div className="md:col-span-2">
                        <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Passphrase <span className="text-xs text-gray-400">(KuCoin only)</span>
                        </label>
                        <input
                          type="password"
                          value={newAccount.apiPassphrase}
                          onChange={(e) => setNewAccount(a => ({ ...a, apiPassphrase: e.target.value }))}
                          placeholder="KuCoin passphrase"
                          className="w-full input font-mono text-sm"
                          autoComplete="off"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-brandDark-600 transition-colors">
                        <input
                          type="checkbox"
                          checked={newAccount.isSandbox}
                          onChange={(e) => setNewAccount(a => ({ ...a, isSandbox: e.target.checked }))}
                          className="w-5 h-5 rounded text-primary-600"
                        />
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Sandbox / Testnet</span>
                          <p className="text-xs text-gray-500">Use exchange's test environment (no real funds)</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={handleAddAccount}
                      disabled={exchLoading.add || !newAccount.label || !newAccount.apiKey || !newAccount.apiSecret}
                      className="btn-primary"
                    >
                      <Zap className={`w-4 h-4 ${exchLoading.add ? 'animate-pulse' : ''}`} />
                      {exchLoading.add ? 'Testing & Saving...' : 'Test & Save'}
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setNewAccount({ label: '', exchange: 'binance', apiKey: '', apiSecret: '', apiPassphrase: '', isSandbox: false }); }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts List */}
              {exchLoading.fetch ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : exchangeAccounts.length === 0 ? (
                <div className="py-12 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No exchange accounts connected</p>
                  <p className="text-sm text-gray-400 mt-1">Add an API key above to start live trading</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exchangeAccounts.map((account) => (
                    <div
                      key={account._id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-brandDark-600">
                          <Key className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{account.label}</span>
                            {account.isSandbox && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                                Sandbox
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500 capitalize">{account.exchange}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            {account.isValid ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                {account.lastError ? 'Error' : 'Not tested'}
                              </span>
                            )}
                            {account.lastTestedAt && (
                              <span className="text-xs text-gray-400">
                                · Tested {new Date(account.lastTestedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestAccount(account._id)}
                          disabled={testingId === account._id}
                          className="btn-secondary btn-sm"
                          title="Test connection"
                        >
                          <RefreshCw className={`w-4 h-4 ${testingId === account._id ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Test</span>
                        </button>
                        <button
                          onClick={() => handleRemoveAccount(account._id)}
                          disabled={removingId === account._id}
                          className="btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"
                          title="Remove account"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">How it works</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  API keys are encrypted using AES-256 before storage — we never store them in plain text.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  "Test & Save" validates your keys against the exchange before saving.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  You can use multiple accounts (e.g., one for Binance spot, one for Bybit futures).
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  Only enable <strong>Read</strong> and <strong>Trade</strong> permissions — never withdrawal.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arbitrage Alerts</h2>
                <p className="text-sm text-gray-500">Configure profit notifications</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors">
                <input
                  type="checkbox"
                  checked={arbitrage.notifications.enableAlerts}
                  onChange={(e) => {
                    // Would dispatch action
                  }}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Enable Profit Alerts</span>
                  <p className="text-xs text-gray-500">Get notified when high-profit opportunities appear</p>
                </div>
              </label>

              {arbitrage.notifications.enableAlerts && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Minimum Profit % for Alert
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={arbitrage.notifications.minProfitForAlert}
                      onChange={(e) => {
                        // Would dispatch action
                      }}
                      className="w-full input"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alert Frequency
                    </label>
                    <select
                      value={arbitrage.notifications.alertFrequency}
                      onChange={(e) => {
                        // Would dispatch action
                      }}
                      className="w-full input"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Summary</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Palette className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                <p className="text-sm text-gray-500">Customize how the app looks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <select
                  value={ui.theme}
                  onChange={(e) => {
                    // Would dispatch action
                  }}
                  className="w-full input"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency Display
                </label>
                <select
                  value={ui.currency}
                  onChange={(e) => {
                    // Would dispatch action
                  }}
                  className="w-full input"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BTC">BTC (₿)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <select
                  value={ui.language}
                  onChange={(e) => {
                    // Would dispatch action
                  }}
                  className="w-full input"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timezone
                </label>
                <select
                  value={ui.timezone}
                  onChange={(e) => {
                    // Would dispatch action
                  }}
                  className="w-full input"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
