import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export const TOUR_KEY = 'ss_tour_done';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SmartStrategy 👋',
    body: "Let's show you how to run your first analysis and place a trade in 60 seconds. Hit Next to begin, or skip to explore on your own.",
    target: null,
    placement: null,
    route: null,
  },
  {
    id: 'quick-analysis',
    title: 'Quick Pair Analysis',
    body: 'Type any coin here — BTC, ETH, SOL — to get an instant AI analysis. Futures is the default since it gives the clearest signals.',
    target: '[data-tour="quick-analysis"]',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    id: 'analyze-btn',
    title: 'Click Analyze',
    body: 'Pick 1h timeframe for the most reliable results, then click Analyze. The AI scans 6 indicators and returns a scored signal in seconds.',
    target: '[data-tour="analyze-btn"]',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    id: 'signal-result',
    title: 'Execute the Trade',
    body: 'When a signal scores ≥ 65, the Execute Trade button appears. Click it to open the trade instantly — pick your risk level and confirm.',
    target: '[data-tour="signal-result"]',
    placement: 'top',
    route: '/dashboard',
  },
  {
    id: 'nav-signals',
    title: 'Live Signal Feed',
    body: 'Signals fire every 30 minutes across 30+ pairs. Each includes Entry, Stop Loss, and Take Profit — no guesswork needed.',
    target: '[data-tour="nav-signals"]',
    placement: 'right',
    route: null,
  },
  {
    id: 'nav-bots',
    title: 'Automate with Bots',
    body: 'Bots run 24/7 and trade the best-scored signal automatically. Start with Demo mode — $10,000 virtual balance, zero real money at risk.',
    target: '[data-tour="nav-bots"]',
    placement: 'right',
    route: null,
  },
];

const PAD = 12;
const TW = 288;

function getTooltipPosition(rect, placement, tooltipHeight) {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }

  let top, left;

  switch (placement) {
    case 'bottom':
      top = rect.bottom + PAD;
      left = rect.left + rect.width / 2 - TW / 2;
      break;
    case 'top':
      top = rect.top - tooltipHeight - PAD;
      left = rect.left + rect.width / 2 - TW / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + PAD;
      break;
    default:
      top = rect.bottom + PAD;
      left = rect.left + rect.width / 2 - TW / 2;
  }

  // Clamp
  left = Math.max(PAD, Math.min(left, window.innerWidth - TW - PAD));
  top = Math.max(PAD, Math.min(top, window.innerHeight - tooltipHeight - PAD));

  return { top, left, transform: 'none' };
}

export default function OnboardingTour({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipHeight, setTooltipHeight] = useState(160);
  const tooltipRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const step = STEPS[stepIndex];

  const measureTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  useEffect(() => {
    const go = async () => {
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        await new Promise(r => setTimeout(r, 400));
      } else {
        await new Promise(r => setTimeout(r, 100));
      }
      measureTarget();
    };
    go();
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  });

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      onDone();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  };

  const tooltipPos = getTooltipPosition(targetRect, step.placement, tooltipHeight);

  // Spotlight box: target bounds + 6px padding on each side
  const spotlightStyle = targetRect
    ? {
        position: 'fixed',
        top: targetRect.top - 6,
        left: targetRect.left - 6,
        width: targetRect.width + 12,
        height: targetRect.height + 12,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
        border: '2px solid rgba(6,182,212,0.5)',
        borderRadius: '12px',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        boxShadow: 'none',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9998,
        pointerEvents: 'none',
      };

  const isLast = stepIndex === STEPS.length - 1;

  return (
    <>
      {/* Spotlight / overlay */}
      <div style={spotlightStyle} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          width: TW,
          zIndex: 9999,
          ...(typeof tooltipPos.top === 'string'
            ? tooltipPos
            : { top: tooltipPos.top, left: tooltipPos.left, transform: tooltipPos.transform }),
        }}
        className="bg-brandDark-900 border border-brandDark-600 rounded-2xl p-4 shadow-2xl"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-4 bg-cyan-400'
                  : 'w-1.5 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* X close */}
        <button
          onClick={onDone}
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
          aria-label="Skip tour"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Content */}
        <h3 className="text-sm font-bold text-white mb-1.5 pr-6">{step.title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{step.body}</p>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white transition-colors"
          >
            {isLast ? 'Done' : 'Next'} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-3">
          <button
            onClick={onDone}
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
