import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users, DollarSign, Activity, Settings, LifeBuoy,
  BarChart2, Shield, Mail, CheckCircle, XCircle,
  AlertTriangle, Trash2, Gift, TrendingUp, Send,
  Megaphone, Eye, EyeOff, Loader, ArrowDownCircle, Clock, Key,
  Receipt, ChevronRight, RefreshCw, Copy, Wallet, Layers,
  Radio, Target, ShieldAlert, Trophy, Plus, Pencil, Check,
} from 'lucide-react';
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminSubscriptions,
  fetchAdminSettings, updateAdminSettings, adminActivateUser,
  adminGrantTrial, adminSearchUsers, adminUpdateUser, adminDeleteUser,
  fetchRevenueAnalytics, fetchUserAnalytics, fetchPlatformAnalytics,
  fetchAuditLogs, sendTargetedEmail, updateAnnouncement,
  clearAdminAction, fetchPaymentKeyStatus, savePaymentKeys,
  fetchAdminTransactions, fetchTransactionStats, fetchTransactionDetail,
} from '../redux/slices/adminSlice';
import { adminFetchAllTickets, adminFetchTicket, adminReplyTicket } from '../redux/slices/supportSlice';
import { adminFetchWithdrawals, adminApproveWithdrawal, adminRejectWithdrawal, adminMarkPaid } from '../redux/slices/withdrawalSlice';
import {
  fetchAdminInvestmentStats, fetchAdminInvestorList,
  fetchAdminWithdrawals, adminUpdateWithdrawal, triggerManualAccrual,
  clearInvestmentMessages,
} from '../redux/slices/investmentSlice';
import {
  fetchTradeCalls, fetchTradeCallStats,
  adminCreateTradeCall, adminUpdateTradeCall, adminDeleteTradeCall,
} from '../redux/slices/tradeCallSlice';
import TradeCallCard from '../components/TradeCalls/TradeCallCard';

// ── Supported trading pairs (shared with analysis module) ─────────────────────
const TRADE_PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','SOLUSDT','ADAUSDT','LTCUSDT','DOGEUSDT',
  'AVAXUSDT','DOTUSDT','ATOMUSDT','NEARUSDT','LINKUSDT','UNIUSDT','AAVEUSDT','MATICUSDT',
  'ARBUSDT','OPUSDT','APTUSDT','SUIUSDT','INJUSDT','STXUSDT','ICPUSDT','FILUSDT',
  'PEPEUSDT','SHIBUSDT','FLOKIUSDT','BONKUSDT','WIFUSDT','MEMEUSDT',
  'FETUSDT','RNDRUSDT','WLDUSDT','AGIXUSDT','OCEANUSDT',
  'AXSUSDT','SANDUSDT','MANAUSDT','GALAUSDT','APEUSDT','GMTUSDT',
  'RUNEUSDT','THETAUSDT','EGLDUSDT','VETUSDT','HBARUSDT','ALGOUSDT',
  'TONUSDT','JUPUSDT','FTMUSDT','XTZUSDT','ZRXUSDT',
];

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
      premiumPriceUSD:         settings.premiumPriceUSD         ?? 29,
      premiumDurationDays:     settings.premiumDurationDays     ?? 30,
      referralRewardPercent:   settings.referralRewardPercent   ?? 25,
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
        {numField('referralRewardPercent',   'Referral Reward (%)',       0)}
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

// ── TransactionsTab ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  initiated:  'bg-gray-500/20 text-gray-300',
  pending:    'bg-yellow-500/20 text-yellow-300',
  processing: 'bg-blue-500/20 text-blue-300',
  completed:  'bg-green-500/20 text-green-300',
  failed:     'bg-red-500/20 text-red-400',
  expired:    'bg-orange-500/20 text-orange-300',
  refunded:   'bg-purple-500/20 text-purple-300',
};

