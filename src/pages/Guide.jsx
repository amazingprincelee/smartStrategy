import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bot, ArrowRightLeft, Target, Shield, Zap,
  TrendingUp, BarChart2, Layers, AlertTriangle,
  CheckCircle, ChevronDown, ChevronUp, BookOpen, Cpu,
  MousePointerClick, Play, FlaskConical, DollarSign,
  RefreshCw, Eye, Wallet,
} from 'lucide-react';

const Section = ({ icon: Icon, color, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
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
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
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
    <span className="w-28 flex-shrink-0 text-gray-500 text-xs font-semibold uppercase tracking-wider pt-0.5">{label}</span>
    <div className="flex-1 text-xs">{children}</div>
  </div>
);

const Step = ({ steps, color = 'cyan' }) => {
  const ring = {
    cyan:    'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
    violet:  'bg-violet-500/20 border-violet-500/40 text-violet-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    blue:    'bg-blue-500/20 border-blue-500/40 text-blue-400',
  }[color];
  const line = {
    cyan:    'bg-cyan-500/15',
    violet:  'bg-violet-500/15',
    emerald: 'bg-emerald-500/15',
    blue:    'bg-blue-500/15',
  }[color];
  return (
    <ol className="relative space-y-0">
      {steps.map(({ n, text }, i) => (
        <li key={n} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 z-10 ${ring}`}>
              <span className="text-[10px] font-bold">{n}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-px flex-1 my-1 ${line}`} />}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed pb-3">{text}</p>
        </li>
      ))}
    </ol>
  );
};

