import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users, DollarSign, Activity, Settings, LifeBuoy,
  BarChart2, Shield, Mail, CheckCircle, XCircle,
  AlertTriangle, Trash2, Gift, TrendingUp, Send,
  Megaphone, Eye, EyeOff, Loader, ArrowDownCircle, Clock, Key,
} from 'lucide-react';
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminSubscriptions,
  fetchAdminSettings, updateAdminSettings, adminActivateUser,
  adminGrantTrial, adminUpdateUser, adminDeleteUser,
  fetchRevenueAnalytics, fetchUserAnalytics, fetchPlatformAnalytics,
  fetchAuditLogs, sendTargetedEmail, updateAnnouncement,
  clearAdminAction, fetchPaymentKeyStatus, savePaymentKeys,
} from '../redux/slices/adminSlice';
import { adminFetchAllTickets, adminFetchTicket, adminReplyTicket } from '../redux/slices/supportSlice';
import { adminFetchWithdrawals, adminApproveWithdrawal, adminRejectWithdrawal, adminMarkPaid } from '../redux/slices/withdrawalSlice';

// ── Helpers ───────────────────────────────────────────────────────────────────
const n    = (v) => (v ?? 0).toLocaleString();
const usd  = (v) => `$${(v ?? 0).toFixed(2)}`;
const dt   = (d) => d ? new Date(d).toLocaleString()  : '—';
const date = (d) => d ? new Date(d).toLocaleDateString() : '—';

const SBADGE = {
  admin:        'bg-purple-500/30 text-purple-300',
  premium:      'bg-amber-500/30  text-amber-300',
  user:         'bg-slate-600/50  text-slate-300',
  active:       'bg-green-500/30  text-green-300',
  trial:        'bg-blue-500/30   text-blue-300',
  pending:      'bg-yellow-500/30 text-yellow-300',
  open:         'bg-blue-500/30   text-blue-300',
  in_progress:  'bg-yellow-500/30 text-yellow-300',
  waiting_user: 'bg-orange-500/30 text-orange-300',
  resolved:     'bg-green-500/30  text-green-300',
  closed:       'bg-slate-600/50  text-slate-400',
  approved:     'bg-green-500/30  text-green-300',
  rejected:     'bg-red-500/30    text-red-300',
  paid:         'bg-teal-500/30   text-teal-300',
  completed:    'bg-green-500/30  text-green-300',
  failed:       'bg-red-500/30    text-red-300',
  expired:      'bg-slate-600/50  text-slate-400',
  inactive:     'bg-red-500/30    text-red-300',
};

function Badge({ label, cls }) {
  const safe = String(label).toLowerCase().replace(/\s/g, '_');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls || SBADGE[safe] || 'bg-slate-600/50 text-slate-300'}`}>
      {label}
    </span>
  );
}

function Card({ icon: Icon, label, value, sub, iconCls = 'text-blue-400' }) {
  return (
    <div className="bg-[#1a2235] border border-white/10 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg bg-white/5 ${iconCls} flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 leading-tight">{label}</p>
        <p className="text-xl font-bold text-white leading-tight mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-blue-500" /></div>;
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${className}`} />
  );
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <select value={value} onChange={onChange}
      className={`bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 ${className}`}>
      {children}
    </select>
  );
}

