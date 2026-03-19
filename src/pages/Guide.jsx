import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bot, ArrowRightLeft, Target, Shield, Zap,
  TrendingUp, TrendingDown, BarChart2, Layers, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, BookOpen,
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
            { step: '01', label: 'Read the Signal', sub: 'AI scans 30+ pairs every 30 min' },
            { step: '02', label: 'Confirm Indicators', sub: 'Check RSI, EMA, MACD alignment' },
            { step: '03', label: 'Execute with Risk', sub: 'Use Entry / SL / TP — no guessing' },
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
          The AI engine scans the top 30+ pairs every 30 minutes across Spot and Futures markets.
          Each signal is a trade recommendation backed by 6 indicators and multi-timeframe agreement.
        </p>
        <div className="space-y-2">
          <Row label="LONG">
            <span className="text-green-400 font-semibold">Buy opportunity</span> — price expected to rise. Trade this on Spot or go Long on Futures.
          </Row>
          <Row label="SHORT">
            <span className="text-red-400 font-semibold">Sell opportunity</span> — price expected to fall. This only applies to Futures (short-selling).
          </Row>
          <Row label="Confidence">
            A score from 0–100%. <span className="text-white font-medium">Above 70% = strong signal.</span> Below 60% is free-tier visible but weaker.
          </Row>
          <Row label="Timeframe">
            1h signals are the most reliable for swing trades. 15m is faster but noisier.
          </Row>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Never trade a signal without checking the indicators first. A signal is a suggestion, not a guarantee.
        </div>
        <Link to="/signals" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <Activity className="w-3.5 h-3.5" /> Go to Signals →
        </Link>
      </Section>

      {/* 2. Reading Indicators */}
      <Section icon={BarChart2} color="bg-blue-500/15 text-blue-400" title="2 · Reading the Indicators">
        <p>
          Each analysis runs 6 indicators. The more that agree, the stronger the trade. Use the Quick Pair Analysis on your Dashboard to check any pair on demand.
        </p>
        <div className="space-y-3">
          {[
            {
              name: 'RSI (Relative Strength Index)',
              bull: 'RSI < 35 = oversold → potential bounce (buy zone)',
              bear: 'RSI > 65 = overbought → potential drop (sell zone)',
              tip: 'RSI between 40–60 is neutral. Wait for extremes.',
            },
            {
              name: 'EMA 20/50 (Short-term Trend)',
              bull: 'EMA20 above EMA50 = uptrend momentum',
              bear: 'EMA20 below EMA50 = downtrend momentum',
              tip: 'A fresh EMA20/50 crossover is a strong early signal.',
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
              tip: 'MACD confirms trend direction — don\'t trade against it.',
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
          Every signal gives you exact prices. These are not random — they're calculated using ATR (Average True Range), which measures real market volatility.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
            <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">Entry:</p>
            <p className="text-xs text-white font-bold">Current market price</p>
            <p className="text-[10px] text-gray-600 mt-1">Enter at or near this price</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">SL:</p>
            <p className="text-xs text-white font-bold">ATR × 1.5 away</p>
            <p className="text-[10px] text-gray-600 mt-1">Your maximum loss point — never move this wider</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20">
            <Zap className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">TP:</p>
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
          Don't wait for a signal — run an on-demand analysis on any pair right from the Dashboard.
          Type a coin (e.g. ETH), pick a timeframe, choose Spot or Futures, and click Analyze.
        </p>
        <div className="space-y-1.5 text-xs">
          <p><span className="text-white font-medium">When to use it:</span> Before entering a trade manually. Before setting up a bot. When a coin is trending on social media and you want a quick read.</p>
          <p><span className="text-white font-medium">Timeframe guide:</span> Use <span className="text-cyan-400">1h</span> for swing trades (hours to days). Use <span className="text-cyan-400">15m</span> for short scalps only.</p>
          <p><span className="text-white font-medium">What to look for:</span> 4+ green indicators with a LONG signal = high confidence entry. 2 or fewer = skip the trade.</p>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <Target className="w-3.5 h-3.5" /> Open Quick Pair Analysis →
        </Link>
      </Section>

      {/* 5. Using Bots */}
      <Section icon={Bot} color="bg-emerald-500/15 text-emerald-400" title="5 · Setting Up a Trading Bot">
        <p>
          Bots execute trades automatically 24/7 using your strategy rules — no screen-watching needed.
          Use a <span className="text-white font-medium">Demo bot</span> first to test before going live.
        </p>
        <div className="space-y-2 text-xs">
          <p><span className="text-white font-semibold">AI Signal bot</span> — Trades based on live signals from the engine. Best for following the system automatically.</p>
          <p><span className="text-white font-semibold">DCA bot</span> — Buys a fixed amount on a schedule, averaging your cost down over time. Good for volatile markets.</p>
          <p><span className="text-white font-semibold">RSI Reversal bot</span> — Enters when RSI hits extreme oversold/overbought levels. Good for ranging markets.</p>
          <p><span className="text-white font-semibold">EMA Crossover bot</span> — Follows EMA20/50 trend shifts. Best for trending markets, not ranging ones.</p>
          <p><span className="text-white font-semibold">Adaptive Grid bot</span> — Places buy/sell orders at price intervals. Works best in sideways price action.</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Always test on Demo mode for at least a few days before connecting real exchange API keys.
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
            { rule: 'Never risk more than 2% per trade', why: 'A losing streak of 10 trades only costs you 20% — survivable. Risking 10% per trade can wipe you in 3 losses.' },
            { rule: 'Always honor the Stop Loss', why: 'Moving your SL wider in hope of recovery is how most accounts blow up. The SL is the contract you make with yourself.' },
            { rule: 'Don\'t chase signals', why: 'If you missed the entry price by more than 1%, skip the trade. Chasing entries destroys your R:R ratio.' },
            { rule: 'One trade per pair at a time', why: 'Opening multiple positions on the same coin multiplies your risk without proportional reward.' },
            { rule: 'Reduce size in choppy markets', why: 'When the market is ranging (no clear trend), use smaller position sizes. Signals are less reliable in sideways price action.' },
            { rule: 'Take profit — don\'t get greedy', why: 'When TP is hit, close the trade. Holding for more often gives back your gains.' },
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