export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12 p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">How to Use SmartStrategy</h1>
            <p className="text-xs text-gray-500 mt-0.5">Everything you need to trade profitably with the system</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem('ss_tour_done'); window.location.reload(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary-500/40 text-xs text-primary-400 hover:bg-primary-500/10 transition-colors"
        >
          <Play className="w-3 h-3" /> Take the tour
        </button>
      </div>

      {/* 3-step loop */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-5">
        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-3">How it works — 3 steps</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { step: '01', label: 'Get a Signal',     sub: 'AI scores pairs every cycle — top signals surface on Dashboard & Signals page' },
            { step: '02', label: 'Pick Your Trade',  sub: 'Choose a signal during bot setup — or tap "Trade This" from any signal card' },
            { step: '03', label: 'Bot Executes',     sub: 'The bot opens the position immediately on start with SL & TP pre-set' },
          ].map(({ step, label, sub }) => (
            <div key={step}>
              <p className="text-2xl font-extrabold text-cyan-400">{step}</p>
              <p className="text-xs font-bold text-white mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quickstart Walkthroughs ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Quickstart Walkthroughs</h2>
            <p className="text-xs text-gray-500">Step-by-step guides to get trading in minutes</p>
          </div>
        </div>

        {/* Walkthrough 1 — Quick Pair Analysis */}
        <div className="rounded-2xl overflow-hidden border border-cyan-500/20">
          <div className="px-5 py-3.5 bg-gradient-to-r from-cyan-500/15 to-blue-600/10 border-b border-cyan-500/15">
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Walkthrough 1</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Analyze any pair on demand</h3>
          </div>
          <div className="p-5 bg-white/2">
            <Step color="cyan" steps={[
              { n: 1, text: <>Go to <span className="text-white font-semibold">Dashboard</span> — find the <span className="text-white font-semibold">Quick Pair Analysis</span> card</> },
              { n: 2, text: <>Type a coin symbol, e.g. <span className="font-mono text-cyan-400 font-semibold">BTC</span> or <span className="font-mono text-cyan-400 font-semibold">ETH</span></> },
              { n: 3, text: <>Select your timeframe (<span className="text-white font-semibold">1h</span> for swing, <span className="text-white font-semibold">15m</span> for quick scalps) and market type</> },
              { n: 4, text: <>Click <span className="text-white font-semibold">Analyze</span> — results appear below in seconds</> },
              { n: 5, text: <>Check the <span className="text-white font-semibold">score</span> — ≥ 65 means the system considers it a valid trade setup</> },
              { n: 6, text: <>Review Entry, Stop Loss, and Take Profit — if you like it, tap <span className="text-white font-semibold">Trade This</span> to launch a bot on that exact signal</> },
            ]} />
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-cyan-400 hover:underline">
              <Target className="w-3.5 h-3.5" /> Go to Dashboard →
            </Link>
          </div>
        </div>

        {/* Walkthrough 2 — Signals page */}
        <div className="rounded-2xl overflow-hidden border border-violet-500/20">
          <div className="px-5 py-3.5 bg-gradient-to-r from-violet-500/15 to-purple-600/10 border-b border-violet-500/15">
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Walkthrough 2</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Use the Signals page to find live opportunities</h3>
          </div>
          <div className="p-5 bg-white/2">
            <Step color="violet" steps={[
              { n: 1, text: <>Click <span className="text-white font-semibold">Signals</span> in the sidebar</> },
              { n: 2, text: <>Choose the <span className="text-white font-semibold">Spot</span> or <span className="text-white font-semibold">Futures</span> tab depending on your preference</> },
              { n: 3, text: <>Review the live signal cards — each shows pair, direction (LONG/SHORT), Entry, SL, TP and confidence score</> },
              { n: 4, text: <><span className="text-green-400 font-semibold">Premium users</span> see full entry/SL/TP values. Free tier sees signals below 60% confidence with prices blurred — upgrade on the Pricing page to unlock all signals</> },
              { n: 5, text: <>Tap <span className="text-white font-semibold">Trade This</span> on any signal card to immediately launch a bot pre-loaded with that trade</> },
              { n: 6, text: <>Use the <span className="text-white font-semibold">Analyze</span> tab to run an on-demand analysis on a specific pair</> },
              { n: 7, text: <>Use <span className="text-white font-semibold">History</span> to review past signals and see which ones hit their targets</> },
            ]} />
            <Link to="/signals" className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-violet-400 hover:underline">
              <Activity className="w-3.5 h-3.5" /> View Signals →
            </Link>
          </div>
        </div>

        {/* Walkthrough 3 — Create Bot */}
        <div className="rounded-2xl overflow-hidden border border-emerald-500/20">
          <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-500/15 to-green-600/10 border-b border-emerald-500/15">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Walkthrough 3</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Set up your first trading bot</h3>
          </div>
          <div className="p-5 bg-white/2">
            <Step color="emerald" steps={[
              { n: 1, text: <>Click <span className="text-white font-semibold">My Bots</span> in the sidebar, then <span className="text-white font-semibold">Create Bot</span></> },
              { n: 2, text: <><span className="text-blue-400 font-semibold">Recommended for beginners:</span> Choose <span className="text-white font-semibold">Demo Account</span> to practice with $10,000 virtual balance — no real money at risk</> },
              { n: 3, text: <>Select your exchange and market type (<span className="text-white font-semibold">Futures</span> is the default)</> },
              { n: 4, text: <>Click <span className="text-white font-semibold">Next</span> — the system immediately scans live markets and shows you the <span className="text-white font-semibold">top 3 signals</span> to choose from</> },
              { n: 5, text: <>Tap the signal you want to trade — review the pair, direction, confidence score, and Entry/SL/TP. A green glow confirms your selection</> },
              { n: 6, text: <>Set your <span className="text-white font-semibold">risk level</span>: <span className="text-green-400">Safe (1%)</span> for beginners, <span className="text-blue-400">Moderate (2%)</span> for experienced traders</> },
              { n: 7, text: <>Review the summary — confirm pair, entry price, capital allocation — then click <span className="text-white font-semibold">Launch &amp; Start Trading</span></> },
              { n: 8, text: <>The bot <span className="text-white font-semibold">immediately opens the position</span> you selected. Go to Bot Details to monitor it in real time</> },
            ]} />
            <Link to="/bots/create" className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400 hover:underline">
              <Bot className="w-3.5 h-3.5" /> Create a Bot →
            </Link>
          </div>
        </div>

        {/* Walkthrough 4 — Demo */}
        <div className="rounded-2xl overflow-hidden border border-blue-500/20">
          <div className="px-5 py-3.5 bg-gradient-to-r from-blue-500/15 to-indigo-600/10 border-b border-blue-500/15">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Walkthrough 4</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Practice safely with Demo Account</h3>
          </div>
          <div className="p-5 bg-white/2">
            <Step color="blue" steps={[
              { n: 1, text: <>Click <span className="text-white font-semibold">Account</span> in the sidebar to view your Demo Account dashboard</> },
              { n: 2, text: <>Your demo starts with <span className="text-white font-semibold">$10,000 virtual USDT</span> — resets on request. No real money involved</> },
              { n: 3, text: <>Create a bot with <span className="text-white font-semibold">Demo Account</span> selected — it uses live market prices from your chosen exchange to simulate real trades</> },
              { n: 4, text: <>Watch the bot open positions, track unrealized P&L in real time, and see trades close at SL or TP — exactly like live trading</> },
              { n: 5, text: <>Once your demo bot is profitable for <span className="text-white font-semibold">at least 1 week</span>, consider going live with a small real allocation</> },
            ]} />
            <Link to="/account" className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-blue-400 hover:underline">
              <FlaskConical className="w-3.5 h-3.5" /> View Demo Account →
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Understanding Signals */}
      <Section icon={Activity} color="bg-violet-500/15 text-violet-400" title="1 · Understanding Signals">
        <p>
          The AI engine scans top pairs every cycle across Spot and Futures markets.
          Each signal is backed by 6 indicators and multi-timeframe agreement — only signals scoring ≥ 65 get through.
        </p>
        <div className="space-y-2">
          <Row label="LONG">
            <span className="text-green-400 font-semibold">Buy opportunity</span> — price expected to rise. Works on Spot or Futures long.
          </Row>
          <Row label="SHORT">
            <span className="text-red-400 font-semibold">Sell opportunity</span> — price expected to fall. Futures only (short-selling).
          </Row>
          <Row label="Confidence">
            0–100%. <span className="text-white font-medium">Above 70% = strong signal.</span> Free tier sees signals below 60% with entry/SL/TP blurred.
          </Row>
          <Row label="Score">
            Internal ranking (0–100) built from 4 factors: MTF alignment (35%), momentum (25%), volume (15%), confidence (25%). Minimum to act: 65.
          </Row>
          <Row label="Timeframe">
            <span className="text-cyan-400">1h</span> is best for swing trades. <span className="text-cyan-400">15m</span> is faster but noisier — better for scalps only.
          </Row>
          <Row label="R:R">
            All signals guarantee a <span className="text-white font-medium">1:2 risk-to-reward ratio</span> — SL is ATR × 1.5, TP is ATR × 3.0.
          </Row>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Signals are high-probability setups, not guarantees. The system only acts on the single highest-scoring signal per cycle — it skips everything below the threshold.
        </div>
        <Link to="/signals" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <Activity className="w-3.5 h-3.5" /> View Live Signals →
        </Link>
      </Section>

      {/* 2. Reading Indicators */}
      <Section icon={BarChart2} color="bg-blue-500/15 text-blue-400" title="2 · Reading the Indicators">
        <p>
          Each analysis runs up to 6 indicators. The more that agree on direction, the higher the signal score.
          You can see exactly which indicators fired in the signal card breakdown.
        </p>
        <div className="space-y-3">
          {[
            {
              name: 'RSI — Relative Strength Index',
              bull: 'RSI < 38 = oversold → potential bounce (buy zone)',
              bear: 'RSI > 65 = overbought → potential drop (sell zone)',
              tip:  'RSI between 40–60 is neutral — the bot skips signals in this range.',
            },
            {
              name: 'EMA 20 / 50 — Short-term Trend',
              bull: 'EMA20 above EMA50 = uptrend momentum. Uptrend dips near EMA20 are also valid entries.',
              bear: 'EMA20 below EMA50 = downtrend momentum',
              tip:  'A fresh EMA20/50 crossover is a strong early entry signal.',
            },
            {
              name: 'EMA 200 — Long-term Trend Filter',
              bull: 'Price above EMA200 = overall bull market — only LONG signals pass',
              bear: 'Price below EMA200 = overall bear market — only SHORT signals pass',
              tip:  'Always trade in the direction of EMA200. Fighting it loses money long-term.',
            },
            {
              name: 'MACD — Momentum',
              bull: 'MACD line crossing above signal line = bullish momentum building',
              bear: 'MACD line crossing below signal line = bearish momentum building',
              tip:  "MACD confirms trend direction. The bot won't fire a LONG if MACD is bearish.",
            },
            {
              name: 'Bollinger Bands — Volatility',
              bull: 'Price near or below lower band = potential reversal up',
              bear: 'Price near or above upper band = potential reversal down',
              tip:  'BB squeeze (bands tightening) means a large move is imminent. Good time to watch closely.',
            },
            {
              name: 'Volume — Confirmation',
              bull: 'Volume spike on a LONG signal = real buying pressure behind the move',
              bear: 'Low volume on a signal = weak move, less reliable',
              tip:  'Always prefer signals with vol > 1.0× the 20-bar average. Volume is the engine behind price.',
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
          Every signal gives exact prices calculated using <span className="text-white font-medium">ATR (Average True Range)</span> — a measure of real market volatility, not guesswork.
          The same prices are pre-loaded into the bot when you select a signal during setup.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
            <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">Entry</p>
            <p className="text-xs text-white font-bold">Live market price</p>
            <p className="text-[10px] text-gray-600 mt-1">Bot fetches the live price at the moment it starts</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">Stop Loss</p>
            <p className="text-xs text-white font-bold">ATR × 1.5 away</p>
            <p className="text-[10px] text-gray-600 mt-1">Maximum loss point — the bot honors this automatically</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20">
            <Zap className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-[10px] text-gray-500 font-medium">Take Profit</p>
            <p className="text-xs text-white font-bold">ATR × 3.0 away</p>
            <p className="text-[10px] text-gray-600 mt-1">2:1 reward-to-risk — always locked in</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 text-xs text-green-300">
          <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
          The system enforces a <strong>2:1 Risk/Reward ratio</strong> on every signal. Win 1 out of 2 trades and you break even. Win 2 out of 3 and you're in profit.
        </div>
      </Section>

      {/* 4. Using Bots */}
      <Section icon={Bot} color="bg-emerald-500/15 text-emerald-400" title="4 · Setting Up a Trading Bot">
        <p>
          The SmartSignal bot is a <span className="text-white font-medium">signal-execution engine</span>. You pick the trade during setup — the bot opens it immediately when it starts and manages the full lifecycle (monitoring price, hitting SL or TP, closing the position, updating your stats).
        </p>

        {/* How it works */}
        <div className="p-3 rounded-xl bg-white/3 border border-white/6 space-y-2">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> What happens when you create a bot
          </p>
          <div className="space-y-1.5">
            {[
              ['Step 1 — Setup',     'Choose Demo or Live trading, select your exchange and market type (Spot / Futures)'],
              ['Step 2 — Pick a trade', 'The system scans live markets and shows you the top 3 scored signals. You tap the one you want.'],
              ['Step 3 — Configure', 'Set how much capital to allocate and choose your risk level (Safe / Moderate / Aggressive)'],
              ['Step 4 — Launch',    'Bot starts, opens the position you selected at the live price, with SL and TP pre-set'],
              ['Step 5 — Monitor',   'Track your open position on the Bot Details page. P&L updates in real time via live price feed'],
              ['Step 6 — Close',     'Bot auto-closes at Take Profit or Stop Loss. You can also close manually anytime from the position detail'],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-start gap-2 text-[11px]">
                <span className="text-emerald-400 font-bold flex-shrink-0 w-36">{label}</span>
                <span className="text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal scoring */}
        <div className="p-3 rounded-xl bg-white/3 border border-white/6">
          <p className="text-xs font-bold text-white mb-2">How signals are scored</p>
          <div className="space-y-1.5">
            {[
              ['35%', 'Multi-timeframe alignment', 'Do 5m, 15m, and 1h all agree on direction?'],
              ['25%', 'Confidence score',           'How strongly do the 6 indicators agree?'],
              ['25%', 'Momentum (RSI + MACD)',      'Is there real buying or selling pressure?'],
              ['15%', 'Volume',                     'Is the move backed by real trading activity?'],
            ].map(([weight, factor, desc]) => (
              <div key={factor} className="flex items-start gap-2 text-[11px]">
                <span className="text-cyan-400 font-bold w-8 flex-shrink-0">{weight}</span>
                <div>
                  <span className="text-white font-medium">{factor}</span>
                  <span className="text-gray-500"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Minimum passing score: 65 / 100. The bot skips everything below that threshold.</p>
        </div>

        {/* Risk presets */}
        <div className="space-y-1.5 text-xs">
          <p className="text-white font-semibold">Risk Presets — how position size is calculated:</p>
          <p><Pill label="Safe" color="bg-green-500/20 text-green-400" /> 1% of your capital at risk per trade · 2× leverage (futures)</p>
          <p><Pill label="Moderate" color="bg-blue-500/20 text-blue-400" /> 2% of your capital at risk per trade · 5× leverage (futures)</p>
          <p><Pill label="Aggressive" color="bg-orange-500/20 text-orange-400" /> 5% of your capital at risk per trade · 10× leverage (futures)</p>
          <p className="text-gray-500">The bot uses ATR stop-loss distance to calculate exactly how many units to buy so your dollar loss never exceeds the preset amount.</p>
        </div>

        {/* Safety systems */}
        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <p className="font-semibold text-amber-200">Built-in safety systems:</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> After 2 losing trades in a row → bot pauses for 1 hour automatically</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> Daily loss limit → bot stops for the day once losses hit your cap</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> Cooldown between trades → prevents overtrading after each close</p>
          <p><AlertTriangle className="w-3 h-3 inline mr-1" /> Max 5 consecutive errors → bot stops and alerts you if the exchange connection fails repeatedly</p>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300">
          <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
          Always run on <strong>Demo Account</strong> for at least a few days before going live. Demo mode uses live market prices with $10,000 virtual balance — identical to real trading, zero real money at risk.
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link to="/bots/create" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-medium">
            <Bot className="w-3.5 h-3.5" /> Create a Bot →
          </Link>
          <Link to="/account" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline font-medium">
            <FlaskConical className="w-3.5 h-3.5" /> Try Demo Mode →
          </Link>
        </div>
      </Section>

      {/* 5. Bot Details page */}
      <Section icon={Eye} color="bg-indigo-500/15 text-indigo-400" title="5 · Reading the Bot Details Page" defaultOpen={false}>
        <p>
          Once a bot is running, the <span className="text-white font-medium">Bot Details</span> page is your trading cockpit. Everything updates in real time.
        </p>
        <div className="space-y-2">
          <Row label="Stat cards">
            <span className="text-white">Allocated Capital</span> — what the bot can spend.{' '}
            <span className="text-white">Current Value</span> — current worth including open P&L.{' '}
            <span className="text-white">Total P&L</span> — realized gains + unrealized open position value.{' '}
            <span className="text-white">Win Rate</span> — closed trades won / total closed.
          </Row>
          <Row label="Strategy">
            Shows which scoring conditions are currently active (green = met, red = not met). Tells you what the bot sees right now. "Next analysis in" shows when the next scan fires.
          </Row>
          <Row label="Open Positions">
            Your live trade — pair, side (LONG/SHORT), entry price, current price, unrealized P&L, SL and TP. On mobile, tap a position to see the full detail and the Close button.
          </Row>
          <Row label="Close button">
            Lets you manually close a position before SL or TP is hit. Use this if market conditions change and you want to exit early.
          </Row>
          <Row label="Trade History">
            Every executed order — entry buys, SL/TP closes. Shows price, amount, fee, P&L, and the reason (entry / take_profit / stop_loss).
          </Row>
        </div>
        <div className="p-3 rounded-xl bg-white/3 border border-white/6 text-xs text-gray-400">
          <span className="text-white font-semibold">Unrealized P&L</span> is updated live from WebSocket price ticks. If P&L shows $0 immediately after launch, wait 5–10 seconds for the first tick to arrive.
        </div>
      </Section>

      {/* 6. Quick Pair Analysis */}
      <Section icon={Layers} color="bg-cyan-500/15 text-cyan-400" title="6 · Quick Pair Analysis" defaultOpen={false}>
        <p>
          Run an on-demand technical analysis on any pair directly from the <span className="text-white">Dashboard</span> or the <span className="text-white">Analyze tab</span> on the Signals page.
        </p>
        <div className="space-y-1.5 text-xs">
          <p><span className="text-white font-medium">When to use it:</span> Before picking a signal during bot setup. When a coin is trending and you want a quick read. To validate a trade idea before committing capital.</p>
          <p><span className="text-white font-medium">Timeframe guide:</span> Use <span className="text-cyan-400">1h</span> for swing trades (hours to days). Use <span className="text-cyan-400">15m</span> for short scalps only.</p>
          <p><span className="text-white font-medium">What to look for:</span> Score ≥ 65 with 4+ green indicators = high-confidence entry. Score below 65 = the system would skip this — you should too.</p>
          <p><span className="text-white font-medium">Trade This button:</span> If you like the result, click <span className="text-white font-semibold">Trade This</span> — it opens Create Bot with the signal pre-loaded so you skip the signal picker step.</p>
        </div>
      </Section>

      {/* 7. Risk Management */}
      <Section icon={Shield} color="bg-red-500/15 text-red-400" title="7 · Risk Management Rules" defaultOpen={false}>
        <p>
          Profitable traders don't win every trade — they manage losses better than everyone else. Follow these rules without exception.
        </p>
        <div className="space-y-2">
          {[
            {
              rule: 'Never risk more than 2% per trade',
              why:  'A 10-trade losing streak costs you 20% — survivable. Risking 10% per trade can wipe you in 3 losses. Use Safe or Moderate preset when starting out.',
            },
            {
              rule: 'Always honor the Stop Loss',
              why:  'Moving your SL wider hoping for recovery is how most accounts blow up. The stop loss is the contract you make with yourself before entering the trade.',
            },
            {
              rule: "Don't chase entries",
              why:  "If the bot opened at $0.97 and you're thinking about it at $1.05, the setup is already different. The bot uses live price at launch — don't try to add manually at a worse price.",
            },
            {
              rule: 'One trade per pair at a time',
              why:  'Opening multiple positions on the same coin multiplies your risk without proportional reward. The bot enforces this — one position per bot.',
            },
            {
              rule: 'Start with Demo, then small real capital',
              why:  'Demo mode is identical to live except money is virtual. Run at least 1 week of demo profitably before committing real funds — and start with only what you can afford to lose.',
            },
            {
              rule: 'Let the system work — avoid overriding it',
              why:  "The scoring system exists because emotion is the biggest trading killer. If the bot skips a signal it's because the score was below 65. Trust the gate.",
            },
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

      {/* 8. Arbitrage */}
      <Section icon={ArrowRightLeft} color="bg-emerald-500/15 text-emerald-400" title="8 · Arbitrage — Cross-Exchange & Triangular" defaultOpen={false}>
        <p>
          The arbitrage scanner runs continuously and surfaces two types of opportunity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-1.5">
            <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Cross-Exchange Arbitrage
            </p>
            <p className="text-[11px] text-gray-400">
              The same coin trades at different prices on different exchanges. Buy cheap on Exchange A, sell higher on Exchange B — pocket the difference.
            </p>
            <p className="text-[11px] text-gray-500 italic">
              Requires pre-funded accounts on multiple exchanges. Speed matters — windows close fast.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 space-y-1.5">
            <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Triangular Arbitrage
            </p>
            <p className="text-[11px] text-gray-400">
              Exploit price imbalances between 3 trading pairs on the same exchange (e.g. USDT → BTC → ETH → USDT). Profit stays on one exchange — no transfers needed.
            </p>
            <p className="text-[11px] text-gray-500 italic">
              Total fee is ~0.3% (3 trades × 0.1%). Only profitable when the spread exceeds 0.3%.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <p><span className="text-white font-semibold">Profit threshold:</span> Aim for ≥ 1% net after fees. Below that, transfer costs and slippage often eliminate the margin.</p>
          <p><span className="text-white font-semibold">Transfer status:</span> Check the badge — <Pill label="Verified" color="bg-green-500/20 text-green-400" /> coins move fast. <Pill label="Blocked" color="bg-red-500/20 text-red-400" /> means withdrawals are paused — skip it.</p>
          <p><span className="text-white font-semibold">Profit tiers:</span> <Pill label="Low" color="bg-gray-500/20 text-gray-400" /> under 1% · <Pill label="Medium" color="bg-yellow-500/20 text-yellow-400" /> 1–3% · <Pill label="High" color="bg-green-500/20 text-green-400" /> above 3%</p>
          <p><span className="text-white font-semibold">Free tier:</span> Sees opportunities below 1% profit. Premium unlocks all results.</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Arbitrage looks risk-free but isn't. Price can move against you during execution or transfer. Start with small amounts to test your workflow before scaling up.
        </div>
        <Link to="/arbitrage" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-medium">
          <ArrowRightLeft className="w-3.5 h-3.5" /> View Arbitrage Scanner →
        </Link>
      </Section>

      {/* 9. Account & Subscription */}
      <Section icon={Wallet} color="bg-yellow-500/15 text-yellow-400" title="9 · Account, Subscription & Exchange Keys" defaultOpen={false}>
        <div className="space-y-2 text-xs">
          <p><span className="text-white font-semibold">Free tier:</span> 2 signals/day (confidence below 60%, entry/SL/TP blurred), 5 arbitrage results (below 1% profit), demo bots.</p>
          <p><span className="text-white font-semibold">Premium ($20/month):</span> Full signals with all prices visible, unlimited arbitrage, full historical data, live bots on your real exchange.</p>
          <p><span className="text-white font-semibold">Payments:</span> Crypto only — Coinbase Commerce, NOWPayments, or CryptoPay. Activate from the <Link to="/pricing" className="text-cyan-400 hover:underline">Pricing</Link> page.</p>
          <p><span className="text-white font-semibold">Exchange API keys:</span> Go to <Link to="/settings" className="text-cyan-400 hover:underline">Settings → Exchange API</Link> to connect your exchange. The system uses <span className="text-white">read + trade permissions only</span> — it never touches your withdrawal permission.</p>
          <p><span className="text-white font-semibold">Referrals:</span> Share your referral link from the Profile page. You earn $5 credit when a referred user pays for premium.</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Never share your API secret key with anyone. SmartStrategy will never ask for it outside the Settings page. Use IP whitelisting on your exchange for extra security.
        </div>
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
