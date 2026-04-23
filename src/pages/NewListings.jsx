import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCEXListings, fetchDEXListings, fetchCoinDetail, fetchCoinNews,
  setMode, setDexNetwork, clearSelectedCoin,
} from '../redux/slices/newListingsSlice';
import {
  Sparkles, X, ExternalLink, Twitter, Globe, Github,
  MessageCircle, TrendingUp, TrendingDown, ChevronUp, ChevronDown,
  RefreshCw, Search, Newspaper, Users, BarChart2, Clock,
  Copy, Check, Filter,
} from 'lucide-react';

// ── Formatters ─────────────────────────────────────────────────────────────────

const fmt = n => {
  if (!n && n !== 0) return '—';
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Number(n).toPrecision(4)}`;
};

const fmtPct = n => {
  if (n === null || n === undefined) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
};

const pctColor = n =>
  !n ? 'text-gray-400' : n >= 0 ? 'text-emerald-400' : 'text-red-400';

const timeAgo = iso => {
  if (!iso) return '—';
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0)  return `${days}d ago`;
  if (hrs  > 0)  return `${hrs}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
};

// ── DEX networks list ──────────────────────────────────────────────────────────
const DEX_NETWORKS = [
  { id: 'all',         label: 'All Chains' },
  { id: 'eth',         label: 'Ethereum' },
  { id: 'bsc',         label: 'BNB Chain' },
  { id: 'solana',      label: 'Solana' },
  { id: 'base',        label: 'Base' },
  { id: 'arbitrum',    label: 'Arbitrum' },
  { id: 'polygon_pos', label: 'Polygon' },
  { id: 'avax',        label: 'Avalanche' },
];

// ── Small helpers ──────────────────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const cls = {
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    red:    'bg-red-500/15 text-red-400 border-red-500/30',
    cyan:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    gray:   'bg-gray-700/50 text-gray-400 border-gray-600/30',
  }[color] || 'bg-gray-700/50 text-gray-400 border-gray-600/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

function CoinIcon({ src, symbol, size = 8 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`w-${size} h-${size} rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0`}>
        {(symbol || '?').slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src} alt={symbol}
      className={`w-${size} h-${size} rounded-full flex-shrink-0`}
      onError={() => setErr(true)}
    />
  );
}

// ── CEX table row ──────────────────────────────────────────────────────────────

