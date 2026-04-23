import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Crown, CheckCircle, XCircle, Loader, Clock, Zap, BarChart2, Target, Shield } from 'lucide-react';
import { authAPI } from '../services/api';
import { setGoogleSession } from '../redux/slices/authSlice';

const FEATURES = [
  { icon: BarChart2, label: 'AI Pair Analysis',     desc: 'RSI, EMA, MACD & Bollinger Bands on demand' },
  { icon: Zap,       label: 'Live Signals',          desc: 'Real-time spot & futures signals, 100+ pairs' },
  { icon: Target,    label: 'Analyst Trade Calls',   desc: 'Expert-posted entries verified before the move' },
  { icon: Shield,    label: 'Live Bot Trading',      desc: 'Connect your exchange and automate strategies' },
];

export default function ActivateTrial() {
  const [params]    = useSearchParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const token       = params.get('token');

  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [data, setData]       = useState(null);
  const [errMsg, setErrMsg]   = useState('');
  const [errCode, setErrCode] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrMsg('No activation token found in this link.');
      setErrCode('TOKEN_INVALID');
    }
  }, [token]);

  async function handleActivate() {
    setStatus('loading');
    try {
      const res = await authAPI.post('/auth/activate-trial', { token });
      const { data: payload } = res.data;
      setData(payload);
      setStatus('success');

      // Update Redux + localStorage with fresh tokens so the UI reflects premium status
      if (payload.tokens?.accessToken && payload.user) {
        localStorage.setItem('refreshToken', payload.tokens.refreshToken);
        dispatch(setGoogleSession({
          token: payload.tokens.accessToken,
          user:  payload.user,
          role:  payload.user.role,
        }));
      }
    } catch (err) {
      const d = err.response?.data;
      setErrMsg(d?.message || 'Something went wrong. Please try again.');
      setErrCode(d?.code || 'UNKNOWN');
      setStatus('error');
    }
  }

  function daysUntil(iso) {
    const ms = new Date(iso) - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Amber accent bar */}
        <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 mb-0" />

        <div className="bg-[#161b22] border border-white/8 rounded-b-2xl overflow-hidden">

          {/* ── IDLE: pre-activation ── */}
          {(status === 'idle' || status === 'loading') && token && (
            <div className="p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-amber-500 mb-2">Exclusive Offer</p>
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  You've been gifted<br />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    a Free Premium Trial
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                  Click the button below to activate your complimentary premium access — no credit card required.
                </p>
              </div>

              {/* Feature list */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleActivate}
                disabled={status === 'loading'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {status === 'loading'
                  ? <><Loader className="w-5 h-5 animate-spin" /> Activating…</>
                  : <><Zap className="w-5 h-5" /> Activate My Free Trial</>
                }
              </button>

              <p className="text-xs text-gray-600">
                By activating you agree to SmartStrategy's{' '}
                <Link to="/terms" className="text-amber-500/70 hover:text-amber-400 underline">Terms</Link>.
                No automatic charges.
              </p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {status === 'success' && data && (
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-green-400 mb-2">Trial Activated</p>
                <h1 className="text-2xl font-extrabold text-white">
                  You're now Premium!
                </h1>
                <p className="text-sm text-gray-400 mt-2">
                  Your <span className="text-amber-400 font-semibold">{data.trialDays}-day premium trial</span> is now active.
                </p>
              </div>

              {/* Countdown card */}
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-gray-400">Trial expires in</p>
                  <p className="text-lg font-extrabold text-white">
                    {daysUntil(data.expiresAt)} days
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({new Date(data.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm transition-all"
                >
                  Go to Dashboard →
                </button>
                <button
                  onClick={() => navigate('/signals')}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  Explore Signals & Analysis
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {status === 'error' && (
            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-red-400 mb-2">
                  {errCode === 'TOKEN_EXPIRED' ? 'Link Expired' : errCode === 'ALREADY_CLAIMED' ? 'Already Claimed' : 'Invalid Link'}
                </p>
                <h1 className="text-xl font-extrabold text-white">
                  {errCode === 'TOKEN_EXPIRED'   && 'This trial link has expired'}
                  {errCode === 'ALREADY_CLAIMED' && 'Trial already activated'}
                  {errCode !== 'TOKEN_EXPIRED' && errCode !== 'ALREADY_CLAIMED' && 'Something went wrong'}
                </h1>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{errMsg}</p>
              </div>

              {errCode === 'ALREADY_CLAIMED' && (
                <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-sm text-green-300">
                  Your trial is already active — head to the dashboard to use it!
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:border-white/20 transition-all"
                >
                  Go to Dashboard
                </button>
                <Link
                  to="/pricing"
                  className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-sm font-bold text-center transition-all"
                >
                  View Premium Plans
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          SmartStrategy · Questions? <a href="mailto:support@smartstrategy.io" className="text-amber-500/60 hover:text-amber-400">Contact support</a>
        </p>
      </div>
    </div>
  );
}
