import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { createCheckout, fetchSubscriptionStatus, clearCheckout, fetchPublicSettings } from '../redux/slices/subscriptionSlice';
import { Check, X, Gift, Zap, Shield, Clock } from 'lucide-react';

const FREE_FEATURES = [
  { text: '2 signals per day', included: true },
  { text: 'Signals below 60% confidence only', included: true },
  { text: '5 arbitrage opportunities (<1% profit)', included: true },
  { text: 'Demo bot trading', included: true },
  { text: 'Community support', included: true },
  { text: 'Live bot trading', included: false },
  { text: 'Full arbitrage feed', included: false },
  { text: 'Backtest & analysis tools', included: false },
];

const PREMIUM_FEATURES = [
  'Unlimited real-time signals — all confidence levels',
  'Full arbitrage feed (all profit tiers)',
  'Live bot trading with your exchange API',
  'Backtest & on-demand technical analysis',
  'Email alerts for new signals',
  'Priority support',
];

const FAQ = [
  {
    q: 'What payment methods are accepted?',
    a: 'We accept crypto payments only — Bitcoin, Ethereum, USDT, and 50+ other coins via NOWPayments. No bank account or credit card needed. Works globally.',
  },
  {
    q: 'Is it auto-renewed?',
    a: 'No. There is no automatic charge. Each payment gives you 30 days of premium access. You\'ll receive email reminders 7 days and 1 day before your subscription expires so you can choose to renew manually.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'There is nothing to cancel — we never auto-charge you. Your premium access simply runs until the end of the 30-day period. After that you revert to the free tier automatically.',
  },
  {
    q: 'What happens if I don\'t renew?',
    a: 'Your account automatically reverts to the free tier when your subscription expires. All your data, bots, and settings are preserved — you just lose access to premium features until you renew.',
  },
  {
    q: 'Can I use it from any country?',
    a: 'Yes. SmartStrategy works globally. Crypto payments work from any country without needing a bank account.',
  },
];

export default function Pricing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector(s => s.auth);
  const isAuthenticated = !!token;
  const { isPremium, subscription, checkoutUrl, checkoutLoading, checkoutError,
          premiumPriceUSD, premiumDurationDays, referralRewardUSD } =
    useSelector(s => s.subscription);

  useEffect(() => {
    dispatch(fetchPublicSettings());
    if (isAuthenticated) dispatch(fetchSubscriptionStatus());
    return () => { dispatch(clearCheckout()); };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (checkoutUrl) window.location.href = checkoutUrl;
  }, [checkoutUrl]);

  const handleSubscribe = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(createCheckout());
  };

  const expiresAt = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase mb-3 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Simple Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            One plan. Full access.
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Start free forever. Upgrade to Premium when you're ready to trade with the full edge.
          </p>
        </div>

        {/* Active premium banner */}
        {isPremium && (
          <div className="mb-8 p-4 rounded-2xl border border-green-500/30 bg-green-500/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-green-300 font-semibold text-sm">You're on Premium</p>
                {expiresAt && <p className="text-green-500 text-xs">Access until {expiresAt}</p>}
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? 'Loading...' : 'Renew Early'}
            </button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          {/* Free card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Free</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-500 mb-2 text-sm">/month</span>
              </div>
              <p className="text-gray-500 text-sm">No credit card required. Ever.</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  {f.included
                    ? <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <X className="w-4 h-4 text-gray-700 flex-shrink-0" />
                  }
                  <span className={f.included ? 'text-gray-300' : 'text-gray-600 line-through'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="w-full py-3 rounded-xl border border-white/10 text-center text-sm text-gray-500 font-medium">
              Current plan (always free)
            </div>
          </div>

          {/* Premium card */}
          <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-950/60 to-indigo-950/40 p-8 flex flex-col relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mb-6">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Premium</p>
                <span className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                  Most Popular
                </span>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-white">${premiumPriceUSD}</span>
                <span className="text-gray-400 mb-2 text-sm">/month</span>
              </div>
              <p className="text-gray-400 text-sm">Paid in crypto — works globally, no bank needed.</p>
            </div>

            <ul className="space-y-3.5 flex-1 mb-8 relative">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-gray-200">{f}</span>
                </li>
              ))}
              {/* Referral highlight inside card */}
              <li className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gift className="w-3 h-3 text-orange-400" />
                </div>
                <span className="text-orange-300 font-medium">${referralRewardUSD} credit for every friend who subscribes</span>
              </li>
            </ul>

            <div className="relative space-y-3">
              {!isPremium && (
                <button
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                >
                  {checkoutLoading ? 'Preparing checkout…' : `Get Premium — $${premiumPriceUSD}/mo`}
                </button>
              )}
              {checkoutError && (
                <p className="text-red-400 text-xs text-center">{checkoutError}</p>
              )}
              <p className="text-center text-xs text-gray-600">
                No auto-renewal · Pay manually each month · Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Referral banner */}
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-yellow-500/5 p-6 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-bold text-white text-base mb-0.5">Earn ${referralRewardUSD} for every friend you refer</p>
            <p className="text-gray-400 text-sm">Share your unique referral link. When your friend subscribes to Premium, you get a ${referralRewardUSD} credit applied to your next renewal — automatically.</p>
          </div>
          {isAuthenticated
            ? <Link to="/profile" className="flex-shrink-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                Get Your Link →
              </Link>
            : <button onClick={() => navigate('/register')} className="flex-shrink-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap">
                Sign Up to Refer →
              </button>
          }
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { icon: Shield, label: 'Secure payments', sub: 'Via NOWPayments' },
            { icon: Clock,  label: '30-day access',   sub: 'Per payment' },
            { icon: Zap,    label: 'Instant activation', sub: 'After payment confirms' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="text-center p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-white text-xs font-semibold">{label}</p>
              <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border border-white/8 rounded-xl p-5 bg-white/[0.02]">
                <p className="font-semibold text-white mb-2 text-sm">{q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-white/5 flex justify-center gap-6 text-xs text-gray-600">
          <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <a href="mailto:princeleepraise@gmail.com" className="hover:text-gray-400 transition-colors">Contact Support</a>
        </div>

      </div>
    </div>
  );
}
