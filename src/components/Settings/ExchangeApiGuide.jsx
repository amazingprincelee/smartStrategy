import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle } from 'lucide-react';

const EXCHANGES = [
  {
    id: 'gateio',
    name: 'Gate.io',
    logo: '🔵',
    apiPageUrl: 'https://www.gate.io/myaccount/api_keys',
    steps: [
      'Log in to Gate.io and go to your Profile (top right)',
      'Click "API Management" or go to Account → API Keys',
      'Click "Create API Key"',
      'Give it a name e.g. "SmartStrategy Bot"',
      'Under Permissions, tick ONLY "Spot Trade" and/or "Perpetual Contract" (futures)',
      'Leave "Withdrawal" UNCHECKED — never enable this',
      'Set an IP whitelist if possible (your server IP)',
      'Click "Confirm" and complete 2FA verification',
      'Copy your API Key and Secret — the secret is shown only once',
    ],
    permissions: ['Spot Trade', 'Perpetual Contract (for futures bots)'],
    danger: 'Never enable Withdrawal permission',
    color: 'blue',
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    logo: '🟢',
    apiPageUrl: 'https://www.kucoin.com/account/api',
    steps: [
      'Log in to KuCoin and click your avatar (top right) → API Management',
      'Click "Create API"',
      'Enter API name e.g. "SmartStrategy" and your trading password',
      'Select "API Restrictions": tick "Trade" only',
      'Do NOT tick "Transfer" or "Withdrawal"',
      'Set IP restriction if possible',
      'Complete the verification (email + 2FA)',
      'You will get API Key, API Secret, and Passphrase — save all three',
    ],
    permissions: ['Trade'],
    extraField: 'KuCoin also requires a Passphrase — save it along with key and secret',
    danger: 'Never enable Transfer or Withdrawal',
    color: 'green',
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '⚫',
    apiPageUrl: 'https://www.okx.com/account/my-api',
    steps: [
      'Log in to OKX → Profile (top right) → API',
      'Click "Create V5 API Key"',
      'Choose "Trading" as the purpose',
      'Name it e.g. "SmartStrategy Bot"',
      'Under Permissions tick "Trade" only',
      'Do NOT tick "Withdraw" or "Transfer"',
      'Add your passphrase (you create this yourself — remember it)',
      'Set IP whitelist if possible',
      'Complete 2FA and save your Key, Secret and Passphrase',
    ],
    permissions: ['Trade'],
    extraField: 'OKX also requires a Passphrase — you create this yourself during setup',
    danger: 'Never enable Withdraw permission',
    color: 'gray',
  },
  {
    id: 'mexc',
    name: 'MEXC',
    logo: '🟡',
    apiPageUrl: 'https://www.mexc.com/user/openapi',
    steps: [
      'Log in to MEXC → Avatar (top right) → API Management',
      'Click "Create API Key"',
      'Give it a note e.g. "SmartStrategy"',
      'Under permissions, enable "Enable Spot Trading" and/or "Enable Futures Trading"',
      'Leave "Enable Withdrawals" OFF',
      'Complete email/SMS/2FA verification',
      'Copy and save your Access Key and Secret Key',
    ],
    permissions: ['Spot Trading', 'Futures Trading (for futures bots)'],
    danger: 'Never enable Withdrawals',
    color: 'yellow',
  },
  {
    id: 'huobi',
    name: 'HTX (Huobi)',
    logo: '🔴',
    apiPageUrl: 'https://www.htx.com/en-us/user/api_management/',
    steps: [
      'Log in to HTX → Avatar → API Management',
      'Click "Create API Key"',
      'Select "Trade" permission only',
      'Do NOT select "Withdraw"',
      'Bind an IP address if possible',
      'Complete 2FA',
      'Save your Access Key and Secret Key',
    ],
    permissions: ['Trade'],
    danger: 'Never enable Withdraw permission',
    color: 'red',
  },
  {
    id: 'binance',
    name: 'Binance',
    logo: '🟠',
    apiPageUrl: 'https://www.binance.com/en/my/settings/api-management',
    steps: [
      'Log in to Binance → Profile → API Management',
      'Click "Create API" → choose "System generated"',
      'Label it e.g. "SmartStrategy Bot"',
      'Complete 2FA',
      'Under "API Restrictions", enable "Enable Spot & Margin Trading"',
      'For futures: also enable "Enable Futures"',
      'Leave "Enable Withdrawals" UNCHECKED',
      'Restrict access by IP if possible',
      'Save your API Key and Secret Key',
    ],
    permissions: ['Spot & Margin Trading', 'Futures (for futures bots)'],
    danger: 'Never enable Withdrawals. Note: Binance may be geo-blocked in some countries',
    color: 'orange',
    warning: 'Binance may be geo-restricted in your region. If connection fails, use Gate.io or KuCoin instead.',
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: '🟣',
    apiPageUrl: 'https://www.bybit.com/app/user/api-management',
    steps: [
      'Log in to Bybit → Avatar → API Management',
      'Click "Create New Key"',
      'Select "API Transaction" as the key type',
      'Under permissions, tick "Contract - Trade" and/or "Spot - Trade"',
      'Leave "Asset Transfer" and "Withdrawal" UNCHECKED',
      'Bind your IP address if possible',
      'Complete 2FA and save your API Key and Secret',
    ],
    permissions: ['Contract - Trade', 'Spot - Trade'],
    danger: 'Never enable Asset Transfer or Withdrawal',
    warning: 'Bybit may be geo-restricted in some countries.',
    color: 'purple',
  },
];

