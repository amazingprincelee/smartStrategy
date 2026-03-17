import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createCheckout, fetchSubscriptionStatus, clearCheckout } from '../redux/slices/subscriptionSlice';

const FREE_FEATURES = [
  '2 signals per day',
  'Signals below 60% confidence only',
  '5 arbitrage opportunities (<1% profit)',
  'Demo bot trading',
  'Community support',
];

const PREMIUM_FEATURES = [
  'Unlimited real-time signals',
  'All confidence levels — high-probability setups',
  'Full arbitrage feed (all profit tiers)',
  'Live bot trading with exchange API',
  'Backtest & on-demand analysis',
  'Email alerts for new signals',
  'Priority support',
  '$5 referral credit for every friend who subscribes',
];

export default function Pricing() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { token } = useSelector(s => s.auth);
  const isAuthenticated = !!token;
  const { isPremium, subscription, checkoutUrl, checkoutLoading, checkoutError } =
    useSelector(s => s.subscription);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchSubscriptionStatus());
    return () => { dispatch(clearCheckout()); };
  }, [isAuthenticated, dispatch]);

  // Redirect to payment URL when checkout is created
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
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you're ready for the full edge.
          </p>
        </div>

        {/* Current status banner */}
        {isPremium && (
          <div className="mb-8 p-4 rounded-xl border border-green-500/40 bg-green-500/10 text-center">
            <p className="text-green-400 font-semibold">
              You are on Premium{expiresAt ? ` — renews ${expiresAt}` : ''}.
            </p>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-400 mb-1">/month</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">No credit card required</p>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-500 mt-0.5">•</span>
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-white/10 text-center py-3 text-sm text-muted-foreground font-medium">
              Current plan (always free)
            </div>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-blue-500/50 bg-blue-500/5 p-8 flex flex-col relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Premium</p>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Most Popular</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-5xl font-bold text-white">$20</span>
                <span className="text-gray-400 mb-1">/month</span>
              </div>
              <p className="text-gray-400 text-sm">Paid in crypto — works globally</p>
            </div>
            <ul className="space-y-3 flex-1 my-8 relative">
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  <span className="text-gray-200">{f}</span>
                </li>
              ))}
            </ul>
            {isPremium ? (
              <button
                onClick={() => dispatch(createCheckout())}
                disabled={checkoutLoading}
                className="relative w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
              >
                {checkoutLoading ? 'Loading...' : 'Renew Premium'}
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="relative w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
              >
                {checkoutLoading ? 'Preparing checkout...' : 'Get Premium — $20/mo'}
              </button>
            )}
            {checkoutError && (
              <p className="text-red-400 text-sm text-center mt-3">{checkoutError}</p>
            )}
          </div>
        </div>

        {/* Referral note */}
        <p className="text-center text-muted-foreground text-sm mt-8">
          Refer a friend and earn <span className="text-blue-400 font-medium">$5 credit</span> when they subscribe.
          Share your referral link from your profile.
        </p>

        {/* FAQ */}
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-semibold text-center">FAQ</h2>
          {[
            ['What payment methods are accepted?', 'We accept crypto payments (Bitcoin, Ethereum, USDT and more) via our crypto payment gateway. No bank account or credit card needed.'],
            ['Is it a recurring subscription?', 'Yes — each payment gives you 30 days of premium access. You\'ll receive email reminders 7 days and 1 day before your subscription expires so you can renew.'],
            ['Can I cancel anytime?', 'Yes. Your access continues until the end of the paid period and there is no auto-charge — you simply choose to renew or not.'],
            ['What happens if I don\'t renew?', 'Your account automatically reverts to the free tier at expiry. Your data, bots, and settings are all preserved.'],
          ].map(([q, a]) => (
            <div key={q} className="border border-white/10 rounded-xl p-6">
              <p className="font-semibold mb-2 text-white">{q}</p>
              <p className="text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