function CEXRow({ coin, index, onClick }) {
  const isNew    = coin.listedAt && Date.now() - new Date(coin.listedAt).getTime() < 24 * 3600000;
  const isHot    = coin.price_change_percentage_24h > 20;

  return (
    <tr
      onClick={onClick}
      className="group border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-sm text-gray-500 w-10">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CoinIcon src={coin.image} symbol={coin.symbol} size={8} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm">{coin.name}</span>
              {isNew && <Badge color="cyan">New</Badge>}
              {isHot && <Badge color="green">Hot</Badge>}
            </div>
            <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-white font-medium text-right">{fmt(coin.current_price)}</td>
      <td className={`px-4 py-3 text-sm font-medium text-right ${pctColor(coin.price_change_percentage_24h)}`}>
        <span className="flex items-center justify-end gap-1">
          {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {fmtPct(coin.price_change_percentage_24h)}
        </span>
      </td>
      <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-300 text-right">{fmt(coin.total_volume)}</td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-300 text-right">{fmt(coin.market_cap)}</td>
      <td className="hidden lg:table-cell px-4 py-3 text-xs text-gray-500 text-right">{timeAgo(coin.listedAt)}</td>
    </tr>
  );
}

// ── DEX pool card (mobile) / row (desktop) ─────────────────────────────────────

function DEXRow({ pool, index, onClick }) {
  const change = pool.change24h || 0;
  return (
    <tr
      onClick={onClick}
      className="group border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-sm text-gray-500 w-10">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">
              {pool.baseToken?.symbol}/{pool.quoteToken?.symbol}
            </span>
            <span className="text-xs text-gray-500">{pool.dex}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge color={pool.network?.toLowerCase().includes('eth') ? 'cyan' : 'gray'}>
          {pool.network}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-white text-right">{fmt(pool.priceUSD)}</td>
      <td className={`px-4 py-3 text-sm font-medium text-right ${pctColor(change)}`}>
        {fmtPct(change)}
      </td>
      <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-300 text-right">{fmt(pool.volume24h)}</td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-300 text-right">{fmt(pool.liquidityUSD)}</td>
      <td className="hidden lg:table-cell px-4 py-3 text-xs text-gray-500 text-right">{timeAgo(pool.createdAt)}</td>
    </tr>
  );
}

// ── Coin Detail Drawer ─────────────────────────────────────────────────────────

function SocialLink({ href, icon: Icon, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 hover:text-white transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </a>
  );
}

function CoinDrawer({ onClose }) {
  const dispatch   = useDispatch();
  const { selectedCoin: coin, coinNews, detailLoading, newsLoading } = useSelector(s => s.listings);
  const [newsTab, setNewsTab]  = useState(false);
  const [copied, setCopied]    = useState(false);

  const copyAddress = async (addr) => {
    await navigator.clipboard.writeText(addr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (detailLoading && !coin) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      </DrawerShell>
    );
  }

  if (!coin) return null;

  const change24h = coin.change24h;

  return (
    <DrawerShell onClose={onClose}>
      {/* Coin header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <CoinIcon src={coin.image} symbol={coin.symbol} size={12} />
          <div>
            <h2 className="text-xl font-bold text-white">{coin.name}</h2>
            <span className="text-sm text-gray-400 uppercase">{coin.symbol}</span>
          </div>
        </div>
        {coin.marketCapRank && (
          <Badge color="gray">Rank #{coin.marketCapRank}</Badge>
        )}
      </div>

      {/* Price */}
      <div className="bg-gray-800/60 rounded-xl p-4 mb-4">
        <p className="text-2xl font-bold text-white">{fmt(coin.price)}</p>
        <div className="flex gap-4 mt-1">
          <span className={`text-sm ${pctColor(change24h)}`}>24h {fmtPct(change24h)}</span>
          <span className={`text-sm ${pctColor(coin.change7d)}`}>7d {fmtPct(coin.change7d)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Market Cap',  value: fmt(coin.marketCap) },
          { label: 'Volume 24h',  value: fmt(coin.volume24h) },
          { label: 'All-Time High', value: fmt(coin.ath) },
          { label: 'All-Time Low',  value: fmt(coin.atl) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800/40 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Community */}
      {(coin.community?.twitterFollowers > 0 || coin.community?.redditSubscribers > 0) && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Community</h4>
          <div className="flex gap-3 flex-wrap">
            {coin.community.twitterFollowers > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                {coin.community.twitterFollowers.toLocaleString()} followers
              </div>
            )}
            {coin.community.redditSubscribers > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                {coin.community.redditSubscribers.toLocaleString()} members
              </div>
            )}
            {coin.community.telegramUsers > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                {coin.community.telegramUsers.toLocaleString()} users
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social links */}
      <div className="flex flex-wrap gap-2 mb-4">
        <SocialLink href={coin.links?.homepage}   icon={Globe}          label="Website" />
        <SocialLink href={coin.links?.twitter}    icon={Twitter}        label="Twitter" />
        <SocialLink href={coin.links?.telegram}   icon={MessageCircle}  label="Telegram" />
        <SocialLink href={coin.links?.github}     icon={Github}         label="GitHub" />
        <SocialLink href={coin.links?.explorer}   icon={ExternalLink}   label="Explorer" />
        <SocialLink href={coin.links?.whitepaper} icon={ExternalLink}   label="Whitepaper" />
      </div>

      {/* Description */}
      {coin.description && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">
            {coin.description.replace(/<[^>]+>/g, '')}
          </p>
        </div>
      )}

      {/* Warning */}
      {coin.publicNotice && (
        <div className="mb-4 bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-300">
          ⚠ {coin.publicNotice}
        </div>
      )}

      {/* News section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            Latest News
          </h4>
          {newsLoading && <RefreshCw className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
        </div>

        {coinNews.length === 0 && !newsLoading ? (
          <p className="text-xs text-gray-600">No news found for {coin.symbol.toUpperCase()}.</p>
        ) : (
          <div className="space-y-2">
            {coinNews.slice(0, 8).map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors group"
              >
                <p className="text-sm text-gray-300 group-hover:text-white leading-snug mb-1 line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{item.source}</span>
                  <div className="flex gap-3 text-xs">
                    {item.votes?.positive > 0 && (
                      <span className="text-emerald-500">↑ {item.votes.positive}</span>
                    )}
                    {item.votes?.negative > 0 && (
                      <span className="text-red-500">↓ {item.votes.negative}</span>
                    )}
                    <span className="text-gray-600">{timeAgo(item.publishedAt)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ children, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 bg-gray-900 border-l border-gray-800 overflow-y-auto shadow-2xl flex flex-col animate-slide-in-right">
        {/* Drawer top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <span className="text-sm font-semibold text-gray-300">Coin Details</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 flex-1">{children}</div>
      </div>
    </>
  );
}

// ── Sort helper ───────────────────────────────────────────────────────────────

function useSort(items, defaultCol, defaultDir = 'desc') {
  const [col, setCol]   = useState(defaultCol);
  const [dir, setDir]   = useState(defaultDir);

  const toggle = (c) => {
    if (col === c) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setCol(c); setDir('desc'); }
  };

  const sorted = [...items].sort((a, b) => {
    const av = a[col] ?? (typeof a[col] === 'number' ? 0 : '');
    const bv = b[col] ?? (typeof b[col] === 'number' ? 0 : '');
    return dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return { sorted, col, dir, toggle };
}

function SortTh({ label, colKey, current, dir, onSort, className = '' }) {
  const active = current === colKey;
  return (
    <th
      onClick={() => onSort(colKey)}
      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none ${className}`}
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <span className="w-3 h-3 opacity-30">↕</span>}
      </span>
    </th>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NewListings() {
  const dispatch   = useDispatch();
  const { mode, dexNetwork, cexCoins, dexPools, selectedCoin, loading, error } =
    useSelector(s => s.listings);

  const [search, setSearch] = useState('');

  // Initial load
  useEffect(() => {
    if (mode === 'cex') dispatch(fetchCEXListings());
    else                dispatch(fetchDEXListings(dexNetwork));
  }, [mode, dexNetwork, dispatch]);

  const handleSelectCEX = useCallback((coin) => {
    dispatch(fetchCoinDetail(coin.id));
    dispatch(fetchCoinNews(coin.symbol));
  }, [dispatch]);

  const handleSelectDEX = useCallback((pool) => {
    // For DEX pools, open GeckoTerminal page directly (no CoinGecko detail available)
    const addr = pool.address;
    const net  = pool.network?.toLowerCase().replace(' ', '-') || 'eth';
    window.open(`https://www.geckoterminal.com/${net}/pools/${addr}`, '_blank');
  }, []);

  const handleClose = useCallback(() => {
    dispatch(clearSelectedCoin());
  }, [dispatch]);

  // Filter coins by search
  const filteredCEX = cexCoins.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredDEX = dexPools.filter(p =>
    !search ||
    p.baseToken?.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const cexSort = useSort(filteredCEX, 'listedAt', 'desc');
  const dexSort = useSort(filteredDEX, 'createdAt', 'desc');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 py-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">New Listings</h1>
            </div>
            <p className="text-sm text-gray-400">
              Freshly listed coins and newly created DEX liquidity pools
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mode === 'cex') dispatch(fetchCEXListings());
                else                dispatch(fetchDEXListings(dexNetwork));
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* ── CEX / DEX toggle ── */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
            {['cex', 'dex'].map(m => (
              <button
                key={m}
                onClick={() => dispatch(setMode(m))}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {m === 'cex' ? 'CEX Listings' : 'DEX Pools'}
              </button>
            ))}
          </div>

          {/* DEX network selector */}
          {mode === 'dex' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
              {DEX_NETWORKS.map(n => (
                <button
                  key={n.id}
                  onClick={() => dispatch(setDexNetwork(n.id))}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    dexNetwork === n.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={mode === 'cex' ? 'Search coins…' : 'Search pools…'}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading && !cexCoins.length && !dexPools.length ? (
            <div className="p-12 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          ) : mode === 'cex' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800 bg-gray-900/80">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-left w-10">#</th>
                    <SortTh label="Coin"      colKey="name"                            current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="text-left" />
                    <SortTh label="Price"     colKey="current_price"                   current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="text-right" />
                    <SortTh label="24h %"     colKey="price_change_percentage_24h"     current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="text-right" />
                    <SortTh label="Volume"    colKey="total_volume" current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="hidden sm:table-cell text-right" />
                    <SortTh label="Mkt Cap"   colKey="market_cap"   current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="hidden md:table-cell text-right" />
                    <SortTh label="Listed" colKey="listedAt" current={cexSort.col} dir={cexSort.dir} onSort={cexSort.toggle} className="hidden lg:table-cell text-right" />
                  </tr>
                </thead>
                <tbody>
                  {cexSort.sorted.map((coin, i) => (
                    <CEXRow key={coin.id} coin={coin} index={i} onClick={() => handleSelectCEX(coin)} />
                  ))}
                  {cexSort.sorted.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No listings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800 bg-gray-900/80">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-left w-10">#</th>
                    <SortTh label="Pool"      colKey="name"        current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="text-left" />
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-left">Chain</th>
                    <SortTh label="Price"     colKey="priceUSD"    current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="text-right" />
                    <SortTh label="24h %"     colKey="change24h"   current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="text-right" />
                    <SortTh label="Volume"    colKey="volume24h"   current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="hidden sm:table-cell text-right" />
                    <SortTh label="Liquidity" colKey="liquidityUSD" current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="hidden md:table-cell text-right" />
                    <SortTh label="Created" colKey="createdAt" current={dexSort.col} dir={dexSort.dir} onSort={dexSort.toggle} className="hidden lg:table-cell text-right" />
                  </tr>
                </thead>
                <tbody>
                  {dexSort.sorted.map((pool, i) => (
                    <DEXRow key={pool.id} pool={pool} index={i} onClick={() => handleSelectDEX(pool)} />
                  ))}
                  {dexSort.sorted.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">No pools found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer note ── */}
        <p className="text-xs text-gray-700 text-center mt-4">
          Data via CoinGecko & GeckoTerminal · News via CryptoPanic · Not financial advice
        </p>
      </div>

      {/* ── Coin detail drawer (CEX only) ── */}
      {selectedCoin && <CoinDrawer onClose={handleClose} />}
    </div>
  );
}