const COLOR_MAP = {
  blue:   { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   dot: 'bg-blue-400',   ring: 'ring-blue-500/30' },
  green:  { badge: 'bg-green-500/20 text-green-300 border-green-500/30', dot: 'bg-green-400',  ring: 'ring-green-500/30' },
  gray:   { badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30',   dot: 'bg-gray-400',   ring: 'ring-gray-500/30' },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-400', ring: 'ring-yellow-500/30' },
  red:    { badge: 'bg-red-500/20 text-red-300 border-red-500/30',       dot: 'bg-red-400',    ring: 'ring-red-500/30' },
  orange: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', dot: 'bg-orange-400', ring: 'ring-orange-500/30' },
  purple: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400', ring: 'ring-purple-500/30' },
};

export default function ExchangeApiGuide({ onClose }) {
  const [selected, setSelected] = useState(EXCHANGES[0].id);
  const [expanded, setExpanded] = useState(null);

  const ex = EXCHANGES.find(e => e.id === selected);
  const c  = COLOR_MAP[ex.color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-base font-bold text-white">How to Get Your API Keys</p>
            <p className="text-xs text-gray-500 mt-0.5">Step-by-step guide for each exchange</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security warning banner */}
        <div className="mx-6 mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">
            <span className="font-bold">Security first:</span> Always use <span className="font-semibold">Trade-only</span> permissions.
            <span className="font-bold text-red-200"> Never enable Withdrawal</span> — SmartStrategy only needs permission to place trades on your behalf.
          </p>
        </div>

        {/* Exchange selector */}
        <div className="px-6 pt-4">
          <p className="text-xs text-gray-500 mb-2">Select your exchange</p>
          <div className="flex flex-wrap gap-2">
            {EXCHANGES.map(e => {
              const ec = COLOR_MAP[e.color];
              return (
                <button
                  key={e.id}
                  onClick={() => setSelected(e.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    selected === e.id
                      ? `${ec.badge} ring-1 ${ec.ring}`
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span>{e.logo}</span> {e.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Guide content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Exchange header */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${c.badge}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ex.logo}</span>
              <div>
                <p className="font-bold text-white">{ex.name}</p>
                <p className="text-xs opacity-70">API Management</p>
              </div>
            </div>
            <a
              href={ex.apiPageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Open API Page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Geo warning if any */}
          {ex.warning && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">{ex.warning}</p>
            </div>
          )}

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Step-by-step instructions</p>
            <ol className="space-y-2.5">
              {ex.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.dot} bg-opacity-80`}
                    style={{ backgroundColor: undefined }}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                      style={{ background: `var(--dot-${ex.color}, #4b5563)` }}
                    >
                      {i + 1}
                    </span>
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Required permissions */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <p className="text-xs font-semibold text-green-400">Required permissions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ex.permissions.map(p => (
                <span key={p} className="text-xs bg-green-500/15 text-green-300 border border-green-500/20 px-2.5 py-1 rounded-lg font-medium">
                  ✓ {p}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs text-red-400 font-medium">{ex.danger}</p>
            </div>
            {ex.extraField && (
              <p className="text-xs text-yellow-300 bg-yellow-500/10 rounded-lg px-3 py-2">
                ⚠️ {ex.extraField}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-gray-500">After saving your keys, go back and enter them above</p>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
