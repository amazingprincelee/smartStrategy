import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Clock, Lock, CheckCircle,
  ArrowDownCircle, RefreshCw, AlertCircle, Wallet, Info,
} from 'lucide-react';
import {
  fetchInvestmentDashboard,
  applyInvestment,
  requestWithdrawal,
  clearInvestmentMessages,
} from '../redux/slices/investmentSlice';

// ── Helpers ───────────────────────────────────────────────────────────────────
const usd  = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = (n) => `${(n ?? 0).toFixed(1)}%`;
const dateStr = (d) => d ? new Date(d).toLocaleDateString() : '—';

// Tier config is static — defined here so the form always renders immediately
const TIERS = {
  starter: { minAmount: 30,   apy: 15 },
  growth:  { minAmount: 500,  apy: 18 },
  premium: { minAmount: 2000, apy: 20 },
};

const TIER_META = {
  starter: { color: 'border-cyan-500/30 bg-cyan-500/5',   badge: 'bg-cyan-500/20 text-cyan-300',   dot: 'bg-cyan-400'  },
  growth:  { color: 'border-blue-500/30 bg-blue-500/5',   badge: 'bg-blue-500/20 text-blue-300',   dot: 'bg-blue-400'  },
  premium: { color: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
};

const STATUS_META = {
  pending_payment: { label: 'Awaiting Payment', color: 'text-yellow-400' },
  active:          { label: 'Active',           color: 'text-green-400'  },
  withdrawn:       { label: 'Withdrawn',        color: 'text-gray-400'   },
  completed:       { label: 'Completed',        color: 'text-blue-400'   },
};

const W_STATUS = {
  pending:  { label: 'Pending',  color: 'text-yellow-400' },
  approved: { label: 'Approved', color: 'text-blue-400'   },
  paid:     { label: 'Paid',     color: 'text-green-400'  },
  rejected: { label: 'Rejected', color: 'text-red-400'    },
};

// ── Tier cards ────────────────────────────────────────────────────────────────
function TierCard({ name, meta, selected, onSelect }) {
  const m = TIER_META[name];
  return (
    <button
      onClick={() => onSelect(name)}
      className={`relative rounded-2xl border p-4 text-left transition-all ${m.color} ${
        selected ? 'ring-2 ring-white/30 scale-[1.02]' : 'hover:ring-1 hover:ring-white/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${m.badge}`}>
          {name}
        </span>
        <span className="text-2xl font-extrabold text-white">{pct(meta.apy)}</span>
      </div>
      <p className="text-xs text-gray-400">APY</p>
      <p className="text-sm font-semibold text-gray-200 mt-2">Min ${meta.minAmount}</p>
      <p className="text-xs text-gray-500 mt-1">30-day lock period</p>
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-white/60" />
        </div>
      )}
    </button>
  );
}