function TransactionsTab({ dispatch }) {
  const { transactions, transactionsTotal, transactionStats, transactionDetail, loading } = useSelector(s => s.admin);
  const [status,   setStatus]   = useState('all');
  const [provider, setProvider] = useState('all');
  const [range,    setRange]    = useState('30d');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null); // open detail modal

  const load = () => {
    const params = { page, limit: 20, status, provider, range };
    if (search) params.search = search;
    dispatch(fetchAdminTransactions(params));
    dispatch(fetchTransactionStats());
  };

  useEffect(() => { load(); }, [status, provider, range, page]); // eslint-disable-line
  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const openDetail = (txn) => {
    setSelected(txn);
    dispatch(fetchTransactionDetail(txn._id));
  };

  const stats = transactionStats;
  const totalPages = Math.ceil(transactionsTotal / 20);

  return (
    <div className="space-y-4">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue',     value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, color: 'text-green-400',  sub: `${stats?.completed || 0} completed` },
          { label: 'Pending',     value: stats?.pending    || 0,                       color: 'text-yellow-400', sub: 'awaiting payment' },
          { label: 'Failed',      value: stats?.failed     || 0,                       color: 'text-red-400',    sub: `${stats?.expired || 0} expired` },
          { label: 'Success Rate',value: `${stats?.successRate || 0}%`,                color: 'text-blue-400',   sub: `${stats?.total || 0} total attempts` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-brandDark-900 rounded-xl border border-white/8 p-3 sm:p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-brandDark-900 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500">Go</button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {['all','initiated','pending','processing','completed','failed','expired'].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['today','7d','30d','90d','all'].map(r => (
            <button key={r} onClick={() => { setRange(r); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading.transactions ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Mobile cards / Desktop table ── */}
      {loading.transactions ? (
        <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-primary-400" /></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No transactions found</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {transactions.map(txn => (
              <button key={txn._id} onClick={() => openDetail(txn)}
                className="w-full text-left p-3 rounded-xl border border-white/8 bg-brandDark-900 hover:bg-brandDark-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white truncate mr-2">{txn.userEmail}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[txn.status] || 'bg-gray-500/20 text-gray-300'}`}>
                    {txn.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="text-green-400 font-mono font-semibold">${(txn.amountUSD || 0).toFixed(2)}</span>
                  <span className="capitalize">{txn.provider?.replace('_', ' ')}</span>
                  <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                </div>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-white/8 bg-white/3">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Provider</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Ref ID</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[160px]">{txn.userEmail}</p>
                      <p className="text-[10px] text-gray-600">{txn.userName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{txn.provider?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-green-400">${(txn.amountUSD || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[txn.status] || 'bg-gray-500/20 text-gray-300'}`}>
                        {txn.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(txn.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-600 max-w-[120px] truncate" title={txn.chargeId}>
                      {txn.chargeId ? txn.chargeId.slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(txn)} className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{transactionsTotal} total</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 disabled:opacity-40">Prev</button>
                <span className="px-3 py-1 text-gray-400">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full sm:max-w-lg bg-brandDark-800 rounded-t-2xl sm:rounded-2xl border border-brandDark-600 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brandDark-700 flex-shrink-0">
              <div>
                <p className="font-semibold text-white">{selected.userEmail}</p>
                <p className="text-xs text-gray-500">{selected.provider?.replace(/_/g, ' ')} · ${(selected.amountUSD||0).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status.toUpperCase()}</span>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto p-4 space-y-4">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Amount USD',   val: `$${(selected.amountUSD||0).toFixed(2)}` },
                  { label: 'Plan',         val: `${selected.plan} · ${selected.planDurationDays}d` },
                  { label: 'Provider',     val: selected.provider?.replace(/_/g,' ') },
                  { label: 'Charge ID',    val: selected.chargeId || '—' },
                  { label: 'IP Address',   val: selected.ipAddress || '—' },
                  { label: 'Created',      val: selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—' },
                  { label: 'Completed',    val: selected.completedAt ? new Date(selected.completedAt).toLocaleString() : '—' },
                  { label: 'Failed At',    val: selected.failedAt ? new Date(selected.failedAt).toLocaleString() : '—' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-white/3 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">{label}</p>
                    <p className="text-xs text-gray-300 font-mono break-all">{val}</p>
                  </div>
                ))}
              </div>

              {selected.failReason && (
                <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                  <p className="text-xs text-red-400"><span className="font-semibold">Fail reason: </span>{selected.failReason}</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Timeline</p>
                {loading.transactions ? (
                  <div className="flex justify-center py-4"><Loader className="w-4 h-4 animate-spin text-gray-500" /></div>
                ) : (
                  <div className="space-y-2">
                    {(transactionDetail?._id === selected._id ? transactionDetail.events : []).map((ev, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${STATUS_COLORS[ev.status]?.includes('green') ? 'bg-green-400' : STATUS_COLORS[ev.status]?.includes('red') ? 'bg-red-400' : STATUS_COLORS[ev.status]?.includes('yellow') ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                          {i < (transactionDetail?.events?.length ?? 0) - 1 && <div className="w-px flex-1 bg-white/8 mt-1" style={{minHeight:'16px'}} />}
                        </div>
                        <div className="pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[ev.status] || 'bg-gray-500/20 text-gray-400'}`}>{ev.status.toUpperCase()}</span>
                            <span className="text-[10px] text-gray-600">{new Date(ev.timestamp).toLocaleString()}</span>
                          </div>
                          {ev.message && <p className="text-xs text-gray-400 mt-0.5">{ev.message}</p>}
                        </div>
                      </div>
                    ))}
                    {!transactionDetail && <p className="text-xs text-gray-600 text-center py-2">Loading timeline…</p>}
                  </div>
                )}
              </div>

              {selected.checkoutUrl && (
                <a href={selected.checkoutUrl} target="_blank" rel="noreferrer"
                  className="block text-center text-xs text-primary-400 hover:text-primary-300 underline">
                  View payment page ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trade4Me Admin Tab ────────────────────────────────────────────────────────
const TIER_BADGE = {
  starter: { bg: 'bg-cyan-500/15  text-cyan-300  border-cyan-500/20',  dot: 'bg-cyan-400'  },
  growth:  { bg: 'bg-blue-500/15  text-blue-300  border-blue-500/20',  dot: 'bg-blue-400'  },
  premium: { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/20', dot: 'bg-amber-400' },
};
const INV_STATUS = {
  active:          { label: 'Active',          cls: 'bg-green-500/15  text-green-300  border-green-500/20'  },
  pending_payment: { label: 'Pending Payment', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' },
  withdrawn:       { label: 'Withdrawn',       cls: 'bg-gray-500/15   text-gray-400   border-gray-500/20'   },
  completed:       { label: 'Completed',       cls: 'bg-blue-500/15   text-blue-300   border-blue-500/20'   },
};
const WD_STATUS = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', cls: 'bg-blue-500/15   text-blue-300   border-blue-500/20',   dot: 'bg-blue-400'  },
  paid:     { label: 'Paid',     cls: 'bg-green-500/15  text-green-300  border-green-500/20',   dot: 'bg-green-400' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/15    text-red-300    border-red-500/20',     dot: 'bg-red-400'   },
};

function TierPill({ tier }) {
  const m = TIER_BADGE[tier] || { bg: 'bg-gray-500/15 text-gray-400 border-gray-500/20', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${m.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {tier}
    </span>
  );
}
function StatusPill({ status, map }) {
  const m = map[status] || { label: status, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/20' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.cls} capitalize`}>{m.label}</span>;
}

// ── Trade Calls Admin Tab ──────────────────────────────────────────────────────

const EMPTY_FORM = { pair: '', direction: 'long', entryPrice: '', stopLoss: '', tp1: '', tp2: '', notes: '' };

function TradeCallsAdminTab({ dispatch }) {
  const { calls, stats, loading, error, success } = useSelector(s => s.tradeCalls);
  const [view,      setView]      = useState('active');
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [toast,     setToast]     = useState(null);
  const [pairQuery, setPairQuery] = useState('');
  const [pairOpen,  setPairOpen]  = useState(false);

  const filteredPairs = pairQuery.length === 0
    ? TRADE_PAIRS
    : TRADE_PAIRS.filter(p => p.includes(pairQuery.toUpperCase()));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    dispatch(fetchTradeCallStats());
    dispatch(fetchTradeCalls({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (success) showToast(success);
  }, [success]);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.pair || !form.entryPrice || !form.stopLoss || !form.tp1) {
      showToast('Fill in pair, entry, stop loss and TP1', 'error');
      return;
    }
    if (editId) {
      const r = await dispatch(adminUpdateTradeCall({ id: editId, ...form }));
      if (adminUpdateTradeCall.fulfilled.match(r)) { setEditId(null); setForm(EMPTY_FORM); setView('active'); }
    } else {
      const r = await dispatch(adminCreateTradeCall(form));
      if (adminCreateTradeCall.fulfilled.match(r)) { setForm(EMPTY_FORM); setView('active'); }
    }
  };

  const startEdit = (call) => {
    setForm({
      pair: call.pair, direction: call.direction,
      entryPrice: call.entryPrice, stopLoss: call.stopLoss,
      tp1: call.tp1, tp2: call.tp2 || '', notes: call.notes || '',
    });
    setPairQuery('');
    setEditId(call._id);
    setView('post');
  };

  const handleResolve = async (id, status) => {
    if (!window.confirm(`Mark this call as ${status}?`)) return;
    const r = await dispatch(adminUpdateTradeCall({ id, status }));
    if (adminUpdateTradeCall.fulfilled.match(r)) showToast(`Marked as ${status}`);
    else showToast('Action failed', 'error');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trade call?')) return;
    const r = await dispatch(adminDeleteTradeCall(id));
    if (adminDeleteTradeCall.fulfilled.match(r)) showToast('Deleted');
  };

  const activeCalls  = calls.filter(c => ['open', 'tp1_hit'].includes(c.status));
  const historyCalls = calls.filter(c => ['win', 'loss', 'cancelled'].includes(c.status));

  const VIEWS = [
    { key: 'active',  label: 'Active Calls', count: activeCalls.length },
    { key: 'history', label: 'History',       count: historyCalls.length },
    { key: 'post',    label: editId ? 'Edit Call' : 'Post New Call', icon: Plus },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/15">
            <Radio className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Trade Calls</h2>
            <p className="text-xs text-gray-500">Post and manage analyst trade calls</p>
          </div>
        </div>
        <button onClick={() => { dispatch(fetchTradeCallStats()); dispatch(fetchTradeCalls({ limit: 50 })); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/4 hover:bg-white/8 text-xs text-gray-400 hover:text-white transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-900/30 border-red-600/30 text-red-300' : 'bg-green-900/30 border-green-600/30 text-green-300'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Win Rate',    value: `${stats.winRate}%`,      color: stats.winRate >= 70 ? 'text-emerald-400' : 'text-yellow-400' },
            { label: '30-Day Rate', value: `${stats.recentWinRate}%`, color: 'text-cyan-400' },
            { label: 'Total Wins',  value: stats.wins,               color: 'text-emerald-400' },
            { label: 'Total Losses',value: stats.losses,             color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#111827] p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-white/8 overflow-x-auto">
        {VIEWS.map(({ key, label, count, icon: Icon }) => (
          <button key={key} onClick={() => { setView(key); if (key !== 'post') { setEditId(null); setForm(EMPTY_FORM); } }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              view === key ? 'text-white bg-[#1a2235] border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
            {count > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
          </button>
        ))}
      </div>

      {/* ── POST FORM ── */}
      {view === 'post' && (
        <div className="rounded-2xl border border-white/8 bg-[#111827] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Trade Call' : 'Post New Trade Call'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">Pair (e.g. BTCUSDT)</label>
              <input
                value={pairQuery || form.pair}
                onChange={e => {
                  const v = e.target.value.toUpperCase();
                  setPairQuery(v);
                  sf('pair', v);
                  setPairOpen(true);
                }}
                onFocus={() => setPairOpen(true)}
                onBlur={() => setTimeout(() => setPairOpen(false), 150)}
                placeholder="Search or type a pair…"
                autoComplete="off"
                className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
              />
              {pairOpen && filteredPairs.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1729] shadow-xl">
                  {filteredPairs.map(pair => (
                    <li
                      key={pair}
                      onMouseDown={() => {
                        sf('pair', pair);
                        setPairQuery('');
                        setPairOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        form.pair === pair
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'text-gray-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {pair}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Direction</label>
              <div className="flex gap-2">
                {['long', 'short'].map(d => (
                  <button key={d} onClick={() => sf('direction', d)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      form.direction === d
                        ? d === 'long' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'border-white/10 text-gray-400 hover:text-white'
                    }`}>
                    {d === 'long' ? '▲ LONG' : '▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>
            {[
              { key: 'entryPrice', label: 'Entry Price ($)' },
              { key: 'stopLoss',   label: 'Stop Loss ($)' },
              { key: 'tp1',        label: 'TP1 — Take Profit 1 ($)' },
              { key: 'tp2',        label: 'TP2 — Take Profit 2 (optional)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input type="number" value={form[key]} onChange={e => sf(key, e.target.value)}
                  className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Analysis Notes</label>
            <textarea value={form.notes} onChange={e => sf('notes', e.target.value)} rows={3}
              placeholder="Briefly explain the reasoning behind this call..."
              className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 resize-none" />
          </div>

          <div className="flex gap-3 justify-end">
            {editId && (
              <button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setView('active'); }}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
            )}
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {editId ? 'Update Call' : 'Post Trade Call'}
            </button>
          </div>
        </div>
      )}

      {/* ── ACTIVE CALLS ── */}
      {view === 'active' && (
        <div className="space-y-3">
          {activeCalls.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active trade calls</p>
              <button onClick={() => setView('post')} className="mt-3 text-xs text-yellow-400 hover:underline">Post your first call →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeCalls.map(call => (
                <div key={call._id} className="relative group">
                  <TradeCallCard call={call} />
                  {/* Admin action overlay */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
                    <button onClick={() => startEdit(call)} title="Edit"
                      className="p-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleResolve(call._id, 'win')} title="Mark Win"
                      className="p-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-400 transition-colors">
                      <Trophy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleResolve(call._id, 'loss')} title="Mark Loss"
                      className="p-1.5 rounded-lg bg-red-900/90 hover:bg-red-800 text-red-400 transition-colors">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(call._id)} title="Delete"
                      className="p-1.5 rounded-lg bg-gray-800/90 hover:bg-red-900 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {view === 'history' && (
        <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/8">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Pair</th>
                <th className="px-4 py-3 text-left">Direction</th>
                <th className="px-4 py-3 text-right">Entry</th>
                <th className="px-4 py-3 text-right">TP1</th>
                <th className="px-4 py-3 text-right">SL</th>
                <th className="px-4 py-3 text-right">Close Price</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {historyCalls.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No history yet</td></tr>
              ) : historyCalls.map(call => (
                <tr key={call._id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-4 py-3 font-semibold text-white">{call.pair}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${call.direction === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {call.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">${Number(call.entryPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">${Number(call.tp1).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-400">${Number(call.stopLoss).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{call.closingPrice ? `$${Number(call.closingPrice).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      call.status === 'win'  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      call.status === 'loss' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {call.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {call.closedAt ? new Date(call.closedAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Trade4MeTab({ dispatch }) {
  const { adminStats, investorList, investorTotal, adminWithdrawals, adminWithdrawalsTotal, loading: invLoading, error: invError, success: invSuccess } =
    useSelector(s => s.investment);
  const adminSettings = useSelector(s => s.admin.settings);

  const [view,      setView]      = useState('overview');
  const [wStatus,   setWStatus]   = useState('all');
  const [iStatus,   setIStatus]   = useState('all');
  const [noteMap,   setNoteMap]   = useState({});
  const [toast,     setToast]     = useState(null);
  const [copied,    setCopied]    = useState(null);
  const [expanded,  setExpanded]  = useState(null);

  // ── Settings form state ──────────────────────────────────────────
  const [sfSaving,  setSfSaving]  = useState(false);
  const [sfForm,    setSfForm]    = useState(null); // null = not yet loaded

  // Sync form when admin settings arrive
  useEffect(() => {
    if (adminSettings?.trade4me && !sfForm) {
      const t = adminSettings.trade4me;
      setSfForm({
        starter_apy:       t.tiers?.starter?.apy       ?? 15,
        starter_min:       t.tiers?.starter?.minAmount ?? 30,
        starter_enabled:   t.tiers?.starter?.enabled   ?? true,
        growth_apy:        t.tiers?.growth?.apy        ?? 18,
        growth_min:        t.tiers?.growth?.minAmount  ?? 500,
        growth_enabled:    t.tiers?.growth?.enabled    ?? true,
        premium_apy:       t.tiers?.premium?.apy       ?? 20,
        premium_min:       t.tiers?.premium?.minAmount ?? 2000,
        premium_enabled:   t.tiers?.premium?.enabled   ?? true,
        lockDays:          t.lockDays             ?? 30,
        acceptingInvestments: t.acceptingInvestments ?? true,
      });
    }
  }, [adminSettings, sfForm]);

  // Default form before settings load
  const sf = sfForm ?? {
    starter_apy: 15, starter_min: 30,   starter_enabled: true,
    growth_apy:  18, growth_min:  500,  growth_enabled:  true,
    premium_apy: 20, premium_min: 2000, premium_enabled: true,
    lockDays: 30, acceptingInvestments: true,
  };

  const setSf = (key, val) => setSfForm(prev => ({ ...(prev ?? sf), [key]: val }));

  const handleSaveSettings = async () => {
    setSfSaving(true);
    const payload = {
      trade4me: {
        tiers: {
          starter: { apy: Number(sf.starter_apy), minAmount: Number(sf.starter_min), enabled: sf.starter_enabled },
          growth:  { apy: Number(sf.growth_apy),  minAmount: Number(sf.growth_min),  enabled: sf.growth_enabled  },
          premium: { apy: Number(sf.premium_apy), minAmount: Number(sf.premium_min), enabled: sf.premium_enabled },
        },
        lockDays: Number(sf.lockDays),
        acceptingInvestments: sf.acceptingInvestments,
      },
    };
    const result = await dispatch(updateAdminSettings(payload));
    setSfSaving(false);
    if (updateAdminSettings.fulfilled.match(result)) {
      showToast('Settings saved successfully');
      dispatch(fetchAdminSettings());
    } else {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleAccrueEarnings = async () => {
    if (!window.confirm('Manually trigger today\'s earnings accrual for all active investments?')) return;
    const result = await dispatch(triggerManualAccrual());
    if (triggerManualAccrual.fulfilled.match(result)) {
      showToast(`Accrual complete — ${result.payload.updated} investments updated`);
    } else {
      showToast('Accrual failed', 'error');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const reload = () => {
    dispatch(fetchAdminInvestmentStats());
    dispatch(fetchAdminInvestorList({ status: iStatus === 'all' ? undefined : iStatus }));
    dispatch(fetchAdminWithdrawals({ status: wStatus === 'all' ? undefined : wStatus }));
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line

  const loadInvestors   = (s) => dispatch(fetchAdminInvestorList({ status: s === 'all' ? undefined : s }));
  const loadWithdrawals = (s) => dispatch(fetchAdminWithdrawals({ status: s === 'all' ? undefined : s }));

  const handleWAction = async (id, status) => {
    const note = noteMap[id] || '';
    const result = await dispatch(adminUpdateWithdrawal({ id, status, adminNote: note }));
    if (adminUpdateWithdrawal.fulfilled.match(result)) {
      showToast(`Withdrawal ${status}`);
      loadWithdrawals(wStatus);
      dispatch(fetchAdminInvestmentStats());
    } else {
      showToast('Action failed', 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const s = adminStats;
  const totalBalance = (s?.totalInvested ?? 0) + (s?.totalEarnings ?? 0);

  const VIEWS = [
    { key: 'overview',    label: 'Overview',    icon: BarChart2        },
    { key: 'investors',   label: 'Investors',   icon: Users,   count: investorTotal },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle, count: s?.pendingWithdrawals, countColor: 'bg-yellow-500' },
    { key: 'settings',    label: 'Settings',    icon: Settings },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/15">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Trade4Me Management</h2>
            <p className="text-xs text-gray-500">Monitor investors, process withdrawals, track earnings</p>
          </div>
        </div>
        <button onClick={reload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/4 hover:bg-white/8 text-xs text-gray-400 hover:text-white transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
          toast.type === 'error'
            ? 'bg-red-900/30 border-red-600/30 text-red-300'
            : 'bg-green-900/30 border-green-600/30 text-green-300'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Sub-nav ── */}
      <div className="flex gap-1 border-b border-white/8 pb-0 overflow-x-auto">
        {VIEWS.map(({ key, label, icon: Icon, count, countColor }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors relative ${
              view === key
                ? 'text-white bg-[#1a2235] border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={`text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5 ${countColor || 'bg-blue-600'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════ OVERVIEW ════════════════════════ */}
      {view === 'overview' && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={DollarSign}      label="Total Invested"       value={usd(s?.totalInvested)}       iconCls="text-green-400"  />
            <Card icon={TrendingUp}      label="Total Earnings Accrued" value={usd(s?.totalEarnings)}    iconCls="text-cyan-400"   />
            <Card icon={Users}           label="Active Investors"     value={n(s?.activeCount)}           iconCls="text-blue-400"   />
            <Card icon={ArrowDownCircle} label="Pending Withdrawals"  value={n(s?.pendingWithdrawals)}    iconCls="text-yellow-400" />
          </div>

          {/* Total balance + pending payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#1a2235] border border-white/10 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Managed Balance</p>
              <p className="text-2xl font-black text-white">{usd(totalBalance)}</p>
              <p className="text-xs text-gray-500">Principal + accrued earnings</p>
            </div>
            <div className="bg-[#1a2235] border border-white/10 rounded-2xl p-4 space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Activations</p>
              <p className="text-2xl font-black text-yellow-400">{n(s?.pendingPayments)}</p>
              <p className="text-xs text-gray-500">Investments awaiting payment confirmation</p>
            </div>
          </div>

          {/* Tier breakdown */}
          {s?.tierBreakdown?.length > 0 && (
            <div className="bg-[#1a2235] border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" /> Breakdown by Tier
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {s.tierBreakdown.map(t => (
                  <div key={t._id} className={`rounded-xl border p-3 ${TIER_BADGE[t._id]?.bg || 'bg-white/5 border-white/10 text-gray-300'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <TierPill tier={t._id} />
                      <span className="text-xs text-gray-400">{t.count} investor{t.count !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-lg font-bold text-white mt-1">{usd(t.total)}</p>
                    <p className="text-[10px] text-gray-500">Total invested</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════ INVESTORS ════════════════════════ */}
      {view === 'investors' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Filter:</span>
            {['all','active','pending_payment','withdrawn','completed'].map(s => (
              <button key={s} onClick={() => { setIStatus(s); loadInvestors(s); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                  iStatus === s ? 'bg-white/15 text-white border border-white/15' : 'bg-white/4 text-gray-400 hover:bg-white/8 border border-white/8'
                }`}>
                {s.replace(/_/g,' ')}
              </button>
            ))}
            <button onClick={() => loadInvestors(iStatus)} className="ml-auto p-1.5 rounded-lg bg-white/4 hover:bg-white/10 text-gray-400 border border-white/8 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-500">{n(investorTotal)} investor(s) found</p>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {investorList.map(inv => (
              <div key={inv._id} className="bg-[#1a2235] border border-white/10 rounded-2xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/3 transition-colors"
                  onClick={() => setExpanded(expanded === inv._id ? null : inv._id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-300">
                        {(inv.userId?.fullName || inv.userId?.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-100 truncate">{inv.userId?.fullName || inv.userId?.email || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{inv.userId?.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-white">{usd(inv.amount)}</p>
                    <TierPill tier={inv.tier} />
                  </div>
                </div>
                {expanded === inv._id && (
                  <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { l: 'Invested',  v: usd(inv.amount),        c: 'text-white'     },
                        { l: 'Earnings',  v: usd(inv.totalEarnings), c: 'text-green-400' },
                        { l: 'APY',       v: `${inv.apy}%`,          c: 'text-cyan-400'  },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="bg-black/20 rounded-lg p-2">
                          <p className="text-[9px] text-gray-500 uppercase">{l}</p>
                          <p className={`text-sm font-bold ${c}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <StatusPill status={inv.status} map={INV_STATUS} />
                      <span className="text-gray-500">{inv.startDate ? `Started ${date(inv.startDate)}` : 'Not started'}</span>
                    </div>
                    {inv.maturityDate && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Matures {date(inv.maturityDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {investorList.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">No investors found</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/4 border-b border-white/8">
                  <Th>Investor</Th><Th>Tier</Th><Th>Invested</Th><Th>Earnings</Th>
                  <Th>Balance</Th><Th>APY</Th><Th>Status</Th><Th>Started</Th><Th>Matures</Th>
                </tr>
              </thead>
              <tbody>
                {investorList.map(inv => (
                  <tr key={inv._id} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                    <Td>
                      <p className="font-semibold text-gray-200">{inv.userId?.fullName || '—'}</p>
                      <p className="text-xs text-gray-500">{inv.userId?.email}</p>
                    </Td>
                    <Td><TierPill tier={inv.tier} /></Td>
                    <Td><span className="font-semibold text-white tabular-nums">{usd(inv.amount)}</span></Td>
                    <Td><span className="font-semibold text-green-400 tabular-nums">{usd(inv.totalEarnings)}</span></Td>
                    <Td><span className="font-bold text-white tabular-nums">{usd((inv.amount || 0) + (inv.totalEarnings || 0))}</span></Td>
                    <Td><span className="text-cyan-400 font-bold">{inv.apy}%</span></Td>
                    <Td><StatusPill status={inv.status} map={INV_STATUS} /></Td>
                    <Td>{inv.startDate ? date(inv.startDate) : <span className="text-gray-600">—</span>}</Td>
                    <Td>{inv.maturityDate ? date(inv.maturityDate) : <span className="text-gray-600">—</span>}</Td>
                  </tr>
                ))}
                {investorList.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-500 text-sm">No investors found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════ WITHDRAWALS ════════════════════════ */}
      {view === 'withdrawals' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Filter:</span>
            {['all','pending','approved','paid','rejected'].map(s => (
              <button key={s} onClick={() => { setWStatus(s); loadWithdrawals(s); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                  wStatus === s ? 'bg-white/15 text-white border border-white/15' : 'bg-white/4 text-gray-400 hover:bg-white/8 border border-white/8'
                }`}>
                {s}
                {s === 'pending' && s?.pendingWithdrawals > 0 && (
                  <span className="ml-1 bg-yellow-500 text-white text-[9px] px-1 rounded-full">{s?.pendingWithdrawals}</span>
                )}
              </button>
            ))}
            <button onClick={() => loadWithdrawals(wStatus)} className="ml-auto p-1.5 rounded-lg bg-white/4 hover:bg-white/10 text-gray-400 border border-white/8 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-500">{n(adminWithdrawalsTotal)} request(s)</p>

          <div className="space-y-3">
            {adminWithdrawals.map(w => {
              const wm = WD_STATUS[w.status] || WD_STATUS.pending;
              return (
                <div key={w._id} className="bg-[#1a2235] border border-white/10 rounded-2xl overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4 p-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-gray-300">
                          {(w.userId?.fullName || w.userId?.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-100">{w.userId?.fullName || w.userId?.email || '—'}</p>
                        <p className="text-xs text-gray-500">{w.userId?.email}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <StatusPill status={w.status} map={WD_STATUS} />
                          <span className="text-xs text-gray-400 capitalize">{w.type} withdrawal</span>
                          {w.investmentId && <TierPill tier={w.investmentId.tier} />}
                        </div>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-white tabular-nums">{usd(w.amount)}</p>
                      <p className="text-[10px] text-gray-500">{dt(w.requestedAt)}</p>
                    </div>
                  </div>

                  {/* Investment context */}
                  {w.investmentId && (
                    <div className="mx-4 mb-3 grid grid-cols-3 gap-2 text-center">
                      {[
                        { l: 'Invested', v: usd(w.investmentId.amount)        },
                        { l: 'Earnings', v: usd(w.investmentId.totalEarnings)  },
                        { l: 'APY',      v: `${w.investmentId.apy}%`           },
                      ].map(({ l, v }) => (
                        <div key={l} className="bg-black/20 rounded-xl p-2 border border-white/5">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">{l}</p>
                          <p className="text-xs font-bold text-gray-200">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wallet address */}
                  {w.walletAddress && (
                    <div className="mx-4 mb-3 flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/8">
                      <Wallet className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <p className="text-xs text-gray-400 font-mono truncate flex-1">{w.walletAddress}</p>
                      <button
                        onClick={() => copyToClipboard(w.walletAddress, w._id)}
                        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-200 transition-colors"
                        title="Copy address"
                      >
                        {copied === w._id
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  )}

                  {/* Admin note display */}
                  {w.adminNote && (
                    <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-blue-500/8 border border-blue-500/15">
                      <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-0.5">Admin Note</p>
                      <p className="text-xs text-gray-300">{w.adminNote}</p>
                    </div>
                  )}
                  {w.processedAt && (
                    <p className="mx-4 mb-3 text-[10px] text-gray-600">Processed: {dt(w.processedAt)}</p>
                  )}

                  {/* Action area */}
                  {(w.status === 'pending' || w.status === 'approved') && (
                    <div className="border-t border-white/8 p-4 space-y-3">
                      <Input
                        value={noteMap[w._id] || ''}
                        onChange={e => setNoteMap(prev => ({ ...prev, [w._id]: e.target.value }))}
                        placeholder="Admin note — e.g. 'Sent on TRC20 network, txid: …'"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {w.status === 'pending' && (
                          <button onClick={() => handleWAction(w._id, 'approved')}
                            className="flex-1 min-w-[80px] py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors">
                            Approve
                          </button>
                        )}
                        <button onClick={() => handleWAction(w._id, 'paid')}
                          className="flex-1 min-w-[80px] py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white text-xs font-bold transition-colors">
                          Mark as Paid
                        </button>
                        {w.status === 'pending' && (
                          <button onClick={() => handleWAction(w._id, 'rejected')}
                            className="flex-1 min-w-[80px] py-2 rounded-xl bg-red-800/70 hover:bg-red-700 text-white text-xs font-bold transition-colors">
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {adminWithdrawals.length === 0 && (
              <div className="text-center py-16 space-y-2">
                <ArrowDownCircle className="w-8 h-8 text-gray-700 mx-auto" />
                <p className="text-gray-500 text-sm">No withdrawal requests</p>
                <p className="text-gray-600 text-xs">Requests will appear here when users submit them</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════ SETTINGS ════════════════════════ */}
      {view === 'settings' && (
        <div className="space-y-6">

          {/* ── Tier Configuration ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Investment Tier Configuration</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'starter', label: 'Starter', color: 'text-cyan-400',   border: 'border-cyan-500/30' },
                { key: 'growth',  label: 'Growth',  color: 'text-violet-400', border: 'border-violet-500/30' },
                { key: 'premium', label: 'Premium', color: 'text-amber-400',  border: 'border-amber-500/30' },
              ].map(({ key, label, color, border }) => (
                <div key={key} className={`rounded-xl border ${border} bg-white/3 p-4 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${color}`}>{label}</span>
                    {/* Enabled toggle */}
                    <button
                      onClick={() => setSf(`${key}_enabled`, !sf[`${key}_enabled`])}
                      className={`relative w-10 h-5 rounded-full transition-colors ${sf[`${key}_enabled`] ? 'bg-cyan-500' : 'bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sf[`${key}_enabled`] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">APY %</label>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={sf[`${key}_apy`]}
                      onChange={e => setSf(`${key}_apy`, e.target.value)}
                      className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Minimum Amount ($)</label>
                    <input
                      type="number" min="0" step="1"
                      value={sf[`${key}_min`]}
                      onChange={e => setSf(`${key}_min`, e.target.value)}
                      className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Global Settings ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Global Settings</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
                <div>
                  <p className="text-sm font-medium text-white">Accept New Investments</p>
                  <p className="text-xs text-gray-500 mt-0.5">When off, no new investment applications are accepted</p>
                </div>
                <button
                  onClick={() => setSf('acceptingInvestments', !sf.acceptingInvestments)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${sf.acceptingInvestments ? 'bg-emerald-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sf.acceptingInvestments ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <label className="text-sm font-medium text-white block mb-1">
                  Lock Period (days)
                </label>
                <p className="text-xs text-gray-500 mb-3">How long the principal is locked before withdrawal is allowed</p>
                <input
                  type="number" min="0" max="365"
                  value={sf.lockDays}
                  onChange={e => setSf('lockDays', e.target.value)}
                  className="w-32 bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* ── Save button ── */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={sfSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {sfSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              {sfSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          {/* ── Manual Operations ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111827] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Manual Operations</h3>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between p-4 rounded-xl bg-white/3 border border-yellow-500/20">
                <div>
                  <p className="text-sm font-medium text-white">Trigger Earnings Accrual</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manually runs the daily earnings calculation for all active investments.
                    The automatic cron runs at 01:00 UTC daily — only use this if it missed.
                  </p>
                </div>
                <button
                  onClick={handleAccrueEarnings}
                  disabled={invLoading}
                  className="flex-shrink-0 ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {invLoading
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <Activity className="w-4 h-4" />
                  }
                  Run Now
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Trial Grants Tab ──────────────────────────────────────────────────────────
function TrialGrantsTab({ dispatch }) {
  const { trialSearchResults, loading, actionSuccess, error } = useSelector(s => s.admin);

  const [mode, setMode]           = useState('individual'); // 'individual' | 'bulk'
  const [days, setDays]           = useState(7);
  const [customDays, setCustomDays] = useState('');
  const [note, setNote]           = useState('');
  const [searchQ, setSearchQ]     = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected]   = useState([]); // [{ _id, email, fullName }]
  const [confirming, setConfirming] = useState(false);
  const [bulkCount, setBulkCount] = useState(null);
  const [result, setResult]       = useState(null);

  const PRESETS = [3, 7, 14, 30];
  const effectiveDays = days === 'custom' ? parseInt(customDays) || 0 : days;

  // Debounced user search
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) return;
    const t = setTimeout(() => dispatch(adminSearchUsers(searchQ)), 350);
    return () => clearTimeout(t);
  }, [searchQ, dispatch]);

  // Fetch estimated bulk count when switching to bulk mode
  useEffect(() => {
    if (mode !== 'bulk') return;
    dispatch(adminSearchUsers('')).then(action => {
      // We use a rough estimate from the total users count in stats
    });
  }, [mode, dispatch]);

  function addUser(u) {
    if (!selected.find(s => s._id === u._id)) setSelected(prev => [...prev, u]);
    setSearchQ('');
    setSearchOpen(false);
  }

  function removeUser(id) {
    setSelected(prev => prev.filter(u => u._id !== id));
  }

  async function handleGrant() {
    const payload = mode === 'bulk'
      ? { all: true, days: effectiveDays, note: note || undefined }
      : { userIds: selected.map(u => u._id), days: effectiveDays, note: note || undefined };

    const res = await dispatch(adminGrantTrial(payload));
    if (adminGrantTrial.fulfilled.match(res)) {
      setResult(res.payload);
      setSelected([]);
      setNote('');
      setConfirming(false);
    }
  }

  const canGrant = effectiveDays >= 1 && (mode === 'bulk' || selected.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            Trial Grants
          </h2>
          <p className="text-sm text-gray-400 mt-1">Send free premium trial invitations via email — users claim with one click.</p>
        </div>
      </div>

      {/* Success result card */}
      {result && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/8 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">{result.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              Emails sent: <strong className="text-white">{result.sent}</strong> &nbsp;·&nbsp;
              Failed: <strong className="text-white">{result.failed}</strong> &nbsp;·&nbsp;
              Trial length: <strong className="text-amber-300">{result.trialDays} days</strong> &nbsp;·&nbsp;
              Claim window: <strong className="text-white">7 days</strong>
            </p>
          </div>
          <button onClick={() => setResult(null)} className="ml-auto text-gray-500 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      {/* Error */}
      {error && !result && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/8 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: config panel ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Mode selector */}
          <div className="p-5 rounded-xl bg-[#161b22] border border-white/8 space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Grant mode</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key:'individual', label:'Specific Users', icon: Users, desc:'Search & pick accounts' },
                { key:'bulk',       label:'All Free Users', icon: Megaphone, desc:'Every non-premium account' },
              ].map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setResult(null); dispatch(clearAdminAction()); }}
                  className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                    mode === key
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-white/8 bg-white/3 hover:border-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === key ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                    <Icon className={`w-4 h-4 ${mode === key ? 'text-amber-400' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${mode === key ? 'text-amber-300' : 'text-white'}`}>{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* User search (individual mode) */}
          {mode === 'individual' && (
            <div className="p-5 rounded-xl bg-[#161b22] border border-white/8 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Search & select users</p>

              {/* Selected chips */}
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.map(u => (
                    <div key={u._id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300">
                      <span className="font-medium">{u.fullName || u.email.split('@')[0]}</span>
                      <span className="text-amber-500/60">·</span>
                      <span className="text-amber-400/70">{u.email}</span>
                      <button onClick={() => removeUser(u._id)} className="ml-1 text-amber-500/60 hover:text-amber-300 leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 focus-within:border-amber-500/40">
                  {loading.trialSearch
                    ? <Loader className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" />
                    : <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  }
                  <input
                    value={searchQ}
                    onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                    placeholder="Search by email or name…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
                {searchOpen && trialSearchResults.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 rounded-xl bg-[#161b22] border border-white/10 shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                    {trialSearchResults.map(u => (
                      <li key={u._id}>
                        <button
                          onMouseDown={() => addUser(u)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                            {(u.fullName || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{u.fullName || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          <span className={`ml-auto flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full ${SBADGE[u.role] || SBADGE.user}`}>
                            {u.role}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searchOpen && searchQ.length >= 2 && !loading.trialSearch && trialSearchResults.length === 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl bg-[#161b22] border border-white/10 px-4 py-3 text-sm text-gray-500 text-center">
                    No users found
                  </div>
                )}
              </div>
              {selected.length === 0 && (
                <p className="text-xs text-gray-600">Start typing to search — select one or more accounts.</p>
              )}
            </div>
          )}

          {/* Bulk mode info */}
          {mode === 'bulk' && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">All free accounts will receive an invitation</p>
                <p className="text-xs text-gray-400 mt-1">
                  Every user without an active premium or trial subscription will get a claim email. Already-premium and admin accounts are automatically excluded.
                </p>
              </div>
            </div>
          )}

          {/* Trial duration */}
          <div className="p-5 rounded-xl bg-[#161b22] border border-white/8 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trial duration</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDays(d); setCustomDays(''); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    days === d
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300'
                  }`}
                >
                  {d} days
                </button>
              ))}
              <button
                onClick={() => setDays('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  days === 'custom'
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300'
                }`}
              >
                Custom
              </button>
            </div>
            {days === 'custom' && (
              <input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder="Enter days (1–365)"
                className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/40"
                style={{ colorScheme: 'dark' }}
              />
            )}
          </div>

          {/* Optional personal note */}
          <div className="p-5 rounded-xl bg-[#161b22] border border-white/8 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Personal message <span className="normal-case font-normal text-gray-600">(optional)</span></p>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={280}
              placeholder="e.g. We noticed you've been exploring the platform — here's a gift on us."
              className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-white/10 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/40"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-[10px] text-gray-600 text-right">{note.length}/280</p>
          </div>

          {/* Send button */}
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={!canGrant || loading.action}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              {mode === 'bulk'
                ? `Send Trial to All Free Users — ${effectiveDays || '?'} days`
                : `Send Trial to ${selected.length || 0} User${selected.length !== 1 ? 's' : ''} — ${effectiveDays || '?'} days`
              }
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/8 space-y-3">
              <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {mode === 'bulk'
                  ? `This will email ALL free accounts a ${effectiveDays}-day trial invitation. Confirm?`
                  : `Send a ${effectiveDays}-day trial invitation to ${selected.length} user${selected.length !== 1 ? 's' : ''}?`
                }
              </p>
              <p className="text-xs text-gray-400">
                Users receive a branded email with a claim link valid for <strong className="text-white">7 days</strong>.
                The trial only activates when they click — no charge to anyone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleGrant}
                  disabled={loading.action}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading.action ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <><Send className="w-3.5 h-3.5" /> Confirm & Send</>}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: info panel ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* How it works */}
          <div className="p-5 rounded-xl bg-[#161b22] border border-white/8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">How it works</p>
            <ol className="space-y-4">
              {[
                { n:'1', title:'Admin grants trial', desc:'Select users or all free accounts, choose duration, add an optional note and hit Send.' },
                { n:'2', title:'Email is dispatched', desc:'Each user receives a branded email with a personalised claim button — valid for 7 days.' },
                { n:'3', title:'User activates', desc:'One click on the button in their email starts the trial immediately. No account needed if already logged in.' },
                { n:'4', title:'Premium unlocked', desc:'Trial starts the moment they click. They get full access for the granted duration.' },
              ].map(({ n: num, title, desc }) => (
                <li key={num} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0 mt-0.5">
                    {num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Preview summary */}
          <div className="p-5 rounded-xl bg-[#161b22] border border-white/8 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Grant summary</p>
            <div className="space-y-2">
              {[
                ['Mode',       mode === 'bulk' ? 'All free accounts' : `${selected.length} selected user${selected.length !== 1 ? 's' : ''}`],
                ['Duration',   effectiveDays >= 1 ? `${effectiveDays} days` : '—'],
                ['Claim window', '7 days from receipt'],
                ['Note',       note ? `"${note.slice(0, 48)}${note.length > 48 ? '…' : ''}"` : 'None'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs text-white text-right font-medium max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amber callout */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 to-orange-500/4">
            <p className="text-xs font-semibold text-amber-400 mb-1">Claim-on-click design</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Trials are <strong className="text-white">not activated immediately</strong> — users must click the link in their email. This ensures only engaged users consume trial days, and links that aren't clicked simply expire harmlessly after 7 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key:'overview',      label:'Overview',      icon: BarChart2 },
  { key:'users',         label:'Users',         icon: Users },
  { key:'trade4me',      label:'Trade4Me',      icon: TrendingUp },
  { key:'trade-calls',   label:'Trade Calls',   icon: Radio },
  { key:'subscriptions', label:'Subscriptions', icon: DollarSign },
  { key:'transactions',  label:'Transactions',  icon: Receipt },
  { key:'support',       label:'Support',       icon: LifeBuoy },
  { key:'withdrawals',   label:'Withdrawals',   icon: ArrowDownCircle },
  { key:'trial-grants',  label:'Trial Grants',  icon: Gift },
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
  const t4mPending = useSelector(s => s.investment?.adminStats?.pendingWithdrawals ?? 0);

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
              {key==='trade4me'    && t4mPending   > 0  && <span className="bg-cyan-500   text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{t4mPending}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {tab==='overview'      && <OverviewTab stats={stats} loading={loading} rev={rev} ua={ua} pa={pa} />}
          {tab==='users'         && <UsersTab users={users} usersTotal={usersTotal} loading={loading} dispatch={dispatch} actionSuccess={actionSuccess} error={error} />}
          {tab==='subscriptions' && <SubscriptionsTab subscriptions={subscriptions} subsTotal={subsTotal} loading={loading} dispatch={dispatch} rev={rev} />}
          {tab==='transactions'  && <TransactionsTab dispatch={dispatch} />}
          {tab==='support'       && <SupportTab dispatch={dispatch} />}
          {tab==='withdrawals'   && <WithdrawalsTab dispatch={dispatch} />}
          {tab==='trial-grants'  && <TrialGrantsTab dispatch={dispatch} />}
          {tab==='broadcast'     && <BroadcastTab dispatch={dispatch} loading={loading} actionSuccess={actionSuccess} error={error} />}
          {tab==='analytics'     && <AnalyticsTab rev={rev} ua={ua} pa={pa} loading={loading} dispatch={dispatch} />}
          {tab==='audit'         && <AuditTab auditLogs={auditLogs} auditTotal={auditTotal} loading={loading} dispatch={dispatch} />}
          {tab==='trade4me'      && <Trade4MeTab dispatch={dispatch} />}
          {tab==='trade-calls'   && <TradeCallsAdminTab dispatch={dispatch} />}
          {tab==='payment-keys'  && <PaymentKeysTab dispatch={dispatch} />}
          {tab==='settings'      && <SettingsTab settings={settings} loading={loading} dispatch={dispatch} actionSuccess={actionSuccess} error={error} />}
        </div>

      </div>
    </div>
  );
}
