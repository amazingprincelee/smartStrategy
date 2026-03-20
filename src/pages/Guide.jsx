import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bot, ArrowRightLeft, Target, Shield, Zap,
  TrendingUp, BarChart2, Layers, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, BookOpen, Cpu, MousePointerClick,
} from 'lucide-react';

const Section = ({ icon: Icon, color, title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>
      {open && <div className="mt-4 space-y-3 text-sm text-gray-400 leading-relaxed">{children}</div>}
    </div>
  );
};

const Pill = ({ label, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>
);

const Row = ({ label, children }) => (
  <div className="flex gap-3">
    <span className="w-24 flex-shrink-0 text-gray-500 text-xs font-semibold uppercase tracking-wider pt-0.5">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
);

export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12 p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">How to Use SmartStrategy</h1>
          <p className="text-xs text-gray-500 mt-0.5">A practical guide to trading profitably with the system</p>
        </div>
      </div>

      {/* Quick steps banner */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-5">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-3">The 3-Step Loop</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { step: '01', label: 'Get a Signal', sub: 'AI scores pairs every cycle — best signal wins' },
            { step: '02', label: 'Set Your Risk', sub: 'Pick Safe / Moderate / Aggressive' },
            { step: '03', label: 'Let It Run', sub: 'Auto executes — or you approve in Manual mode' },
          ].map(({ step, label, sub }) => (
            <div key={step}>
              <p className="text-2xl font-extrabold text-cyan-400">{step}</p>
              <p className="text-xs font-bold text-white mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Understanding Signals */}
      <Section icon={Activity} color="bg-violet-500/15 text-violet-400" title="1 · Understanding Signals">
        <p>
          The AI engine scans top pairs every cycle across Spot and Futures markets.
          Each signal is backed by 6 indicators and multi-timeframe agreement — only the highest-scoring one gets through.
        </p>
        <div className="space-y-2">
          <Row label="LONG">
            <span className="text-green-400 font-semibold">Buy opportunity</span> — price expected to rise. Works on Spot or Futures long.
          </Row>
          <Row label="SHORT">
            <span className="text-red-400 font-semibold">Sell opportunity</span> — price expected to fall. Futures only (short-selling).
          </Row>
          <Row label="Confidence">
            A score from 0–100%. <span className="text-white font-medium">Above 70% = strong signal.</span> Free tier sees signals below 60%.
          </Row>
          <Row label="Score">
            The bot's internal ranking (0–100). Built from 4 factors: trend alignment (35%), momentum (25%), volume (15%), confidence (25%). Min passing score is 65.
          </Row>
          <Row label="Timeframe">
            1h signals are the most reliable for swing trades. 15m is faster but noisier.
          </Row>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          A signal is a scored suggestion, not a guarantee. The bot only acts on the single best-scoring signal per cycle.
        </div>
        <Link to="/signals" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <Activity className="w-3.5 h-3.5" /> Go to Signals →
        </Link>
      </Section>

      {/* 2. Reading Indicators */}
      <Section icon={BarChart2} color="bg-blue-500/15 text-blue-400" title="2 · Reading the Indicators">
        <p>
          Each analysis runs 6 indicators. The more that agree, the higher the signal score. Use Quick Pair Analysis on your Dashboard to check any pair on demand.
        </p>
        <div className="space-y-3">
          {[
            {
              name: 'RSI (Relative Strength Index)',
              bull: 'RSI < 38 = oversold → potential bounce (buy zone)',
              bear: 'RSI > 65 = overbought → potential drop (sell zone)',
              tip: 'RSI between 40–60 is neutral. Wait for extremes.',
            },
            {
              name: 'EMA 20/50 (Short-term Trend)',
              bull: 'EMA20 above EMA50 = uptrend momentum',
              bear: 'EMA20 below EMA50 = downtrend momentum',
              tip: 'A fresh EMA20/50 crossover is a strong early signal. Uptrend dips near EMA20 are also valid entries.',
            },
            {
              name: 'EMA 200 (Long-term Trend)',
              bull: 'Price above EMA200 = overall bull market',
              bear: 'Price below EMA200 = overall bear market',
              tip: 'Always align your trades with the EMA200 direction. Fighting it loses money.',
            },
            {
              name: 'MACD (Momentum)',
              bull: 'MACD line crossing above signal line = bullish momentum',
              bear: 'MACD line crossing below signal line = bearish momentum',
              tip: "MACD confirms trend direction — don't trade against it.",
            },
            {
              name: 'Bollinger Bands (Volatility)',
              bull: 'Price near lower band = potential reversal up',
              bear: 'Price near upper band = potential reversal down',
              tip: 'BB squeeze (bands tightening) means a big move is coming.',
            },
            {
              name: 'Volume',
              bull: 'Volume spike on a LONG signal = real buying pressure',
              bear: 'Low volume signal = weak move, less reliable',
              tip: 'Always prefer signals with above-average volume. Vol > 1.5× avg is strong.',
            },
          ].map(({ name, bull, bear, tip }) => (
            <div key={name} className="p-3 rounded-xl bg-white/3 border border-white/6 space-y-1.5">
              <p className="text-xs font-bold text-white">{name}</p>
              <p className="text-[11px]"><span className="text-green-400 font-medium">▲ </span>{bull}</p>
              <p className="text-[11px]"><span className="text-red-400 font-medium">▼ </span>{bear}</p>
              <p className="text-[11px] text-gray-500 italic">{tip}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Entry, SL, TP */}
      <Section icon={Target} color="bg-cyan-500/15 text-cyan-400" title="3 · Entry, Stop Loss & Take Profit">
        <p>
          Every signal gives you exact prices calculated using ATR (Average True Range), which measures real market volatility — not guesswork.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
            <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">Entry</p>
            <p className="text-xs text-white font-bold">Current market price</p>
            <p className="text-[10px] text-gray-600 mt-1">Enter at or near this price</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">SL</p>
            <p className="text-xs text-white font-bold">ATR × 1.5 away</p>
            <p className="text-[10px] text-gray-600 mt-1">Maximum loss point — never move this wider</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20">
            <Zap className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">TP</p>
            <p className="text-xs text-white font-bold">ATR × 3.0 away</p>
            <p className="text-[10px] text-gray-600 mt-1">2:1 reward-to-risk — always locked in</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-xs text-green-300">
          <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
          The system always enforces a <strong>2:1 Risk/Reward ratio</strong>. Win 1 out of 2 trades and you still break even. Win 2 out of 3 and you're profitable.
        </div>
      </Section>

      {/* 4. Quick Pair Analysis */}
      <Section icon={Layers} color="bg-indigo-500/15 text-indigo-400" title="4 · Quick Pair Analysis">
        <p>
          Run an on-demand analysis on any pair from the Dashboard or Signals page.
          Type a coin (e.g. ETH), pick a timeframe, choose Spot or Futures (Futures is default), and click Analyze.
        </p>
        <div className="space-y-1.5 text-xs">
          <p><span className="text-white font-medium">When to use it:</span> Before entering a trade manually. When a coin is trending and you want a quick read. Before setting up a bot on a specific pair.</p>
          <p><span className="text-white font-medium">Timeframe guide:</span> Use <span className="text-cyan-400">1h</span> for swing trades (hours to days). Use <span className="text-cyan-400">15m</span> for short scalps only.</p>
          <p><span className="text-white font-medium">What to look for:</span> Score ≥ 65 with 4+ green indicators = high confidence entry. Score below 65 = the bot would skip this — you should too.</p>
          <p><span className="text-white font-medium">Free tier limit:</span> 3 signal results per day (resets at midnight). Neutral results (no clear signal) don't count against your limit.</p>
        </div>
        <div className="p-3 rounded-xl bg-primary-500/8 border border-primary-500/20 text-xs text-primary-300">
          <MousePointerClick className="w-3.5 h-3.5 inline mr-1.5" />
          See a signal you like? Hit <strong>Execute Trade</strong> to open it instantly — no need to set up a full bot. You pick an existing bot or create a one-off trade, choose your risk level, and it runs.
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <Target className="w-3.5 h-3.5" /> Open Quick Pair Analysis →
        </Link>
      </Section>

      {/* 5. Using Bots */}
      <Section icon={Bot} color="bg-emerald-500/15 text-emerald-400" title="5 · Setting Up a Trading Bot">
        <p>
          The SmartSignal bot scans and scores signals every cycle across multiple indicators. It focuses on <strong className="text-white">one trade at a time</strong> — the single highest-scoring opportunity — and waits for it to close before looking again.
        </p>

        {/* Auto vs Manual */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/3 border border-white/6 space-y-1">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary-400" /> Auto Mode
            </p>
            <p className="text-[11px] text-gray-400">
              The bot selects and places the trade automatically. You just monitor. Best if you want a fully hands-off system.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/3 border border-white/6 space-y-1">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-blue-400" /> Manual Mode
            </p>
            <p className="text-[11px] text-gray-400">
              The bot scores and ranks signals but never trades on its own. It surfaces the top 3 for you to review and approve. You stay in full control.
            </p>
          </div>
        </div>

        {/* Scoring */}
        <div className="p-3 rounded-xl bg-white/3 border border-white/6">
          <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> How signals are scored
          </p>
          <div className="space-y-1.5">
            {[
              ['Multi-timeframe alignment', '35%', 'Do 5m, 15m, and 1h all agree on direction?'],
              ['Confidence score',          '25%', 'How strongly do the 6 indicators agree?'],
              ['Momentum (RSI + MACD)',     '25%', 'Is there real buying/selling pressure?'],
              ['Volume',                    '15%', 'Is the move backed by real trading activity?'],
            ].map(([factor, weight, desc]) => (
              <div key={factor} className="flex items-start gap-2 text-[11px]">
                <span className="text-cyan-400 font-bold w-8 flex-shrink-0">{weight}</span>
                <div>
                  <span className="text-white font-medium">{factor}</span>
                  <span className="text-gray-500"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Minimum passing score: 65 / 100. Below that, the bot skips the signal entirely.</p>
        </div>

        {/* Risk presets */}
        <div className="space-y-1.5 text-xs">
          <p className="text-white font-semibold">Risk Presets — how position size is calculated:</p>
          <p><Pill label="Safe" color="bg-green-500/20 text-green-400" /> 1% of your balance at risk per trade · 2× leverage on futures</p>
          <p><Pill label="Moderate" color="bg-blue-500/20 text-blue-400" /> 2% of your balance at risk per trade · 5× leverage on futures</p>
          <p><Pill label="Aggressive" color="bg-orange-500/20 text-orange-400" /> 5% of your balance at risk per trade · 10× leverage on futures</p>
          <p className="text-gray-500">The bot uses ATR stop-loss distance to calculate exactly how many units to buy so your dollar loss never exceeds the preset amount.</p>
        </div>

        {/* Safety systems */}
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <p className="font-semibold text-amber-200">Built-in safety systems:</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> After 2 losing trades in a row → bot pauses automatically for 1 hour</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> Daily loss limit → bot stops for the day if total losses hit your cap</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> Cooldown between trades → prevents overtrading after each position closes</p>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300">
          <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
          Always run a <strong>Demo bot</strong> for at least a few days before going live. Demo mode uses your real exchange's live prices with $10,000 virtual balance — no real money at risk.
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link to="/bots/create" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
            <Bot className="w-3.5 h-3.5" /> Create a Bot →
          </Link>
          <Link to="/demo" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Try Demo Mode →
          </Link>
        </div>
      </Section>

      {/* 6. Risk Management */}
      <Section icon={Shield} color="bg-red-500/15 text-red-400" title="6 · Risk Management Rules">
        <p>
          This is the most important section. Profitable traders don't win every trade — they manage losses better than others.
        </p>
        <div className="space-y-2">
          {[
            { rule: 'Never risk more than 2% per trade', why: 'A losing streak of 10 trades only costs you 20% — survivable. Risking 10% per trade can wipe you in 3 losses. Use the Safe or Moderate preset.' },
            { rule: 'Always honor the Stop Loss', why: 'Moving your SL wider in hope of recovery is how most accounts blow up. The SL is the contract you make with yourself.' },
            { rule: "Don't chase signals", why: 'If you missed the entry price by more than 1%, skip the trade. Chasing entries destroys your R:R ratio.' },
            { rule: 'One trade per pair at a time', why: 'Opening multiple positions on the same coin multiplies your risk without proportional reward. The bot enforces this automatically.' },
            { rule: 'Reduce size in choppy markets', why: 'When the market is ranging (no clear trend), signals score lower and the bot skips them. In manual mode, follow the same discipline.' },
            { rule: "Take profit — don't get greedy", why: 'When TP is hit, close the trade. Holding for more often gives back your gains.' },
          ].map(({ rule, why }) => (
            <div key={rule} className="p-3 rounded-xl bg-white/3 border border-white/6">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                {rule}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 ml-5">{why}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Arbitrage */}
      <Section icon={ArrowRightLeft} color="bg-emerald-500/15 text-emerald-400" title="7 · Arbitrage — Speed is Everything">
        <p>
          Arbitrage means buying a coin cheap on one exchange and selling it for more on another — pocketing the difference.
          The system scans 50+ exchanges in real time and alerts you to opportunities.
        </p>
        <div className="space-y-2 text-xs">
          <p><span className="text-white font-semibold">Profit % matters:</span> Aim for ≥1% net profit after transfer fees. Below that, fees often eat the margin.</p>
          <p><span className="text-white font-semibold">Speed is critical:</span> Most arb windows close within minutes. Have accounts pre-funded on multiple exchanges.</p>
          <p><span className="text-white font-semibold">Transfer risk:</span> Check the transfer status badge — <Pill label="Verified" color="bg-green-500/20 text-green-400" /> coins move fast. <Pill label="Blocked" color="bg-red-500/20 text-red-400" /> means withdrawals are paused — skip it.</p>
          <p><span className="text-white font-semibold">Volume requirement:</span> Only trade arb on coins with enough liquidity — thin order books cause slippage that wipes your profit.</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Arbitrage looks risk-free but isn't. Price can move against you during transfer time. Start small.
        </div>
        <Link to="/arbitrage" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <ArrowRightLeft className="w-3.5 h-3.5" /> View Arbitrage Scanner →
        </Link>
      </Section>

      {/* Bottom CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-6 text-center">
        <p className="text-sm font-bold text-white mb-1">Ready to trade smarter?</p>
        <p className="text-xs text-gray-400 mb-4">The signal is live. Your edge is the discipline to follow the system.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link to="/signals" className="px-5 py-2 rounded-xl bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 transition-colors">
            View Live Signals
          </Link>
          <Link to="/bots/create" className="px-5 py-2 rounded-xl bg-white/8 border border-white/15 text-white text-sm font-medium hover:bg-white/12 transition-colors">
            Create a Bot
          </Link>
        </div>
      </div>

    </div>
  );
}