function Th({ children }) {
  return <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 bg-white/5">{children}</th>;
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-2.5 text-sm text-gray-300 ${className}`}>{children}</td>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, loading, rev, ua, pa }) {
  if (loading.stats) return <Spinner />;
  const users        = stats?.stats?.users || {};
  const premiumCount = ua?.roleBreakdown?.find(r => r._id === 'premium')?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Users}       label="Total Users"     value={n(users.totalUsers)}                         iconCls="text-blue-400" />
        <Card icon={TrendingUp}  label="Premium / Trial" value={`${n(premiumCount)} / ${n(rev?.trialUsers)}`}  iconCls="text-amber-400" />
        <Card icon={DollarSign}  label="Total Revenue"   value={usd(rev?.totalRevenue)} sub={`MRR ~${usd(rev?.mrr)}`} iconCls="text-green-400" />
        <Card icon={Activity}    label="DAU / MAU"       value={`${n(ua?.activeUsers?.dau)} / ${n(ua?.activeUsers?.mau)}`} iconCls="text-purple-400" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Activity}      label="New Users (30d)" value={n(ua?.newUsers?.month)} iconCls="text-cyan-400" />
        <Card icon={Gift}          label="Trial Users"     value={n(rev?.trialUsers)}     iconCls="text-pink-400" />
        <Card icon={AlertTriangle} label="Churned (30d)"   value={n(rev?.churnedUsers)}   iconCls="text-red-400" />
        <Card icon={BarChart2}     label="Error Bots"      value={n(pa?.errorBots?.length)} iconCls="text-orange-400" />
      </div>

      {pa?.errorBots?.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Bots in Error State</p>
          <div className="space-y-2">
            {pa.errorBots.slice(0, 6).map(b => (
              <div key={b._id} className="flex gap-4 text-xs">
                <span className="text-gray-300 font-medium">{b.name}</span>
                <span className="text-gray-400">{b.userId?.email || '—'}</span>
                <span className="text-red-400 truncate">{b.statusMessage || 'error'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rev?.byProvider?.length > 0 && (
        <div className="bg-[#1a2235] border border-white/10 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-300 mb-3">Revenue by Provider</p>
          <div className="flex gap-8 flex-wrap">
            {rev.byProvider.map(p => (
              <div key={p._id}>
                <p className="text-xs text-gray-400 capitalize">{String(p._id).replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-green-400">{usd(p.total)}</p>
                <p className="text-xs text-gray-500">{p.count} payments</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, usersTotal, loading, dispatch, actionSuccess, error }) {
  const [search, setSearch] = useState('');
  const [role,   setRole]   = useState('');
  const [page,   setPage]   = useState(1);
  const [modal,  setModal]  = useState(null);
  const [days,   setDays]   = useState('');

  useEffect(() => {
    dispatch(fetchAdminUsers({ search, role, page, limit: 20 }));
  }, [search, role, page, dispatch]);

  const doAction = () => {
    const { type, user } = modal;
    if (type === 'activate')   dispatch(adminActivateUser({ userId: user._id, days: parseInt(days) || 30 }));
    if (type === 'trial')      dispatch(adminGrantTrial({ userId: user._id, days: parseInt(days) || 7 }));
    if (type === 'deactivate') dispatch(adminUpdateUser({ userId: user._id, isActive: false }));
    if (type === 'reactivate') dispatch(adminUpdateUser({ userId: user._id, isActive: true }));
    if (type === 'delete')     dispatch(adminDeleteUser(user._id));
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search email / name…" className="flex-1 min-w-[200px]" />
        <Select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="user">Free</option>
          <option value="premium">Premium</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      {actionSuccess && <p className="text-green-400 text-sm">{actionSuccess}</p>}
      {error         && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-xs text-gray-500">{n(usersTotal)} users total</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead><tr><Th>Email</Th><Th>Name</Th><Th>Role</Th><Th>Subscription</Th><Th>Joined</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {loading.users ? <tr><td colSpan={7}><Spinner /></td></tr>
              : users.map(u => (
              <tr key={u._id} className="hover:bg-white/3 transition-colors">
                <Td>{u.email}</Td>
                <Td className="text-gray-400">{u.fullName || '—'}</Td>
                <Td><Badge label={u.role} /></Td>
                <Td>
                  <span className="text-gray-400 text-xs">
                    {u.subscription?.status === 'trial' ? <Badge label="trial" /> : (u.subscription?.plan || 'free')}
                    {u.subscription?.expiresAt ? ` → ${date(u.subscription.expiresAt)}` : ''}
                  </span>
                </Td>
                <Td className="text-gray-500 text-xs">{date(u.createdAt)}</Td>
                <Td><Badge label={u.isActive !== false ? 'active' : 'inactive'} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => { setModal({ type: 'activate',   user: u }); setDays(''); }} title="Grant Premium" className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"><DollarSign className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setModal({ type: 'trial',      user: u }); setDays(''); }} title="Grant Trial"   className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"><Gift className="w-3.5 h-3.5" /></button>
                    {u.isActive !== false
                      ? <button onClick={() => setModal({ type: 'deactivate', user: u })} title="Deactivate" className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                      : <button onClick={() => setModal({ type: 'reactivate', user: u })} title="Reactivate" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
                    }
                    <button onClick={() => setModal({ type: 'delete', user: u })} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/5">← Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-lg hover:bg-white/5">Next →</button>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2235] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold text-base capitalize">{modal.type.replace('_', ' ')} User</h3>
            <p className="text-gray-400 text-sm">{modal.user.email}</p>
            {(modal.type === 'activate' || modal.type === 'trial') && (
              <Input type="number" value={days} onChange={e => setDays(e.target.value)} placeholder={modal.type === 'trial' ? 'Days (default 7)' : 'Days (default 30)'} />
            )}
            {modal.type === 'delete' && <p className="text-red-400 text-sm bg-red-900/20 rounded-lg p-3">This action is permanent and cannot be undone.</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={doAction} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">Confirm</button>
              <button onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────
function SubscriptionsTab({ subscriptions, subsTotal, loading, dispatch, rev }) {
  const [statusF, setStatusF] = useState('');
  const [period,  setPeriod]  = useState(30);

  useEffect(() => {
    dispatch(fetchAdminSubscriptions({ limit: 50, status: statusF }));
    dispatch(fetchRevenueAnalytics({ period }));
  }, [statusF, period, dispatch]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={DollarSign} label="Total Revenue" value={usd(rev?.totalRevenue)} iconCls="text-green-400" />
        <Card icon={TrendingUp} label="MRR"           value={usd(rev?.mrr)}          iconCls="text-blue-400" />
        <Card icon={Activity}   label="Payments"      value={n(rev?.totalPayments)}  iconCls="text-purple-400" />
        <Card icon={Clock}      label="Trial Users"   value={n(rev?.trialUsers)}     iconCls="text-cyan-400" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          {['pending','completed','failed','expired','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
          {[7,30,90,365].map(d => <option key={d} value={d}>{d} days</option>)}
        </Select>
        <span className="self-center text-xs text-gray-500">{n(subsTotal)} total</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead><tr><Th>Email</Th><Th>Provider</Th><Th>Amount</Th><Th>Status</Th><Th>Period</Th><Th>Date</Th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {loading.subs ? <tr><td colSpan={6}><Spinner /></td></tr>
              : subscriptions.map(s => (
              <tr key={s._id} className="hover:bg-white/3">
                <Td>{s.email || '—'}</Td>
                <Td className="text-gray-400 capitalize">{String(s.provider || '').replace(/_/g, ' ')}</Td>
                <Td className="text-green-400 font-semibold">{usd(s.amountUSD)}</Td>
                <Td><Badge label={s.status} /></Td>
                <Td className="text-xs text-gray-500">{date(s.planStartAt)} → {date(s.planEndAt)}</Td>
                <Td className="text-xs text-gray-500">{date(s.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Support Tab ───────────────────────────────────────────────────────────────
function SupportTab({ dispatch }) {
  const { allTickets, allTotal, unreadCount, adminTicket, loading } = useSelector(s => s.support);
  const [statusF, setStatusF] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    dispatch(adminFetchAllTickets({ limit: 50, status: statusF }));
  }, [statusF, dispatch]);

  const open = (id) => { setActiveId(id); dispatch(adminFetchTicket(id)); setReply(''); setNewStatus(''); };
  const send = () => {
    if (!reply.trim()) return;
    dispatch(adminReplyTicket({ id: activeId, message: reply, status: newStatus || undefined }));
    setReply('');
  };

  return (
    <div className="flex gap-4" style={{ minHeight: 560 }}>
      <div className="w-5/12 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Select value={statusF} onChange={e => setStatusF(e.target.value)} className="flex-1 text-xs">
            <option value="">All</option>
            {['open','in_progress','waiting_user','resolved','closed'].map(s =>
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </Select>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex-shrink-0">{unreadCount} new</span>}
        </div>
        <p className="text-xs text-gray-500">{n(allTotal)} tickets</p>
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {loading.list ? <Spinner />
            : allTickets.map(t => (
            <button key={t._id} onClick={() => open(t._id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${activeId === t._id ? 'border-blue-500 bg-blue-900/20' : 'border-white/10 bg-[#1a2235] hover:bg-white/5'}`}>
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-sm font-medium text-gray-200 truncate">{t.subject}</p>
                <Badge label={t.status.replace(/_/g,' ')} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="truncate">{t.email}</span>
                <span className={{'low':'text-gray-400','medium':'text-blue-400','high':'text-orange-400','urgent':'text-red-400'}[t.priority]}>{t.priority}</span>
              </div>
              {!t.readByAdmin && <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#1a2235] border border-white/10 rounded-xl p-4 min-w-0">
        {!adminTicket
          ? <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a ticket</div>
          : loading.ticket
          ? <Spinner />
          : <>
            <div className="mb-3 border-b border-white/10 pb-3">
              <h3 className="text-gray-100 font-semibold">{adminTicket.subject}</h3>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <Badge label={adminTicket.status.replace(/_/g,' ')} />
                <Badge label={adminTicket.category} cls="bg-white/10 text-gray-300" />
                <Badge label={adminTicket.priority}  cls="bg-white/10 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{adminTicket.email} · {dt(adminTicket.createdAt)}</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1.5">User message</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{adminTicket.message}</p>
              </div>
              {adminTicket.replies?.map((r, i) => (
                <div key={i} className={`rounded-xl p-3 ${r.authorRole === 'admin' ? 'bg-blue-900/30 ml-8 border border-blue-700/30' : 'bg-white/5 mr-8'}`}>
                  <p className="text-xs text-gray-500 mb-1.5">{r.authorRole === 'admin' ? '🛡 Support' : 'User'} · {dt(r.createdAt)}</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {adminTicket.status !== 'closed' && (
              <div className="space-y-2">
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Type reply…"
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500" />
                <div className="flex gap-2">
                  <Select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="flex-1 text-xs">
                    <option value="">Keep status</option>
                    {['in_progress','waiting_user','resolved','closed'].map(s =>
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </Select>
                  <button onClick={send} disabled={!reply.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            )}
          </>
        }
      </div>
    </div>
  );
}

// ── Withdrawals Tab ───────────────────────────────────────────────────────────
function WithdrawalsTab({ dispatch }) {
  const { allWithdrawals, allTotal, pendingCount, loading, success, error } = useSelector(s => s.withdrawals);
  const [statusF, setStatusF] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState({});

  useEffect(() => {
    dispatch(adminFetchWithdrawals({ status: statusF }));
  }, [statusF, dispatch]);

  const doAction = () => {
    const { type, item } = modal;
    if (type === 'approve') dispatch(adminApproveWithdrawal({ id: item._id, adminNote: form.note }));
    if (type === 'reject')  dispatch(adminRejectWithdrawal({ id: item._id, adminNote: form.note }));
    if (type === 'paid')    dispatch(adminMarkPaid({ id: item._id, txHash: form.txHash, adminNote: form.note }));
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All</option>
          {['pending','approved','rejected','paid'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        {pendingCount > 0 && <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2.5 py-1 rounded-full">{pendingCount} pending</span>}
        <span className="text-xs text-gray-500 ml-auto">{n(allTotal)} requests</span>
      </div>
      {success && <p className="text-green-400 text-sm">{success}</p>}
      {error   && <p className="text-red-400 text-sm">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead><tr><Th>Email</Th><Th>Amount</Th><Th>Wallet</Th><Th>Network</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {loading.list ? <tr><td colSpan={7}><Spinner /></td></tr>
              : allWithdrawals.map(w => (
              <tr key={w._id} className="hover:bg-white/3">
                <Td>{w.email}</Td>
                <Td className="text-green-400 font-semibold">{usd(w.amount)}</Td>
                <Td className="font-mono text-gray-400 text-xs">{w.walletAddress?.slice(0,8)}…{w.walletAddress?.slice(-4)}</Td>
                <Td className="text-gray-500 text-xs">{w.network}</Td>
                <Td><Badge label={w.status} /></Td>
                <Td className="text-xs text-gray-500">{date(w.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1">
                    {w.status === 'pending' && <>
                      <button onClick={() => { setModal({ type:'approve', item:w }); setForm({}); }} title="Approve" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400"><CheckCircle className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setModal({ type:'reject',  item:w }); setForm({}); }} title="Reject"  className="p-1.5 rounded-lg hover:bg-red-500/20   text-red-400"><XCircle className="w-3.5 h-3.5" /></button>
                    </>}
                    {w.status === 'approved' && (
                      <button onClick={() => { setModal({ type:'paid', item:w }); setForm({}); }} title="Mark Paid" className="p-1.5 rounded-lg hover:bg-teal-500/20 text-teal-400"><DollarSign className="w-3.5 h-3.5" /></button>
                    )}
                    {w.txHash && <a href={`https://etherscan.io/tx/${w.txHash}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400"><Eye className="w-3.5 h-3.5" /></a>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2235] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold capitalize">{modal.type} Withdrawal</h3>
            <p className="text-gray-400 text-sm">{modal.item.email} — {usd(modal.item.amount)}</p>
            {modal.type === 'paid' && (
              <Input placeholder="Transaction hash *" value={form.txHash || ''} onChange={e => setForm(f => ({ ...f, txHash: e.target.value }))} />
            )}
            <textarea rows={2} placeholder="Admin note (optional)" value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={doAction} disabled={modal.type === 'paid' && !form.txHash?.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">Confirm</button>
              <button onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────
function BroadcastTab({ dispatch, loading, actionSuccess, error }) {
  const [mode, setMode]       = useState('targeted');
  const [segment, setSegment] = useState('free_users');
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [nTitle, setNT]       = useState('');
  const [nMsg, setNM]         = useState('');
  const [result, setResult]   = useState(null);

  const SEGS = [
    { v:'free_users',       l:'Free users (upsell)' },
    { v:'premium_users',    l:'Premium users' },
    { v:'trial_users',      l:'Trial users' },
    { v:'expiring_soon',    l:'Expiring in 7 days' },
    { v:'inactive_30d',     l:'Inactive 30+ days' },
    { v:'never_subscribed', l:'Has credits, never paid' },
    { v:'all',              l:'All users' },
  ];

  const send = async () => {
    if (mode === 'targeted') {
      const res = await dispatch(sendTargetedEmail({ segment, subject, htmlContent: body }));
      if (res.payload) setResult(res.payload);
    } else {
      try {
        const { authAPI } = await import('../services/api');
        const res = await authAPI.post('/admin/broadcast/notification', { title: nTitle, message: nMsg, type: 'announcement', priority: 'medium' });
        if (res.data.success) setResult({ successCount: res.data.data.notificationCount });
      } catch (e) { /* handled by error state */ }
    }
  };

  const ready = mode === 'targeted' ? (subject.trim() && body.trim()) : (nTitle.trim() && nMsg.trim());

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex gap-2">
        {[['targeted','Targeted Email'],['notification','In-App Notification']].map(([v,l]) => (
          <button key={v} onClick={() => setMode(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${mode===v ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {result        && <p className="text-green-400 text-sm">Sent to {result.successCount} users</p>}
      {actionSuccess && !result && <p className="text-green-400 text-sm">{actionSuccess}</p>}
      {error         && <p className="text-red-400 text-sm">{error}</p>}

      {mode === 'targeted' ? (
        <>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Audience Segment</label>
            <Select value={segment} onChange={e => setSegment(e.target.value)} className="w-full">
              {SEGS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Subject</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">HTML Body</label>
            <textarea rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="<p>Hello,</p>…"
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 resize-y focus:outline-none focus:border-blue-500" />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Title</label>
            <Input value={nTitle} onChange={e => setNT(e.target.value)} placeholder="Notification title" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Message</label>
            <textarea rows={4} value={nMsg} onChange={e => setNM(e.target.value)} placeholder="Notification message body"
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500" />
          </div>
        </>
      )}

      <button onClick={send} disabled={loading.action || !ready}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
        {loading.action ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Campaign
      </button>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ rev, ua, pa, loading, dispatch }) {
  useEffect(() => {
    dispatch(fetchUserAnalytics());
    dispatch(fetchPlatformAnalytics());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {loading.analytics ? <Spinner /> : <>
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Active Users</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card icon={Users}         label="DAU"                value={n(ua?.activeUsers?.dau)}  iconCls="text-blue-400" />
            <Card icon={Users}         label="WAU"                value={n(ua?.activeUsers?.wau)}  iconCls="text-purple-400" />
            <Card icon={Users}         label="MAU"                value={n(ua?.activeUsers?.mau)}  iconCls="text-green-400" />
            <Card icon={AlertTriangle} label="Premium Inactive 30d" value={n(ua?.premiumInactive)} iconCls="text-red-400" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">New Signups</p>
          <div className="grid grid-cols-3 gap-4">
            <Card icon={TrendingUp} label="Today"   value={n(ua?.newUsers?.today)} iconCls="text-cyan-400" />
            <Card icon={TrendingUp} label="7 days"  value={n(ua?.newUsers?.week)}  iconCls="text-cyan-400" />
            <Card icon={TrendingUp} label="30 days" value={n(ua?.newUsers?.month)} iconCls="text-cyan-400" />
          </div>
        </div>
        {pa?.botStats?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Bot Status Breakdown</p>
            <div className="flex gap-4 flex-wrap">
              {pa.botStats.map(b => (
                <div key={b._id} className="bg-[#1a2235] border border-white/10 rounded-xl p-4 min-w-[130px]">
                  <p className="text-xs text-gray-400 capitalize">{b._id}</p>
                  <p className="text-2xl font-bold text-white">{b.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {pa?.signalStats?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Signal Stats</p>
            <div className="flex gap-4 flex-wrap">
              {pa.signalStats.map(s => (
                <div key={s._id} className="bg-[#1a2235] border border-white/10 rounded-xl p-4 min-w-[130px]">
                  <p className="text-xs text-gray-400">{s._id}</p>
                  <p className="text-2xl font-bold text-white">{s.count}</p>
                  <p className="text-xs text-gray-500">Avg {(s.avgConf * 100).toFixed(1)}% conf</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {ua?.roleBreakdown?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">User Role Breakdown</p>
            <div className="flex gap-4 flex-wrap">
              {ua.roleBreakdown.map(r => (
                <div key={r._id} className="bg-[#1a2235] border border-white/10 rounded-xl p-4 min-w-[120px]">
                  <p className="text-xs text-gray-400 capitalize">{r._id}</p>
                  <p className="text-2xl font-bold text-white">{r.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────────────────
function AuditTab({ auditLogs, auditTotal, loading, dispatch }) {
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAuditLogs({ page, limit: 30, action: filter }));
  }, [page, filter, dispatch]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          {['user_role_changed','user_deactivated','user_deleted','premium_granted','trial_granted','broadcast_email','withdrawal_approved','withdrawal_paid','ticket_replied','settings_updated'].map(a =>
            <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
        </Select>
        <span className="text-xs text-gray-500">{n(auditTotal)} entries</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead><tr><Th>Action</Th><Th>Admin</Th><Th>Target</Th><Th>Description</Th><Th>Date</Th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {loading.audit ? <tr><td colSpan={5}><Spinner /></td></tr>
              : auditLogs.map(l => (
              <tr key={l._id} className="hover:bg-white/3">
                <Td className="font-medium">{String(l.action || '').replace(/_/g,' ')}</Td>
                <Td className="text-gray-400">{l.adminEmail}</Td>
                <Td className="text-gray-400">{l.targetEmail || '—'}</Td>
                <Td className="text-gray-500 max-w-[200px] truncate">{l.description}</Td>
                <Td className="text-xs text-gray-500">{dt(l.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <button disabled={page===1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/5">← Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p+1)} className="px-3 py-1.5 bg-[#1a2235] border border-white/10 rounded-lg hover:bg-white/5">Next →</button>
      </div>
    </div>
  );
}

// ── Payment Keys Tab ──────────────────────────────────────────────────────────
function PaymentKeysTab({ dispatch }) {
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState('');
  const [error, setError]   = useState('');
  const [show, setShow]     = useState({});
  const [keys, setKeys]     = useState({
    nowpaymentsApiKey: '', nowpaymentsIpnSecret: '',
    coinbaseApiKey: '', coinbaseWebhookSecret: '',
    cryptopayApiKey: '', cryptopayApiSecret: '', cryptopayCallbackSecret: '',
  });

  useEffect(() => {
    dispatch(fetchPaymentKeyStatus()).then(r => { if (r.payload) setStatus(r.payload); });
  }, [dispatch]);

  const toggle = f => setShow(s => ({ ...s, [f]: !s[f] }));

  const handleSave = async (provider, fields) => {
    setSaving(true); setSaved(''); setError('');
    const payload = {};
    fields.forEach(f => { if (keys[f]) payload[f] = keys[f]; });
    const r = await dispatch(savePaymentKeys(payload));
    setSaving(false);
    if (r.payload?.success) {
      setSaved(`${provider} keys saved`);
      const r2 = await dispatch(fetchPaymentKeyStatus());
      if (r2.payload) setStatus(r2.payload);
      // clear inputs
      const cleared = {};
      fields.forEach(f => { cleared[f] = ''; });
      setKeys(k => ({ ...k, ...cleared }));
    } else {
      setError(r.payload || 'Save failed');
    }
  };

  const StatusDot = ({ ok }) => (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${ok ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-gray-500'}`} />
      {ok ? 'Configured' : 'Not set'}
    </span>
  );

  const KeyField = ({ label, field, placeholder }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={keys[field]}
          onChange={e => setKeys(k => ({ ...k, [field]: e.target.value }))}
          placeholder={placeholder || 'Paste key here…'}
          className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 pr-10 focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <button type="button" onClick={() => toggle(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
          {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const providers = [
    {
      id: 'nowpayments',
      name: 'NOWPayments',
      color: 'from-blue-600/20 to-blue-700/10',
      border: 'border-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-300',
      guide: 'account.nowpayments.io → Settings → API Keys → Generate Key',
      guideLink: 'https://account.nowpayments.io/api-keys',
      fields: [
        { label: 'API Key', field: 'nowpaymentsApiKey', placeholder: 'Your NOWPayments API key' },
        { label: 'IPN Secret', field: 'nowpaymentsIpnSecret', placeholder: 'Your IPN secret for webhooks' },
      ],
      status: status?.nowpayments,
      statusFields: [{ label: 'API Key', ok: status?.nowpayments?.apiKey }, { label: 'IPN Secret', ok: status?.nowpayments?.ipnSecret }],
      saveFields: ['nowpaymentsApiKey', 'nowpaymentsIpnSecret'],
    },
    {
      id: 'coinbase',
      name: 'Coinbase Commerce',
      color: 'from-blue-500/20 to-indigo-700/10',
      border: 'border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-300',
      guide: 'commerce.coinbase.com → Settings → API Keys → Create API key',
      guideLink: 'https://commerce.coinbase.com/dashboard/settings',
      fields: [
        { label: 'API Key', field: 'coinbaseApiKey', placeholder: 'Your Coinbase Commerce API key' },
        { label: 'Webhook Secret', field: 'coinbaseWebhookSecret', placeholder: 'Webhook shared secret' },
      ],
      status: status?.coinbase,
      statusFields: [{ label: 'API Key', ok: status?.coinbase?.apiKey }, { label: 'Webhook Secret', ok: status?.coinbase?.webhookSecret }],
      saveFields: ['coinbaseApiKey', 'coinbaseWebhookSecret'],
    },
    {
      id: 'cryptopay',
      name: 'CryptoPay',
      color: 'from-purple-600/20 to-purple-700/10',
      border: 'border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-300',
      guide: 'business.cryptopay.me → Settings → API → Create credentials',
      guideLink: 'https://business.cryptopay.me/settings/api',
      fields: [
        { label: 'API Key', field: 'cryptopayApiKey', placeholder: 'Your CryptoPay API key' },
        { label: 'API Secret', field: 'cryptopayApiSecret', placeholder: 'Your CryptoPay API secret' },
        { label: 'Callback Secret', field: 'cryptopayCallbackSecret', placeholder: 'Webhook callback secret' },
      ],
      status: status?.cryptopay,
      statusFields: [
        { label: 'API Key', ok: status?.cryptopay?.apiKey },
        { label: 'API Secret', ok: status?.cryptopay?.apiSecret },
        { label: 'Callback Secret', ok: status?.cryptopay?.callbackSecret },
      ],
      saveFields: ['cryptopayApiKey', 'cryptopayApiSecret', 'cryptopayCallbackSecret'],
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-base font-semibold text-white">Payment Gateway Keys</p>
        <p className="text-xs text-gray-500 mt-1">Keys are stored encrypted in the database. Leave a field blank to keep the existing value. Fields are masked for security.</p>
      </div>

      {saved && <p className="text-sm text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{saved}</p>}
      {error && <p className="text-sm text-red-400 flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</p>}

      {providers.map(p => (
        <div key={p.id} className={`rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${p.badge}`}>{p.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {p.statusFields?.map(sf => (
                <div key={sf.label} className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{sf.label}:</span>
                  <StatusDot ok={sf.ok} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/20 rounded-lg px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">{p.guide}</p>
            <a href={p.guideLink} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline ml-3 whitespace-nowrap">Open →</a>
          </div>

          <div className="space-y-3">
            {p.fields.map(f => <KeyField key={f.field} {...f} />)}
          </div>

          <button
            onClick={() => handleSave(p.name, p.saveFields)}
            disabled={saving || p.saveFields.every(f => !keys[f])}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Save {p.name} Keys
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ settings, loading, dispatch, actionSuccess, error }) {
  const [form, setForm] = useState({});
  const [ann,  setAnn]  = useState({});

  useEffect(() => {
    if (!settings) return;
    setForm({
      activePaymentProvider:   settings.activePaymentProvider   ?? 'coinbase_commerce',
      premiumPriceUSD:         settings.premiumPriceUSD         ?? 20,
      premiumDurationDays:     settings.premiumDurationDays     ?? 30,
      referralRewardUSD:       settings.referralRewardUSD       ?? 5,
      freeSignalsPerDay:       settings.freeSignalsPerDay       ?? 2,
      freeSignalMaxConfidence: settings.freeSignalMaxConfidence ?? 0.60,
      freeArbitrageLimit:      settings.freeArbitrageLimit      ?? 5,
      freeArbitrageMaxProfit:  settings.freeArbitrageMaxProfit  ?? 1.0,
      maintenanceMode:         settings.maintenanceMode         ?? false,
      freeTrialDays:           settings.freeTrialDays           ?? 7,
      minWithdrawalAmount:     settings.minWithdrawalAmount     ?? 10,
    });
    setAnn({
      announcementActive:  settings.announcementActive  ?? false,
      announcementMessage: settings.announcementMessage || '',
      announcementType:    settings.announcementType    || 'info',
      announcementExpires: settings.announcementExpires
        ? new Date(settings.announcementExpires).toISOString().slice(0, 16) : '',
    });
  }, [settings]);

  const numField = (name, label, min = 0, step = 1) => (
    <div key={name}>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input type="number" step={step} min={min} value={form[name] ?? ''} onChange={e => setForm(f => ({ ...f, [name]: parseFloat(e.target.value) }))}
        className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
    </div>
  );

  const ANN_COLORS = {
    info:    'bg-blue-900/40 text-blue-300',
    warning: 'bg-yellow-900/40 text-yellow-300',
    success: 'bg-green-900/40 text-green-300',
    error:   'bg-red-900/40 text-red-300',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-300">Platform Settings</p>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Payment Provider</label>
          <Select value={form.activePaymentProvider || ''} onChange={e => setForm(f => ({ ...f, activePaymentProvider: e.target.value }))} className="w-full">
            {['coinbase_commerce','nowpayments','cryptopay'].map(p => <option key={p} value={p}>{p.replace(/_/g,' ')}</option>)}
          </Select>
        </div>

        {numField('premiumPriceUSD',        'Premium Price (USD)',       1)}
        {numField('premiumDurationDays',    'Premium Duration (days)',   1)}
        {numField('referralRewardUSD',      'Referral Reward (USD)',     0)}
        {numField('freeTrialDays',          'Free Trial Default (days)', 1)}
        {numField('minWithdrawalAmount',    'Min Withdrawal (USD)',      1)}
        {numField('freeSignalsPerDay',      'Free Signals / Day',        0)}
        {numField('freeArbitrageLimit',     'Free Arb Limit',            0)}
        {numField('freeArbitrageMaxProfit', 'Free Arb Max Profit %',     0, 0.1)}

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!form.maintenanceMode} onChange={e => setForm(f => ({ ...f, maintenanceMode: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-300">Maintenance Mode</span>
        </label>

        {actionSuccess && <p className="text-green-400 text-sm">{actionSuccess}</p>}
        {error         && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={() => dispatch(updateAdminSettings(form))} disabled={loading.settings}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
          {loading.settings ? <Loader className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />} Save Settings
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Megaphone className="w-4 h-4" />Announcement Banner</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!ann.announcementActive} onChange={e => setAnn(a => ({ ...a, announcementActive: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
          <span className="text-sm text-gray-300">{ann.announcementActive ? 'Active (showing to users)' : 'Inactive'}</span>
        </label>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Type</label>
          <Select value={ann.announcementType || 'info'} onChange={e => setAnn(a => ({ ...a, announcementType: e.target.value }))} className="w-full">
            {['info','warning','success','error'].map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Message</label>
          <textarea rows={3} value={ann.announcementMessage} onChange={e => setAnn(a => ({ ...a, announcementMessage: e.target.value }))} placeholder="Announcement text…"
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Expires (optional)</label>
          <input type="datetime-local" value={ann.announcementExpires} onChange={e => setAnn(a => ({ ...a, announcementExpires: e.target.value }))}
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500" />
        </div>

        {ann.announcementMessage && (
          <div className={`rounded-xl p-3 text-sm font-medium text-center ${ANN_COLORS[ann.announcementType] || ANN_COLORS.info}`}>
            {ann.announcementMessage}
          </div>
        )}

        <button onClick={() => dispatch(updateAnnouncement(ann))}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Megaphone className="w-4 h-4" /> Save Announcement
        </button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key:'overview',      label:'Overview',      icon: BarChart2 },
  { key:'users',         label:'Users',         icon: Users },
  { key:'subscriptions', label:'Subscriptions', icon: DollarSign },
  { key:'support',       label:'Support',       icon: LifeBuoy },
  { key:'withdrawals',   label:'Withdrawals',   icon: ArrowDownCircle },
  { key:'broadcast',     label:'Broadcast',     icon: Mail },
  { key:'analytics',     label:'Analytics',     icon: Activity },
  { key:'audit',         label:'Audit Log',     icon: Shield },
  { key:'payment-keys',  label:'Payment Keys',  icon: Key },
  { key:'settings',      label:'Settings',      icon: Settings },
];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('overview');
  const {
    stats, users, usersTotal, subscriptions, subsTotal, settings,
    revenueAnalytics: rev, userAnalytics: ua, platformAnalytics: pa,
    auditLogs, auditTotal, loading, error, actionSuccess,
  } = useSelector(s => s.admin);
  const { unreadCount  } = useSelector(s => s.support);
  const { pendingCount } = useSelector(s => s.withdrawals);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminSettings());
    dispatch(fetchRevenueAnalytics({ period: 30 }));
    dispatch(fetchPlatformAnalytics());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-6">
      <div className="max-w-screen-xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your platform, users, and operations</p>
        </div>

        {/* Feedback banners */}
        {actionSuccess && (
          <div className="flex items-center gap-2 bg-green-900/30 border border-green-600/40 text-green-300 rounded-xl px-4 py-2.5 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {actionSuccess}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-600/40 text-red-300 rounded-xl px-4 py-2.5 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap border-b border-white/10 pb-0 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => { setTab(key); dispatch(clearAdminAction()); }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors relative ${
                tab === key
                  ? 'text-white bg-[#1a2235] border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {key==='support'     && unreadCount  > 0 && <span className="bg-red-500    text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{unreadCount}</span>}
              {key==='withdrawals' && pendingCount > 0  && <span className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {tab==='overview'      && <OverviewTab stats={stats} loading={loading} rev={rev} ua={ua} pa={pa} />}
          {tab==='users'         && <UsersTab users={users} usersTotal={usersTotal} loading={loading} dispatch={dispatch} actionSuccess={actionSuccess} error={error} />}
          {tab==='subscriptions' && <SubscriptionsTab subscriptions={subscriptions} subsTotal={subsTotal} loading={loading} dispatch={dispatch} rev={rev} />}
          {tab==='support'       && <SupportTab dispatch={dispatch} />}
          {tab==='withdrawals'   && <WithdrawalsTab dispatch={dispatch} />}
          {tab==='broadcast'     && <BroadcastTab dispatch={dispatch} loading={loading} actionSuccess={actionSuccess} error={error} />}
          {tab==='analytics'     && <AnalyticsTab rev={rev} ua={ua} pa={pa} loading={loading} dispatch={dispatch} />}
          {tab==='audit'         && <AuditTab auditLogs={auditLogs} auditTotal={auditTotal} loading={loading} dispatch={dispatch} />}
          {tab==='payment-keys'  && <PaymentKeysTab dispatch={dispatch} />}
          {tab==='settings'      && <SettingsTab settings={settings} loading={loading} dispatch={dispatch} actionSuccess={actionSuccess} error={error} />}
        </div>

      </div>
    </div>
  );
}
