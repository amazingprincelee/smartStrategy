import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Mail,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
  Check,
  LogOut,
  Crown,
  Copy,
  ArrowDownCircle,
  Loader,
} from 'lucide-react';
import {
  fetchUserProfile,
  updateUserProfile,
  updateNotificationPreferences,
  changePassword,
  clearUserMessages,
} from '../redux/slices/userSlice';
import { logout } from '../redux/slices/authSlice';
import { fetchSubscriptionStatus } from '../redux/slices/subscriptionSlice';
import {
  requestWithdrawal, fetchUserWithdrawals, clearWithdrawalState,
} from '../redux/slices/withdrawalSlice';

// ── helpers ───────────────────────────────────────────────────────────────────
function getInitials(name, email) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// ─── component ────────────────────────────────────────────────────────────────
const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile, loading, error, successMessage } = useSelector(state => state.user);
  const { isPremium, subscription, referral, credits, paymentHistory, statusLoading } =
    useSelector(state => state.subscription);
  const { myWithdrawals, loading: wLoading, error: wError, success: wSuccess } =
    useSelector(state => state.withdrawals);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wForm, setWForm] = useState({ amount: '', walletAddress: '', network: 'ETH' });
  const dispatch2 = useDispatch();

  const [activeTab, setActiveTab] = useState('profile');
  const [copiedRef, setCopiedRef] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [profileDirty, setProfileDirty] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: { botAlert: true, signalAlert: true, tradeExecuted: true, platformUpdates: false, arbitrageAlert: true },
    inAppNotifications: { botAlert: true, signalAlert: true, tradeExecuted: true, platformUpdates: true, arbitrageAlert: true },
  });
  const [notifDirty, setNotifDirty] = useState(false);

  // Load profile on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchSubscriptionStatus());
    dispatch(fetchUserWithdrawals());
  }, [dispatch]);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || user?.name || '',
        email: profile.email || user?.email || '',
      });
      if (profile.preferences) {
        const p = profile.preferences;
        setNotifPrefs({
          emailNotifications: { ...notifPrefs.emailNotifications, ...p.emailNotifications },
          inAppNotifications: { ...notifPrefs.inAppNotifications, ...p.inAppNotifications },
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(() => dispatch(clearUserMessages()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage, error, dispatch]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfileForm(f => ({ ...f, [field]: value }));
    setProfileDirty(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({ fullName: profileForm.fullName }));
    setProfileDirty(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    dispatch(changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }));
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  const handleNotifChange = (category, field, value) => {
    setNotifPrefs(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
    setNotifDirty(true);
  };

  const handleSaveNotifications = () => {
    dispatch(updateNotificationPreferences(notifPrefs)).then(() => setNotifDirty(false));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // ── tab definitions ─────────────────────────────────────────────────────────
  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User   },
    { id: 'security',      label: 'Security',      icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell   },
    { id: 'subscription',  label: 'Subscription',  icon: Crown  },
  ];

  const handleCopyRef = () => {
    if (!referral?.code) return;
    const url = `${window.location.origin}/register?ref=${referral.code}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const displayUser = profile || user;
  const initials = getInitials(displayUser?.fullName || displayUser?.name, displayUser?.email);
  const roleBadge = displayUser?.role === 'admin'
    ? { text: 'Admin', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' }
    : displayUser?.role === 'premium'
    ? { text: 'Premium', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    : { text: 'Free', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* ── Avatar hero ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center pt-2 pb-8">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white select-none">{initials}</span>
          </div>
          <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${roleBadge.cls}`}>
            {roleBadge.text}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          {displayUser?.fullName || displayUser?.name || 'Welcome'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{displayUser?.email}</p>

        {displayUser?.lastLogin && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Last login: {timeAgo(displayUser.lastLogin)}
          </p>
        )}
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

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 mb-6 bg-gray-100 dark:bg-brandDark-800 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-brandDark-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: PROFILE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Account Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={e => handleProfileChange('fullName', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full input"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileForm.email}
                    readOnly
                    className="w-full input pl-9 bg-gray-50 dark:bg-brandDark-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!profileDirty || loading.profile}
                  className="btn-primary"
                >
                  {loading.profile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {profileDirty ? 'Save Changes' : 'Saved'}
                </button>
              </div>
            </form>
          </div>

          {/* Account meta */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Account Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Account role', value: displayUser?.role || '—' },
                { label: 'Member since', value: displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'Last login', value: displayUser?.lastLogin ? new Date(displayUser.lastLogin).toLocaleString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: SECURITY
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {[
                { field: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password', key: 'current' },
                { field: 'newPassword',     label: 'New Password',     placeholder: 'Min. 6 characters',     key: 'new' },
                { field: 'confirm',         label: 'Confirm Password', placeholder: 'Repeat new password',    key: 'confirm' },
              ].map(({ field, label, placeholder, key }) => (
                <div key={field}>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full input pr-10"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              {pwError && (
                <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm || loading.action}
                  className="btn-primary w-full sm:w-auto"
                >
                  {loading.action ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Security status */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Security Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Password authentication', status: 'Active' },
                { label: 'Session tokens',           status: 'Enabled' },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-brandDark-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" /> {status}
                  </span>
                </div>
              ))}
            </div>
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
              desc: 'Sent to your registered email address',
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
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { field: 'botAlert',        label: 'Bot alerts',          desc: 'Errors, pauses and trade events from your bots' },
                  { field: 'signalAlert',     label: 'AI signal alerts',    desc: 'New signals from the AI trading engine' },
                  { field: 'tradeExecuted',   label: 'Trade confirmations', desc: 'Order filled confirmations' },
                  { field: 'arbitrageAlert',  label: 'Arbitrage alerts',    desc: 'High-profit arbitrage opportunities (max once per 6 hours per pair)' },
                  { field: 'platformUpdates', label: 'Platform updates',    desc: 'Maintenance and feature announcements' },
                ].map(({ field, label: fLabel, desc: fDesc }) => (
                  <label
                    key={field}
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{fLabel}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fDesc}</p>
                    </div>
                    <div
                      onClick={() => handleNotifChange(key, field, !notifPrefs[key][field])}
                      className={`relative flex-shrink-0 w-11 h-6 rounded-full cursor-pointer transition-colors ml-4 ${
                        notifPrefs[key][field] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
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

          <div className="flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={!notifDirty || loading.action}
              className="btn-primary w-full sm:w-auto"
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

      {/* ══════════════════════════════════════════════════════════════
          TAB: SUBSCRIPTION
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'subscription' && (
        <div className="space-y-5">
          {statusLoading ? (
            <div className="card flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Status card */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Crown className="w-4 h-4 text-purple-500" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Subscription</h2>
                </div>
                {isPremium ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Plan</span>
                      <span className="font-semibold text-green-500">Premium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className="font-semibold capitalize">{subscription?.status ?? 'active'}</span>
                    </div>
                    {subscription?.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Expires</span>
                        <span className="font-semibold">{new Date(subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}
                    {subscription?.paymentProvider && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Provider</span>
                        <span className="font-semibold capitalize">{subscription.paymentProvider.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link to="/pricing" className="btn-secondary text-sm">Renew / Upgrade</Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm space-y-3">
                    <p className="text-gray-500 dark:text-gray-400">You are on the <strong>Free</strong> plan.</p>
                    <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition">
                      <Crown className="w-4 h-4" /> Upgrade to Premium — $20/mo
                    </Link>
                  </div>
                )}
              </div>

              {/* Credits & Withdrawal */}
              {credits > 0 && (
                <div className="card text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Referral Credits</p>
                      <p className="text-2xl font-bold text-green-400">${Number(credits).toFixed(2)}</p>
                    </div>
                    <button onClick={() => setShowWithdraw(v => !v)}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                      <ArrowDownCircle className="w-3.5 h-3.5" /> Withdraw
                    </button>
                  </div>

                  {showWithdraw && (
                    <div className="bg-brandDark-700/50 dark:bg-brandDark-800 rounded-xl p-4 space-y-3 border border-brandDark-600">
                      {wSuccess && <p className="text-green-400 text-xs">{wSuccess}</p>}
                      {wError   && <p className="text-red-400 text-xs">{wError}</p>}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Amount (USD, max ${Number(credits).toFixed(2)})</label>
                        <input type="number" min={1} max={credits} value={wForm.amount} onChange={e => setWForm(f => ({ ...f, amount: e.target.value }))}
                          className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Wallet Address</label>
                        <input value={wForm.walletAddress} onChange={e => setWForm(f => ({ ...f, walletAddress: e.target.value }))} placeholder="0x…"
                          className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Network</label>
                        <select value={wForm.network} onChange={e => setWForm(f => ({ ...f, network: e.target.value }))}
                          className="w-full bg-brandDark-700 border border-brandDark-600 rounded-lg px-3 py-2 text-sm text-white">
                          {['ETH','BSC','MATIC','TRX'].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => { dispatch(requestWithdrawal({ amount: parseFloat(wForm.amount), walletAddress: wForm.walletAddress, network: wForm.network })); setShowWithdraw(false); }}
                        disabled={!wForm.amount || !wForm.walletAddress || wLoading.action}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        {wLoading.action ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />} Request Withdrawal
                      </button>
                    </div>
                  )}

                  {/* Withdrawal history */}
                  {myWithdrawals.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Recent withdrawal requests</p>
                      {myWithdrawals.slice(0, 3).map(w => (
                        <div key={w._id} className="flex justify-between items-center py-1.5 border-t border-brandDark-700 text-xs">
                          <span className="text-gray-300">${w.amount} → {w.walletAddress?.slice(0,8)}…</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            w.status === 'paid'     ? 'bg-teal-500/20 text-teal-400' :
                            w.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'}`}>{w.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Referral */}
              {referral?.code && (
                <div className="card space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Referral Program</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Earn <span className="text-green-400 font-semibold">$5 credit</span> for every friend who subscribes using your link.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 dark:bg-brandDark-700 rounded-lg px-3 py-2 text-xs font-mono truncate">
                      {window.location.origin}/register?ref={referral.code}
                    </code>
                    <button
                      onClick={handleCopyRef}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-brandDark-600 hover:bg-gray-300 dark:hover:bg-brandDark-500 transition"
                    >
                      {copiedRef ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-lg bg-gray-50 dark:bg-brandDark-700 p-3">
                      <p className="text-lg font-bold">{referral.referrals?.length ?? 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Referred</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-brandDark-700 p-3">
                      <p className="text-lg font-bold text-green-400">${(referral.totalEarned ?? 0).toFixed(0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-brandDark-700 p-3">
                      <p className="text-lg font-bold text-blue-400">${(referral.pendingCredit ?? 0).toFixed(0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment history */}
              {paymentHistory.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {paymentHistory.map(p => (
                      <div key={p._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <div>
                          <p className="font-medium capitalize">{p.provider?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(p.amountUSD ?? 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            p.status === 'pending'   ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