// ── Apply form ────────────────────────────────────────────────────────────────
function ApplyForm({ loading, error, success, dispatch }) {
  const [tier,   setTier]   = useState('starter');
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');

  const meta = TIERS[tier];
  const numAmt = Number(amount);
  const dailyEarning = numAmt > 0 ? numAmt * (meta.apy / 100 / 365) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearInvestmentMessages());
    const result = await dispatch(applyInvestment({ tier, amount: numAmt }));
    if (applyInvestment.fulfilled.match(result)) {
      window.location.href = result.payload.paymentUrl;
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        Start Investing
      </h3>

      {/* Tier picker */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(TIERS).map(([name, tierMeta]) => (
          <TierCard key={name} name={name} meta={tierMeta} selected={tier === name} onSelect={setTier} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount input */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            Investment Amount (USD) — min ${meta.minAmount}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              min={meta.minAmount}
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`${meta.minAmount}`}
              required
              className="w-full bg-brandDark-900 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          {numAmt > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated daily earnings: <span className="text-green-400 font-semibold">{usd(dailyEarning)}</span>
              {' '}· Annual: <span className="text-green-400 font-semibold">{usd(numAmt * meta.apy / 100)}</span>
            </p>
          )}
        </div>

        {/* Wallet address */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            Withdrawal Wallet Address (optional — set now or later)
          </label>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="USDT TRC20 / ERC20 address"
            className="w-full bg-brandDark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {error  && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
        {success && <p className="text-xs text-green-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />{success}</p>}

        <button
          type="submit"
          disabled={loading || !amount || numAmt < meta.minAmount}
          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          Pay with Crypto & Start Earning
        </button>

        <p className="text-[10px] text-gray-600 text-center">
          Payments processed via NOWPayments · Earnings accrue daily · 30-day lock on principal
        </p>
      </form>
    </div>
  );
}

// ── Active investment card ────────────────────────────────────────────────────
function InvestmentCard({ inv, dispatch, loading }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wType, setWType]     = useState('earnings');
  const [wallet, setWallet]   = useState('');
  const [wError, setWError]   = useState(null);

  const m      = TIER_META[inv.tier] || TIER_META.starter;
  const sm     = STATUS_META[inv.status] || {};
  const locked = inv.maturityDate && new Date() < new Date(inv.maturityDate);
  const balance = inv.amount + inv.totalEarnings;

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

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${m.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${m.badge}`}>{inv.tier}</span>
          <span className={`text-xs font-semibold ${sm.color}`}>{sm.label}</span>
        </div>
        <span className="text-sm font-bold text-white">{pct(inv.apy)} APY</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-xl bg-black/20 border border-white/6">
          <p className="text-[9px] text-gray-500">Invested</p>
          <p className="text-sm font-bold text-white">{usd(inv.amount)}</p>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/6">
          <p className="text-[9px] text-gray-500">Earnings</p>
          <p className="text-sm font-bold text-green-400">{usd(inv.totalEarnings)}</p>
        </div>
        <div className="p-2 rounded-xl bg-black/20 border border-white/6">
          <p className="text-[9px] text-gray-500">Balance</p>
          <p className="text-sm font-bold text-white">{usd(balance)}</p>
        </div>
      </div>

      {inv.status === 'active' && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {locked ? (
            <><Lock className="w-3 h-3 text-orange-400" />
              Principal locked until {dateStr(inv.maturityDate)}
            </>
          ) : (
            <><CheckCircle className="w-3 h-3 text-green-400" />
              Lock period complete — full withdrawal available
            </>
          )}
        </div>
      )}

      {inv.startDate && (
        <p className="text-[10px] text-gray-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Started {dateStr(inv.startDate)}
        </p>
      )}

      {inv.status === 'active' && !showWithdraw && (
        <button
          onClick={() => setShowWithdraw(true)}
          className="w-full py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          Request Withdrawal
        </button>
      )}

      {showWithdraw && (
        <form onSubmit={handleWithdraw} className="space-y-3 p-3 rounded-xl bg-black/20 border border-white/8">
          <p className="text-xs font-semibold text-gray-300">Withdrawal Request</p>
          <div className="flex gap-2">
            {['earnings', ...(locked ? [] : ['principal', 'all'])].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setWType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                  wType === t ? 'bg-cyan-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t === 'all' ? 'All (principal + earnings)' : t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="USDT TRC20 / ERC20 wallet address"
            className="w-full bg-brandDark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
          />
          {wError && <p className="text-xs text-red-400">{wError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowWithdraw(false)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-gray-600">Withdrawals are processed manually by our team within 24–48 hours.</p>
        </form>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Trade4Me() {
  const dispatch      = useDispatch();
  const [searchParams] = useSearchParams();
  const { investments, withdrawals, loading, error, success } = useSelector(s => s.investment);

  useEffect(() => {
    dispatch(fetchInvestmentDashboard());
    dispatch(clearInvestmentMessages());
  }, [dispatch]);

  const paymentSuccess = searchParams.get('success') === '1';
  const activeInvestments = investments.filter(i => ['active', 'pending_payment'].includes(i.status));
  const pastInvestments   = investments.filter(i => ['withdrawn', 'completed'].includes(i.status));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Trade4Me
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Deposit funds, earn passive returns, withdraw anytime after the 30-day lock.
        </p>
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/25 bg-green-500/8">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-300">
            Payment received! Your investment will be activated within a few minutes once confirmed on-chain.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="p-4 rounded-xl border border-brandDark-600 bg-brandDark-800 text-xs text-gray-400 space-y-2">
        <p className="font-semibold text-gray-300 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />How it works</p>
        <ul className="space-y-1 list-disc list-inside ml-1">
          <li>Choose a tier and deposit the minimum amount via crypto</li>
          <li>Earnings accrue daily based on your APY</li>
          <li>Principal is locked for 30 days — earnings can be withdrawn anytime</li>
          <li>All withdrawals are processed manually within 24–48 hours</li>
        </ul>
      </div>

      {/* Apply form (only if no active investment) */}
      {activeInvestments.length === 0 && (
        <ApplyForm loading={loading} error={error} success={success} dispatch={dispatch} />
      )}

      {/* Active investments */}
      {activeInvestments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Your Investments</h2>
            <button
              onClick={() => dispatch(fetchInvestmentDashboard())}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error  && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
          {success && <p className="text-xs text-green-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />{success}</p>}

          {activeInvestments.map(inv => (
            <InvestmentCard key={inv._id} inv={inv} dispatch={dispatch} loading={loading} />
          ))}

          {/* Add new investment link */}
          <div className="text-center pt-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              + Add another investment
            </button>
          </div>

          {/* Show apply form below active investments too */}
          <ApplyForm loading={loading} error={error} success={success} dispatch={dispatch} />
        </div>
      )}

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-gray-400" />
            Withdrawal History
          </h2>
          <div className="rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/4">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w._id} className="border-t border-white/5">
                    <td className="px-3 py-2 text-gray-400">{dateStr(w.requestedAt)}</td>
                    <td className="px-3 py-2 text-gray-300 capitalize">{w.type}</td>
                    <td className="px-3 py-2 text-right text-white font-medium">{usd(w.amount)}</td>
                    <td className={`px-3 py-2 font-semibold ${W_STATUS[w.status]?.color || 'text-gray-400'}`}>
                      {W_STATUS[w.status]?.label || w.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past investments */}
      {pastInvestments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400">Past Investments</h2>
          {pastInvestments.map(inv => (
            <InvestmentCard key={inv._id} inv={inv} dispatch={dispatch} loading={loading} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-600 text-center pt-2">
        For informational purposes only. Returns are not guaranteed. Past performance is not indicative of future results.
      </p>
    </div>
  );
}
