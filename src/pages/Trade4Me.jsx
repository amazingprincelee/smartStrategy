import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Clock, Lock, CheckCircle,
  ArrowDownCircle, RefreshCw, AlertCircle, Info,
  Sparkles, ShieldCheck, Zap, ChevronUp,
} from 'lucide-react';
import {
  fetchInvestmentDashboard,
  applyInvestment,
  requestWithdrawal,
  clearInvestmentMessages,
} from '../redux/slices/investmentSlice';

// ── Helpers ───────────────────────────────────────────────────────────────────
const usd     = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateStr = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const daysLeft = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
};

// ── Static tier config ────────────────────────────────────────────────────────
const TIERS = [
  {
    key:       'starter',
    label:     'Starter',
    apy:       15,
    minAmount: 30,
    desc:      'Perfect entry point. Start building passive income with as little as $30.',
    icon:      Zap,
    gradient:  'from-cyan-500/20 via-cyan-500/5 to-transparent',
    border:    'border-cyan-500/30',
    ring:      'ring-cyan-500',
    badge:     'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    apyColor:  'text-cyan-400',
    btnColor:  'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700',
  },
  {
    key:       'growth',
    label:     'Growth',
    apy:       18,
    minAmount: 500,
    desc:      'Serious returns for committed investors. Higher APY, same daily accrual.',
    icon:      TrendingUp,
    gradient:  'from-blue-500/20 via-blue-500/5 to-transparent',
    border:    'border-blue-500/30',
    ring:      'ring-blue-500',
    badge:     'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    apyColor:  'text-blue-400',
    btnColor:  'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
    popular:   true,
  },
  {
    key:       'premium',
    label:     'Premium',
    apy:       20,
    minAmount: 2000,
    desc:      'Maximum returns. Our highest APY tier for dedicated investors.',
    icon:      Sparkles,
    gradient:  'from-amber-500/20 via-amber-500/5 to-transparent',
    border:    'border-amber-500/30',
    ring:      'ring-amber-500',
    badge:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    apyColor:  'text-amber-400',
    btnColor:  'bg-amber-600 hover:bg-amber-500 active:bg-amber-700',
  },
];

const TIER_MAP = Object.fromEntries(TIERS.map(t => [t.key, t]));

const STATUS_META = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  active:          { label: 'Active',            color: 'text-green-400',   bg: 'bg-green-500/10  border-green-500/20'  },
  withdrawn:       { label: 'Withdrawn',         color: 'text-gray-400',    bg: 'bg-white/5       border-white/10'       },
  completed:       { label: 'Completed',         color: 'text-blue-400',    bg: 'bg-blue-500/10   border-blue-500/20'    },
};

