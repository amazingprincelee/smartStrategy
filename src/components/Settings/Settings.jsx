import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Palette,
  Key,
  Bell,
  Moon,
  Check,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Info,
  Globe,
  Lock,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  fetchUserProfile,
  updateTheme,
  updateNotificationPreferences,
} from '../../redux/slices/userSlice';
import { applyThemeClass } from '../../redux/useTheme';
import {
  fetchAccounts,
  fetchSupportedExchanges,
  addAccount,
  testAccount,
  removeAccount,
} from '../../redux/slices/exchangeAccountSlice';

// ─── component ────────────────────────────────────────────────────────────────
const Settings = () => {
  const dispatch = useDispatch();

  const { profile, loading, error, successMessage } = useSelector((state) => state.user);

  const {
    accounts: exchangeAccounts,
    supportedExchanges,
    loading: exchLoading,
    error: exchError,
  } = useSelector((state) => state.exchangeAccounts);

  const [activeTab, setActiveTab] = useState('appearance');

  // Theme local state (mirrors DB value, applied immediately)
  const [localTheme, setLocalTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  const [themeSaved, setThemeSaved] = useState(false);

  // Notification prefs local state
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: { botAlert: true, signalAlert: true, tradeExecuted: true, platformUpdates: false },
    inAppNotifications: { botAlert: true, signalAlert: true, tradeExecuted: true, platformUpdates: true },
  });
  const [notifDirty, setNotifDirty] = useState(false);

  // Exchange API state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    label: '',
    exchange: 'okx',
    apiKey: '',
    apiSecret: '',
    apiPassphrase: '',
    isSandbox: false,
  });
  const [testingId, setTestingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Load profile + exchange accounts on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchAccounts());
    dispatch(fetchSupportedExchanges());
  }, [dispatch]);

  // Sync notification prefs from profile when loaded
  useEffect(() => {
    if (profile?.preferences) {
      const p = profile.preferences;
      setNotifPrefs({
        emailNotifications: { ...notifPrefs.emailNotifications, ...p.emailNotifications },
        inAppNotifications: { ...notifPrefs.inAppNotifications, ...p.inAppNotifications },
      });
      // Also sync theme
      if (p.theme) {
        setLocalTheme(p.theme);
        localStorage.setItem('theme', p.theme);
        applyTheme(p.theme);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id]);

  // ── Theme handlers ─────────────────────────────────────────────────────────
  const handleThemeChange = (theme) => {
    setLocalTheme(theme);
    localStorage.setItem('theme', theme);
    applyThemeClass(theme);
    dispatch(updateTheme(theme)).then(() => {
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    });
  };

  // ── Notification handlers ─────────────────────────────────────────────────
  const handleNotifChange = (category, key, value) => {
    setNotifPrefs(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
    setNotifDirty(true);
  };

  const handleSaveNotifications = () => {
    dispatch(updateNotificationPreferences(notifPrefs)).then(() => {
      setNotifDirty(false);
    });
  };

  // ── Exchange API handlers ─────────────────────────────────────────────────
  const popularExchanges = (supportedExchanges?.popular || []).filter(e =>
    ['okx', 'kucoin', 'bitget', 'phemex', 'gate', 'mexc', 'huobi', 'kraken'].includes(e.id)
  );

  const handleAddAccount = async () => {
    if (!newAccount.label || !newAccount.apiKey || !newAccount.apiSecret) return;
    await dispatch(addAccount(newAccount));
    setNewAccount({ label: '', exchange: 'okx', apiKey: '', apiSecret: '', apiPassphrase: '', isSandbox: false });
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

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'exchange_api', label: 'Exchange API', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <SettingsIcon className="w-5 h-5 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        <p className="ml-12 text-sm text-gray-500 dark:text-gray-400">
          Manage your account preferences
        </p>
      </div>

      {/* ── Global feedback ──────────────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-3 mb-5 border-l-4 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-3 mb-5 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 mb-8 bg-gray-100 dark:bg-brandDark-800 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-brandDark-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: APPEARANCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Palette className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Theme</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your preference is saved to your account — applies on every device you log into.
                </p>
              </div>
              {themeSaved && (
                <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'dark',    label: 'Navy',       icon: Moon, desc: 'Default brand theme — deep navy' },
                { value: 'darkest', label: 'Pure Black',  icon: Moon, desc: 'Maximum contrast — true black' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    localTheme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-brandDark-800'
                  }`}
                >
                  {localTheme === value && (
                    <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <Icon className={`w-6 h-6 ${localTheme === value ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${localTheme === value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Preview strip */}
            <div className={`mt-6 p-4 rounded-xl border ${
              localTheme === 'darkest'
                ? 'bg-black border-gray-800'
                : 'bg-[#0b2447] border-[#1a3a6e]'
            }`}>
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className={`h-2.5 w-3/4 rounded ${localTheme === 'darkest' ? 'bg-gray-800' : 'bg-[#1a3a6e]'}`} />
                  <div className={`h-2 w-1/2 rounded ${localTheme === 'darkest' ? 'bg-gray-900' : 'bg-[#0d2d5a]'}`} />
                </div>
                <div className="px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-medium">Live</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: EXCHANGE API
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'exchange_api' && (
        <div className="space-y-5">
          {/* Security notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Security reminder</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Only grant <strong>Read + Trade</strong> permissions — <strong>never</strong> withdrawal.
                Use IP whitelisting on your exchange for extra protection. Keys are encrypted at rest.
              </p>
            </div>
          </div>

          {/* Connected accounts card */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Key className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Connected Exchanges</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">API keys used for live bot trading</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add key</span>
              </button>
            </div>

            {exchError && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {exchError}
              </div>
            )}

            {/* Add form */}
            {showAddForm && (
              <div className="mb-5 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-brandDark-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">New Exchange Account</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">Exchange</label>
                    <select
                      value={newAccount.exchange}
                      onChange={e => setNewAccount(a => ({ ...a, exchange: e.target.value }))}
                      className="w-full input"
                    >
                      {popularExchanges.length > 0 ? (
                        popularExchanges.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)
                      ) : (
                        <>
                          <option value="okx">OKX</option>
                          <option value="kucoin">KuCoin</option>
                          <option value="bitget">Bitget</option>
                          <option value="phemex">Phemex</option>
                          <option value="gate">Gate.io</option>
                          <option value="mexc">MEXC</option>
                          <option value="huobi">HTX (Huobi)</option>
                          <option value="kraken">Kraken</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Label <span className="text-gray-400">(e.g. "My OKX")</span>
                    </label>
                    <input
                      type="text"
                      value={newAccount.label}
                      onChange={e => setNewAccount(a => ({ ...a, label: e.target.value }))}
                      placeholder="My OKX Account"
                      className="w-full input"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">API Key</label>
                    <input
                      type="password"
                      value={newAccount.apiKey}
                      onChange={e => setNewAccount(a => ({ ...a, apiKey: e.target.value }))}
                      placeholder="Your API key"
                      className="w-full input font-mono text-sm"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">API Secret</label>
                    <input
                      type="password"
                      value={newAccount.apiSecret}
                      onChange={e => setNewAccount(a => ({ ...a, apiSecret: e.target.value }))}
                      placeholder="Your API secret"
                      className="w-full input font-mono text-sm"
                      autoComplete="off"
                    />
                  </div>

                  {newAccount.exchange === 'kucoin' && (
                    <div className="sm:col-span-2">
                      <label className="block mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        Passphrase <span className="text-gray-400">(KuCoin only)</span>
                      </label>
                      <input
                        type="password"
                        value={newAccount.apiPassphrase}
                        onChange={e => setNewAccount(a => ({ ...a, apiPassphrase: e.target.value }))}
                        className="w-full input font-mono text-sm"
                        autoComplete="off"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-brandDark-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={newAccount.isSandbox}
                        onChange={e => setNewAccount(a => ({ ...a, isSandbox: e.target.checked }))}
                        className="w-4 h-4 rounded text-primary-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sandbox / Testnet</span>
                        <p className="text-xs text-gray-500">Use exchange's test environment — no real funds</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAccount}
                    disabled={exchLoading.add || !newAccount.label || !newAccount.apiKey || !newAccount.apiSecret}
                    className="btn-primary"
                  >
                    <Zap className={`w-4 h-4 ${exchLoading.add ? 'animate-pulse' : ''}`} />
                    {exchLoading.add ? 'Testing & Saving…' : 'Test & Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewAccount({ label: '', exchange: 'okx', apiKey: '', apiSecret: '', apiPassphrase: '', isSandbox: false });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Accounts list */}
            {exchLoading.fetch ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : exchangeAccounts.length === 0 ? (
              <div className="py-10 text-center">
                <Lock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No exchange accounts connected</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add an API key above to start live bot trading</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {exchangeAccounts.map((account) => (
                  <div
                    key={account._id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-brandDark-600 flex-shrink-0">
                        <Key className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{account.label}</span>
                          {account.isSandbox && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0">
                              Sandbox
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500 capitalize">{account.exchange}</span>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          {account.isValid ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle className="w-3 h-3" /> {account.lastError ? 'Error' : 'Not tested'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handleTestAccount(account._id)}
                        disabled={testingId === account._id}
                        className="btn-secondary btn-sm"
                        title="Test connection"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingId === account._id ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-xs">Test</span>
                      </button>
                      <button
                        onClick={() => handleRemoveAccount(account._id)}
                        disabled={removingId === account._id}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">How it works</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                Keys are encrypted with AES-256 before storage — we never store them in plain text.
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                "Test & Save" validates your keys against the exchange live before persisting.
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                Add multiple accounts to spread bots across different exchanges.
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                Only enable <strong>Read</strong> and <strong>Trade</strong> permissions — never withdrawal.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: NOTIFICATIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          {[
            {
              key: 'emailNotifications',
              label: 'Email Notifications',
              icon: Globe,
              color: 'text-blue-500',
              bg: 'bg-blue-100 dark:bg-blue-900/30',
              desc: 'Receive updates to your registered email address',
            },
            {
              key: 'inAppNotifications',
              label: 'In-App Notifications',
              icon: Bell,
              color: 'text-orange-500',
              bg: 'bg-orange-100 dark:bg-orange-900/30',
              desc: 'Appear in the notification bell inside the app',
            },
          ].map(({ key, label, icon: Icon, color, bg, desc }) => (
            <div key={key} className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { field: 'botAlert',       label: 'Bot alerts',           desc: 'Errors, pauses and trade executions from your bots' },
                  { field: 'signalAlert',    label: 'AI signal alerts',     desc: 'New trading signals generated by the AI engine' },
                  { field: 'tradeExecuted',  label: 'Trade confirmations',  desc: 'Confirmation when a bot order is filled' },
                  { field: 'platformUpdates',label: 'Platform updates',     desc: 'Maintenance windows and feature announcements' },
                ].map(({ field, label: fLabel, desc: fDesc }) => (
                  <label
                    key={field}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {fLabel}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fDesc}</p>
                    </div>
                    {/* Toggle */}
                    <div
                      onClick={() => handleNotifChange(key, field, !notifPrefs[key][field])}
                      className={`relative flex-shrink-0 w-11 h-6 rounded-full cursor-pointer transition-colors ml-4 ${
                        notifPrefs[key][field]
                          ? 'bg-primary-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        notifPrefs[key][field] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={!notifDirty || loading.action}
              className="btn-primary"
            >
              {loading.action ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {notifDirty ? 'Save Preferences' : 'Up to date'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
