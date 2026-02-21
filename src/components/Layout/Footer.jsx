import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Github,
  Twitter,
  MessageCircle,
  Mail,
  TrendingUp,
  Bot,
  FlaskConical,
  BookOpen,
  Shield,
  ChevronUp,
  ExternalLink,
  Activity,
  Zap,
} from 'lucide-react';

const Footer = () => {
  const currentYear   = new Date().getFullYear();
  const { token }     = useSelector(state => state.auth);
  const isAuthenticated = !!token;
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const features = [
    { to: '/bots',       icon: Bot,         color: 'text-cyan-400',   label: 'Trading Bots'      },
    { to: '/demo',       icon: FlaskConical, color: 'text-purple-400', label: 'Demo Account'      },
    { to: '/strategies', icon: BookOpen,     color: 'text-amber-400',  label: 'Strategy Library'  },
    { to: '/arbitrage',  icon: TrendingUp,   color: 'text-green-400',  label: 'Arbitrage Scanner', badge: 'Live' },
  ];

  const resources = [
    { href: '/docs',  label: 'Documentation', external: true  },
    { href: '/api',   label: 'API Reference',  external: true  },
    { href: '/blog',  label: 'Blog',           external: false },
    { href: '/help',  label: 'Help Center',    external: false },
  ];

  const legal = [
    { href: '/terms',      label: 'Terms of Service' },
    { href: '/privacy',    label: 'Privacy Policy'   },
    { href: '/cookies',    label: 'Cookie Policy'    },
    { href: '/disclaimer', label: 'Risk Disclaimer'  },
  ];

  const stats = [
    { value: '500+',  label: 'Bots Created',       icon: Bot,      gradient: 'from-cyan-500 to-blue-600'   },
    { value: '6',     label: 'Strategies',          icon: BookOpen, gradient: 'from-purple-500 to-violet-600'},
    { value: '150+',  label: 'Daily Signals',       icon: Activity, gradient: 'from-green-500 to-emerald-600'},
    { value: '10+',   label: 'Exchanges Supported', icon: Zap,      gradient: 'from-amber-500 to-orange-600' },
  ];

  const socials = [
    { href: 'https://twitter.com/smartstrategyapp',  Icon: Twitter,        label: 'Twitter', color: 'hover:bg-sky-500/20 hover:text-sky-400' },
    { href: 'https://github.com/smartstrategyapp',   Icon: Github,         label: 'GitHub',  color: 'hover:bg-gray-500/20 hover:text-gray-300' },
    { href: 'https://discord.gg/smartstrategy',      Icon: MessageCircle,  label: 'Discord', color: 'hover:bg-indigo-500/20 hover:text-indigo-400' },
    { href: 'mailto:support@smartstrategy.app',      Icon: Mail,           label: 'Email',   color: 'hover:bg-cyan-500/20 hover:text-cyan-400' },
  ];

  return (
    <footer className="relative mt-auto bg-brandDark-900 dark:bg-brandDark-900">
      {/* Gradient top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

      <div className={`transition-all duration-300 ${isAuthenticated ? 'lg:ml-64' : ''}`}>

        {/* ── STATS BAND ──────────────────────────────────────────────── */}
        <div className="border-b border-white/5">
          <div className="container px-4 py-8 mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/4 border border-white/6 backdrop-blur-sm">
                    <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${s.gradient} shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-white leading-none">{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN FOOTER GRID ────────────────────────────────────────── */}
        <div className="container px-4 py-12 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

            {/* Brand col (spans 2) */}
            <div className="sm:col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400/30">
                    <Bot className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 border-[1.5px] border-brandDark-900" />
                  </span>
                </div>
                <span className="text-xl font-bold tracking-tight leading-none">
                  <span className="text-white">Smart</span>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Strategy</span>
                </span>
              </div>

              <p className="text-sm leading-relaxed text-gray-400 max-w-xs mb-5">
                Automate your crypto trading with intelligent bots. 6 proven strategies, live signals,
                and a risk-free demo — all in one platform.
              </p>

              {/* Tagline pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-xs text-cyan-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-flex" />
                Live signals · 24/7 automation · Free demo
              </div>

              {/* Socials */}
              <div className="flex gap-2">
                {socials.map(({ href, Icon, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`p-2.5 rounded-lg border border-white/8 text-gray-400 transition-colors duration-200 ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Features col */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-500 uppercase">Features</h3>
              <ul className="space-y-3">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.label}>
                      <Link
                        to={f.to}
                        className="group flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${f.color}`} />
                        <span>{f.label}</span>
                        {f.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-green-500/20 text-green-400">{f.badge}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Resources col */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-500 uppercase">Resources</h3>
              <ul className="space-y-3">
                {resources.map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {r.label}
                      {r.external && <ExternalLink className="w-3 h-3 text-gray-600" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal col */}
            <div>
              <h3 className="mb-5 text-xs font-bold tracking-widest text-gray-500 uppercase">Legal</h3>
              <ul className="space-y-3">
                {legal.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────── */}
        <div className="border-t border-white/6">
          <div className="container px-4 py-6 mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 text-center sm:text-left">
                © {currentYear} SmartStrategy. All rights reserved. Built for traders, by traders.
              </p>

              {/* Security badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/4 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                API keys encrypted · No withdrawal permissions required
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-5 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-xs leading-relaxed text-gray-500">
              <span className="font-semibold text-amber-400/80">⚠ Risk Disclaimer: </span>
              Cryptocurrency trading carries significant risk of loss. Automated bots do not guarantee profit —
              past strategy performance does not predict future results. Only trade with capital you can afford to lose.
              Always DYOR and use the demo account to validate strategies before going live.
            </div>
          </div>
        </div>

      </div>

      {/* Scroll-to-top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:scale-110 transition-all duration-200 ring-2 ring-cyan-400/30"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