const W_STATUS = {
  pending:  { label: 'Pending',  color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  approved: { label: 'Approved', color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  paid:     { label: 'Paid',     color: 'text-green-400',  bg: 'bg-green-500/10'  },
  rejected: { label: 'Rejected', color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

// ── Tier selector card ────────────────────────────────────────────────────────
function TierCard({ tier, selected, onSelect }) {
  const Icon = tier.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tier.key)}
      className={`
        relative w-full text-left rounded-2xl border bg-gradient-to-br ${tier.gradient} ${tier.border}
        p-4 transition-all duration-200
        ${selected
          ? `ring-2 ${tier.ring} shadow-lg shadow-black/30 scale-[1.01]`
          : 'hover:brightness-110 active:scale-[0.99]'}
      `}
    >
      {/* Popular badge */}
      {tier.popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow-md whitespace-nowrap">
          Most Popular
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Left: icon + name */}
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-black/30`}>
            <Icon className={`w-4 h-4 ${tier.apyColor}`} />
          </div>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${tier.apyColor}`}>
              {tier.label}
            </span>
            <p className="text-[10px] text-gray-500 mt-0.5">Min {usd(tier.minAmount)}</p>
          </div>
        </div>

        {/* Right: APY */}
        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-black leading-none ${tier.apyColor}`}>{tier.apy}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">APY</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">{tier.desc}</p>

      {/* Selected indicator */}
      <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
        <CheckCircle className={`w-3.5 h-3.5 ${tier.apyColor}`} />
        <span className={tier.apyColor}>Selected</span>
      </div>
    </button>
  );
}

// ── Earnings preview strip ────────────────────────────────────────────────────
function EarningsPreview({ amount, apy, btnColor }) {
  if (!amount || amount <= 0) return null;
  const daily   = amount * apy / 100 / 365;
  const monthly = amount * apy / 100 / 12;
  const annual  = amount * apy / 100;

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/6">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Earnings Estimate</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/8">
        {[
          { label: 'Daily',   value: daily   },
          { label: 'Monthly', value: monthly },
          { label: 'Annual',  value: annual  },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-green-400">{usd(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Apply / Invest form ───────────────────────────────────────────────────────
function ApplyForm({ loading, error, success, dispatch }) {
  const [tierKey, setTierKey] = useState('starter');
  const [amount,  setAmount]  = useState('');
  const [wallet,  setWallet]  = useState('');

  const tier   = TIER_MAP[tierKey];
  const numAmt = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearInvestmentMessages());
    const result = await dispatch(applyInvestment({ tier: tierKey, amount: numAmt }));
    if (applyInvestment.fulfilled.match(result)) {
      window.location.href = result.payload.paymentUrl;
    }
  };

  return (
    <div className="space-y-5">
      {/* Section heading */}
      <div>
        <h2 className="text-base font-bold text-white">Choose Your Plan</h2>
        <p className="text-xs text-gray-500 mt-0.5">Select a tier and enter your investment amount to get started.</p>
      </div>

      {/* Tier cards — stacked on mobile, 3-col on sm+ */}
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3">
        {TIERS.map(t => (
          <TierCard key={t.key} tier={t} selected={tierKey === t.key} onSelect={setTierKey} />
        ))}
      </div>

      {/* Form fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">
            Investment Amount <span className="text-gray-600">(min {usd(tier.minAmount)})</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
            <input
              type="number"
              min={tier.minAmount}
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`e.g. ${tier.minAmount}`}
              required
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-white placeholder-gray-600
                         focus:outline-none focus:border-white/25 focus:bg-[#111827] transition-colors"
            />
          </div>
        </div>

        {/* Live earnings preview */}
        <EarningsPreview amount={numAmt} apy={tier.apy} btnColor={tier.btnColor} />

        {/* Wallet */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">
            Withdrawal Wallet <span className="text-gray-600">(optional — add now or later)</span>
          </label>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="USDT TRC20 or ERC20 address"
            className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-white/25 focus:bg-[#111827] transition-colors"
          />
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-300">{success}</p>
          </div>
        )}

        {/* CTA button */}
        <button
          type="submit"
          disabled={loading || numAmt < tier.minAmount}
          className={`
            w-full py-4 rounded-2xl text-white text-sm font-bold tracking-wide
            flex items-center justify-center gap-2.5 transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${tier.btnColor} shadow-lg active:scale-[0.98]
          `}
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
            : <><DollarSign className="w-4 h-4" /> Pay with Crypto & Start Earning</>
          }
        </button>

        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          Secured by NOWPayments · Earnings accrue daily · 30-day lock on principal
        </p>
      </form>
    </div>
  );
}

// ── Active investment dashboard card ─────────────────────────────────────────
function InvestmentCard({ inv, dispatch, loading }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wType,  setWType]  = useState('earnings');
  const [wallet, setWallet] = useState('');
  const [wError, setWError] = useState(null);

  const tier    = TIER_MAP[inv.tier] || TIER_MAP.starter;
  const sm      = STATUS_META[inv.status] || STATUS_META.active;
  const locked  = inv.maturityDate && new Date() < new Date(inv.maturityDate);
  const days    = daysLeft(inv.maturityDate);
  const balance = inv.amount + (inv.totalEarnings || 0);
  const earningsPct = inv.amount > 0 ? ((inv.totalEarnings || 0) / inv.amount * 100) : 0;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWError(null);
    const result = await dispatch(requestWithdrawal({ investmentId: inv._id, type: wType, walletAddress: wallet }));
    if (requestWithdrawal.rejected.match(result)) {
      setWError(result.payload);
    } else {
      setShowWithdraw(false);
    }
  };

  const Icon = tier.icon;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tier.gradient} ${tier.border} overflow-hidden`}>
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-black/30">
            <Icon className={`w-5 h-5 ${tier.apyColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider ${tier.apyColor}`}>{tier.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sm.bg} ${sm.color}`}>
                {sm.label}
              </span>
            </div>
            {inv.startDate && (
              <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Started {dateStr(inv.startDate)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-xl font-black ${tier.apyColor}`}>{inv.apy}%</p>
          <p className="text-[10px] text-gray-500">APY</p>
        </div>
      </div>

      {/* Balance strip */}
      <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Invested',  value: usd(inv.amount),           color: 'text-white'       },
          { label: 'Earnings',  value: usd(inv.totalEarnings),    color: 'text-green-400'   },
          { label: 'Balance',   value: usd(balance),              color: 'text-white'       },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-black/25 rounded-xl p-2.5 text-center border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-sm font-bold ${color} tabular-nums`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Earnings progress bar */}
      {inv.status === 'active' && (
        <div className="mx-4 mb-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>Earnings progress</span>
            <span className="text-green-400 font-semibold">{earningsPct.toFixed(2)}% of principal</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(earningsPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Lock status */}
      {inv.status === 'active' && (
        <div className={`mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
          locked
            ? 'bg-orange-500/8 border-orange-500/20 text-orange-300'
            : 'bg-green-500/8 border-green-500/20 text-green-300'
        }`}>
          {locked
            ? <><Lock className="w-3.5 h-3.5 flex-shrink-0" /> Principal locked · {days} day{days !== 1 ? 's' : ''} remaining (until {dateStr(inv.maturityDate)})</>
            : <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Lock period complete — full withdrawal available</>
          }
        </div>
      )}

      {/* Withdraw section */}
      {inv.status === 'active' && (
        <div className="px-4 pb-4">
          {!showWithdraw ? (
            <button
              onClick={() => setShowWithdraw(true)}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 active:bg-white/5
                         text-sm text-gray-300 hover:text-white font-medium transition-all
                         flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Request Withdrawal
            </button>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3 p-4 rounded-xl bg-black/25 border border-white/8">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-200">Withdrawal Request</p>
                <button type="button" onClick={() => setShowWithdraw(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {['earnings', ...(locked ? [] : ['principal', 'all'])].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all capitalize ${
                      wType === t
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-white/4 text-gray-400 hover:bg-white/8 border border-white/8'
                    }`}
                  >
                    {t === 'all' ? 'All (principal + earnings)' : t}
                  </button>
                ))}
              </div>

              {/* Wallet input */}
              <input
                type="text"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                placeholder="USDT TRC20 / ERC20 wallet address"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white
                           placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
              />

              {wError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/8 border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{wError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15
                             text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                  {loading ? 'Submitting…' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 text-gray-400 hover:text-white text-xs transition-all"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-gray-600 text-center">Processed manually by our team within 24–48 hours.</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ── How it works strip ────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: DollarSign, title: 'Deposit',  desc: 'Choose a tier and pay via crypto' },
    { icon: TrendingUp, title: 'Earn',     desc: 'Daily compounding based on your APY' },
    { icon: ShieldCheck,title: '30-day lock', desc: 'Principal locked, earnings withdrawable anytime' },
    { icon: ArrowDownCircle, title: 'Withdraw', desc: 'Request payout — processed within 48h' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {steps.map(({ icon: Icon, title, desc }, i) => (
        <div key={title} className="relative flex flex-col items-center text-center p-3 rounded-2xl bg-white/3 border border-white/8">
          <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center mb-2">
            <Icon className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-xs font-semibold text-gray-200 mb-0.5">{title}</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
          {/* Step number */}
          <span className="absolute top-2 left-2 text-[9px] font-bold text-gray-600">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

// ── Withdrawal history table ──────────────────────────────────────────────────
function WithdrawalHistory({ withdrawals }) {
  if (!withdrawals.length) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        <ArrowDownCircle className="w-4 h-4 text-gray-400" />
        Withdrawal History
      </h2>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {withdrawals.map(w => (
          <div key={w._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
            <div>
              <p className="text-xs font-semibold text-gray-200 capitalize">{w.type} withdrawal</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{dateStr(w.requestedAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{usd(w.amount)}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${W_STATUS[w.status]?.bg} ${W_STATUS[w.status]?.color}`}>
                {W_STATUS[w.status]?.label || w.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/4 border-b border-white/8">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Date</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Type</th>
              <th className="text-right px-4 py-3 text-gray-500 font-semibold">Amount</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w._id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-gray-400">{dateStr(w.requestedAt)}</td>
                <td className="px-4 py-3 text-gray-300 capitalize">{w.type}</td>
                <td className="px-4 py-3 text-right text-white font-bold tabular-nums">{usd(w.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${W_STATUS[w.status]?.bg} ${W_STATUS[w.status]?.color}`}>
                    {W_STATUS[w.status]?.label || w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Trade4Me() {
  const dispatch        = useDispatch();
  const [searchParams]  = useSearchParams();
  const { investments, withdrawals, loading, error, success } = useSelector(s => s.investment);

  useEffect(() => {
    dispatch(fetchInvestmentDashboard());
    dispatch(clearInvestmentMessages());
  }, [dispatch]);

  const paymentSuccess    = searchParams.get('success') === '1';
  const activeInvestments = investments.filter(i => ['active', 'pending_payment'].includes(i.status));
  const pastInvestments   = investments.filter(i => ['withdrawn', 'completed'].includes(i.status));

  return (
    <div className="min-h-screen w-full px-0">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#0f2027] border border-white/8 p-5 sm:p-8">
        {/* Glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/15">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Trade4Me</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Earn Up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">20% APY</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">
            Deposit funds, let our team trade for you, and earn daily passive returns. Withdraw your earnings anytime.
          </p>

          {/* Key stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { label: 'Max APY',        value: '20%'   },
              { label: 'Lock Period',    value: '30 days' },
              { label: 'Min Deposit',    value: '$30'   },
              { label: 'Withdrawals',    value: 'Manual' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment success banner ── */}
      {paymentSuccess && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-green-500/25 bg-green-500/8 mb-6">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">Payment Received!</p>
            <p className="text-xs text-green-400/70 mt-0.5">
              Your investment will be activated within a few minutes once confirmed on-chain.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* ── How it works ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">How It Works</h2>
          </div>
          <HowItWorks />
        </div>

        {/* ── Active investments ── */}
        {activeInvestments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Your Investments</h2>
              <button
                onClick={() => dispatch(fetchInvestmentDashboard())}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/3
                           hover:bg-white/8 text-xs text-gray-400 hover:text-white transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-300">{success}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {activeInvestments.map(inv => (
                <InvestmentCard key={inv._id} inv={inv} dispatch={dispatch} loading={loading} />
              ))}
            </div>
          </div>
        )}

        {/* ── Apply form ── */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1829] p-4 sm:p-6">
          <ApplyForm loading={loading} error={activeInvestments.length === 0 ? error : null} success={activeInvestments.length === 0 ? success : null} dispatch={dispatch} />
        </div>

        {/* ── Withdrawal history ── */}
        <WithdrawalHistory withdrawals={withdrawals} />

        {/* ── Past investments ── */}
        {pastInvestments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-400">Past Investments</h2>
            <div className="flex flex-col gap-4">
              {pastInvestments.map(inv => (
                <InvestmentCard key={inv._id} inv={inv} dispatch={dispatch} loading={loading} />
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-600 text-center pb-4 leading-relaxed">
          For informational purposes only. Returns are not guaranteed.<br className="sm:hidden" /> Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  );
}
