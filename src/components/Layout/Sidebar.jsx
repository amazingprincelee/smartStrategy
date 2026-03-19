import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  Activity,
  BookOpen,
  TrendingUp,
  Flame,
  User,
  Settings,
  HelpCircle,
  X,
  Crown,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import SmartStrategyIcon from '../Logo/SmartStrategyIcon';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const bots = useSelector((state) => state.bots?.list || []);
  const demo = useSelector((state) => state.demo);
  const userRole = useSelector(state => state.auth?.user?.role ?? 'user');

  const activeBots = bots.filter(b => b.status === 'running').length;
  const totalPnL = bots.reduce((sum, b) => sum + (b.stats?.totalPnL || 0), 0);
  const demoBalance = demo?.virtualBalance ?? 10000;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'My Bots',
      href: '/bots',
      icon: Bot,
    },
    {
      name: 'Create Bot',
      href: '/bots/create',
      icon: PlusCircle,
    },
    {
      name: 'Signals',
      href: '/signals',
      icon: Activity,
      badge: 'Live',
    },
    {
      name: 'Arbitrage',
      href: '/arbitrage',
      icon: TrendingUp,
      badge: 'Live'
    },
    {
      name: 'Early Alpha',
      href: '/alpha',
      icon: Flame,
      badge: 'New',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      name: 'Pricing',
      href: '/pricing',
      icon: Crown,
    },
    ...(userRole === 'admin' ? [{
      name: 'Admin',
      href: '/admin',
      icon: ShieldCheck,
    }] : []),
    {
      name: 'How It Works',
      href: '/guide',
      icon: BookOpen,
      badge: 'Guide',
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifeBuoy,
    },
    {
      name: 'Help',
      href: '/help',
      icon: HelpCircle,
    },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* MOBILE: Dark overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] w-64
          bg-white dark:bg-brandDark-800
          border-r border-gray-200 dark:border-brandDark-700
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* MOBILE: Logo + Close button */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-brandDark-700 lg:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex-shrink-0">
              <SmartStrategyIcon size={32} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 border border-white dark:border-brandDark-800" />
              </span>
            </div>
            <span className="text-base font-bold tracking-tight leading-none">
              <span className="text-gray-900 dark:text-white">Smart</span>
              <span className="bg-gradient-to-r from-cyan-500 to-green-400 bg-clip-text text-transparent">Strategy</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brandDark-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Links — scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${active
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-brandDark-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brandDark-700 hover:text-brandDark-700 dark:hover:text-gray-200'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${item.badge === 'New' ? 'bg-orange-500' : item.badge === 'Guide' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section — never scrolls away */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-brandDark-700">
          {/* Quick Stats */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Quick Stats
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Bots</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{activeBots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total P&L</span>
              <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Demo Balance</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Version */}
          <div className="px-4 pb-4 text-xs text-center text-gray-500 dark:text-gray-400">
            v2.1.0 · SmartStrategy
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
