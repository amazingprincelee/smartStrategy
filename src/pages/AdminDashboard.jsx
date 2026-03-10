import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminSubscriptions,
  fetchAdminSettings,
  updateAdminSettings,
  adminActivateUser,
  clearAdminAction,
} from '../redux/slices/adminSlice';

const PROVIDERS = [
  { id: 'coinbase_commerce', label: 'Coinbase Commerce' },
  { id: 'nowpayments',       label: 'NOWPayments' },
  { id: 'cryptopay',         label: 'CryptoPay' },
];

const TABS = ['Overview', 'Users', 'Subscriptions', 'Settings'];

export default function AdminDashboard() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(s => s.auth);
  const {
    stats, users, usersTotal, subscriptions, subsTotal,
    settings, loading, error, actionSuccess,
  } = useSelector(s => s.admin);

  const [tab, setTab]             = useState('Overview');
  const [activateId, setActivateId] = useState('');
  const [activateDays, setActivateDays] = useState(30);
  const [searchUser, setSearchUser] = useState('');

  // Guard
  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminSettings());
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'Users')         dispatch(fetchAdminUsers({ search: searchUser }));
    if (tab === 'Subscriptions') dispatch(fetchAdminSubscriptions({}));
  }, [tab, dispatch]);

  useEffect(() => {
    if (searchUser !== undefined && tab === 'Users') {
      const t = setTimeout(() => dispatch(fetchAdminUsers({ search: searchUser })), 400);
      return () => clearTimeout(t);
    }
  }, [searchUser, dispatch, tab]);

  const handleProviderChange = (e) => {
    dispatch(updateAdminSettings({ activePaymentProvider: e.target.value }));
  };

  const handleActivate = () => {
    if (!activateId.trim()) return;
    dispatch(adminActivateUser({ userId: activateId.trim(), days: Number(activateDays) }))
      .then(() => setTimeout(() => dispatch(clearAdminAction()), 4000));
    setActivateId('');
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const fmtMoney = (n) => n != null ? `$${Number(n).toFixed(2)}` : '—';

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {loading.stats ? (
            <p className="text-muted-foreground">Loading stats...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Total Users',   stats.totalUsers   ?? '—'],
                ['Premium Users', stats.premiumUsers ?? '—'],
                ['Active Bots',   stats.activeBots   ?? '—'],
                ['Total Bots',    stats.totalBots    ?? '—'],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="text-3xl font-bold">{val}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Manual activate */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 max-w-md">
            <h2 className="font-semibold mb-4">Manually Activate Premium</h2>
            <div className="space-y-3">
              <input
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-muted-foreground"
                placeholder="User ID (MongoDB _id)"
                value={activateId}
                onChange={e => setActivateId(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={1} max={365}
                  className="w-24 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  value={activateDays}
                  onChange={e => setActivateDays(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <button
                onClick={handleActivate}
                disabled={loading.action}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {loading.action ? 'Activating...' : 'Activate Premium'}
              </button>
              {actionSuccess && <p className="text-green-400 text-sm">{actionSuccess}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'Users' && (
        <div className="space-y-4">
          <input
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
            placeholder="Search by email..."
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">{usersTotal} users total</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Expires</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading.users ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        u.role === 'premium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-muted-foreground'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.subscription?.plan ?? 'free'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.subscription?.expiresAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Subscriptions ── */}
      {tab === 'Subscriptions' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{subsTotal} payment records</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Provider</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading.subs ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No subscriptions yet</td></tr>
                ) : subscriptions.map(s => (
                  <tr key={s._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{s.provider?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{fmtMoney(s.amountUSD)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        s.status === 'pending'   ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'Settings' && (
        <div className="max-w-lg space-y-6">
          {loading.settings ? (
            <p className="text-muted-foreground">Loading settings...</p>
          ) : settings ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h2 className="font-semibold">Payment Provider</h2>
                <select
                  value={settings.activePaymentProvider}
                  onChange={handleProviderChange}
                  className="w-full bg-[hsl(var(--background))] border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  All new checkouts will use the selected provider immediately.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h2 className="font-semibold">Pricing</h2>
                {[
                  ['Premium Price (USD)', 'premiumPriceUSD'],
                  ['Premium Duration (days)', 'premiumDurationDays'],
                  ['Referral Reward (USD)', 'referralRewardUSD'],
                ].map(([label, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm flex-1">{label}</label>
                    <input
                      type="number"
                      defaultValue={settings[key]}
                      onBlur={e => dispatch(updateAdminSettings({ [key]: Number(e.target.value) }))}
                      className="w-24 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-right"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h2 className="font-semibold">Free Tier Limits</h2>
                {[
                  ['Max signals/day (free)', 'freeSignalsPerDay'],
                  ['Max signal confidence (free, 0-1)', 'freeSignalMaxConfidence'],
                  ['Max arbitrage results (free)', 'freeArbitrageLimit'],
                  ['Max arb profit % (free)', 'freeArbitrageMaxProfit'],
                ].map(([label, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm flex-1">{label}</label>
                    <input
                      type="number"
                      step={key.includes('Confidence') || key.includes('Profit') ? 0.01 : 1}
                      defaultValue={settings[key]}
                      onBlur={e => dispatch(updateAdminSettings({ [key]: Number(e.target.value) }))}
                      className="w-24 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-right"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Disable public access for upgrades</p>
                </div>
                <button
                  onClick={() => dispatch(updateAdminSettings({ maintenanceMode: !settings.maintenanceMode }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-orange-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
