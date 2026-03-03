import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  RefreshCw,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  BarChart3,
  Info,
  Clock,
  AlertTriangle,

  Activity,
  History,
  Bell,
  Crown,
  Lock,
  Zap,
  Globe,
  ExternalLink,
} from 'lucide-react';
import {
  fetchArbitrageOpportunities,
  fetchArbitrageStatus,
  clearArbitrageMessages
} from '../../redux/slices/arbitrageslice';
import { authAPI } from '../../services/api';

const isPremiumUser = (role) => role === 'premium' || role === 'admin';

const CryptoArbitrage = () => {
  const dispatch = useDispatch();

  // Get data from Redux store
  const {
    opportunities = [],
    loading = {},
    error,
    successMessage,
    metadata = {},
    stats = {},
    status = {}
  } = useSelector((state) => state.arbitrage || {});

  const role      = useSelector(state => state.auth?.user?.role ?? state.auth?.role ?? 'user');
  const isPremium = isPremiumUser(role);

  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'profitPercent',
    showOnlyProfitable: false,
    maxRisk: 'High'
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const PAST_LIMIT = 10; // rows per page

  // Past opportunities (stored, ≥0.20% profit)
  const [pastOpps, setPastOpps] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastFilter, setPastFilter] = useState('all'); // all | active | cleared
  const [pastMeta, setPastMeta] = useState({ activeCount: 0, clearedCount: 0, total: 0 });
  const [pastPage, setPastPage] = useState(1);
  const [pastPagination, setPastPagination] = useState({ page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });

  // Summary stats for stat cards (aggregated DB history)
  const [historySummary, setHistorySummary] = useState({
    total: null, activeCount: null, clearedCount: null, bestNetProfit: null, avgNetProfit: null
  });

  const fetchHistorySummary = useCallback(async () => {
    try {
      const res = await authAPI.get('/arbitrage/past-opportunities/summary');
      if (res.data.success) setHistorySummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load summary:', err.message);
    }
  }, []);

  const fetchPastOpportunities = useCallback(async (statusFilter = 'all', page = 1) => {
    setPastLoading(true);
    try {
      const res = await authAPI.get(
        `/arbitrage/past-opportunities?status=${statusFilter}&limit=${PAST_LIMIT}&page=${page}`
      );
      if (res.data.success) {
        setPastOpps(res.data.data || []);
        setPastMeta(res.data.meta || {});
        setPastPagination(res.data.pagination || { page: 1, pages: 1, total: 0, hasNext: false, hasPrev: false });
      }
    } catch (err) {
      console.error('Failed to load past opportunities:', err.message);
    } finally {
      setPastLoading(false);
    }
  }, []);

  // Load past opportunities on mount and auto-refresh every 60 seconds
  useEffect(() => {
    fetchPastOpportunities(pastFilter, pastPage);
    const id = setInterval(() => fetchPastOpportunities(pastFilter, pastPage), 60_000);
    return () => clearInterval(id);
  }, [fetchPastOpportunities, pastFilter, pastPage]);

  // Load summary stats on mount and refresh every 60 seconds
  useEffect(() => {
    fetchHistorySummary();
    const id = setInterval(fetchHistorySummary, 60_000);
    return () => clearInterval(id);
  }, [fetchHistorySummary]);

  // Check status on mount and set up status polling
  useEffect(() => {
    dispatch(fetchArbitrageStatus());
    const statusInterval = setInterval(() => {
      dispatch(fetchArbitrageStatus());
    }, 10000);
    return () => clearInterval(statusInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load opportunities as soon as the scanner reports it has data
  useEffect(() => {
    if (status.isReady) {
      dispatch(fetchArbitrageOpportunities());
    }
  }, [status.isReady, dispatch]);

  // Re-fetch when the scanner discovers live opportunities after returning stale data
  useEffect(() => {
    if (metadata.isStale && status.opportunitiesCount > 0) {
      dispatch(fetchArbitrageOpportunities());
    }
  }, [metadata.isStale, status.opportunitiesCount, dispatch]);

  // Handle success messages
  useEffect(() => {
    if (successMessage) {
      setSuccessMsg(successMessage);
      dispatch(clearArbitrageMessages());
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  }, [successMessage, dispatch]);

  // Filter and sort opportunities (compatible with new Order Book-based system)
  const filteredOpportunities = (opportunities || [])
    .filter(opp => {
      // Get coin from symbol (e.g., "BTC/USDT" -> "BTC")
      const coin = opp.coin || opp.symbol?.split('/')[0] || '';
      const matchesSearch = coin.toLowerCase().includes(filters.search.toLowerCase()) ||
                          opp.symbol?.toLowerCase().includes(filters.search.toLowerCase());
      if (!matchesSearch) return false;

      // Check profitability (new system uses netProfitPercent > 0)
      const isProfitable = opp.isProfitableAfterFees ?? (opp.netProfitPercent > 0);
      if (filters.showOnlyProfitable && !isProfitable) return false;

      const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3 };
      const maxRiskLevel = riskLevels[filters.maxRisk];
      const oppRiskLevel = riskLevels[opp.riskLevel] || 2;
      if (oppRiskLevel > maxRiskLevel) return false;

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'profitPercent') return (b.netProfitPercent || b.profitPercent || 0) - (a.netProfitPercent || a.profitPercent || 0);
      if (filters.sortBy === 'netProfitPercent') return (b.netProfitPercent || 0) - (a.netProfitPercent || 0);
      if (filters.sortBy === 'volume') return (b.optimalTradeValueUSD || b.tradeableVolume || 0) - (a.optimalTradeValueUSD || a.tradeableVolume || 0);
      return 0;
    });

  const getRiskBadgeColor = (risk) => {
    if (risk === 'Low') return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (risk === 'Medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  };

  const getProfitTier = (netProfitPercent) => {
    const pct = netProfitPercent || 0;
    if (pct >= 1)   return { label: 'High',      cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' };
    if (pct >= 0.3) return { label: 'Medium',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' };
    if (pct >= 0)   return { label: 'Low',       cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    return              { label: 'Near Miss', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
  };

  const getTransferBadge = (status) => {
    if (status === 'Verified') return { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: CheckCircle };
    if (status === 'Blocked') return { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle };
    return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300', icon: Info };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              Crypto Arbitrage Scanner
            </h1>
            {status.isLoading ? (
              <div className="relative flex items-center">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            ) : status.isReady ? (
              <div className="relative flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-75 animate-ping"></div>
              </div>
            ) : null}
            {!isPremium && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Crown className="w-3.5 h-3.5" />
                Free Tier
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Real-time price gaps across 8 exchanges — continues scanning for opportunities
          </p>
          {metadata.lastUpdate && (
            <div className="flex items-center gap-4 mt-2">
              <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                Last updated: {metadata.dataAgeFormatted || 'Just now'}
              </p>
              {metadata.nextUpdate && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Next update: {new Date(metadata.nextUpdate).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Free-tier upgrade banner */}
      {!isPremium && (
        <div className="p-4 border rounded-xl border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 mb-1 font-semibold text-gray-900 dark:text-white">
                <Crown className="w-4 h-4 text-amber-500" />
                Unlock the full arbitrage edge
              </p>
              <div className="grid grid-cols-1 mt-2 sm:grid-cols-2 gap-x-6 gap-y-1">
                {[
                  'Exact profit % on every opportunity',
                  'Gross spread & expected USD gain',
                  'Instant email alerts for ≥0.20% gaps',
                  'Priority access before gaps close',
                ].map(f => (
                  <p key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <Zap className="flex-shrink-0 w-3 h-3 text-amber-500" />
                    {f}
                  </p>
                ))}
              </div>
            </div>
            <button className="flex items-center flex-shrink-0 gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-amber-500 hover:bg-amber-600 whitespace-nowrap">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">{successMsg}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 border-l-4 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
          <XCircle className="flex-shrink-0 w-5 h-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800 dark:text-red-200">We are working hard</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">to get you an opportunity</p>
          </div>
        </div>
      )}

      {/* Stats Cards — sourced from DB history, loads instantly */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Card 1 — Total Recorded */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recorded</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {historySummary.total !== null ? historySummary.total : '—'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                opportunities ever saved (≥0.20%)
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        {/* Card 2 — Active vs Cleared */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active / Cleared</p>
              {historySummary.activeCount !== null ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    <span className="text-emerald-600">{historySummary.activeCount}</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-gray-500">{historySummary.clearedCount}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">still open · closed</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-gray-400">—</p>
                  <p className="mt-1 text-xs text-gray-500">loading…</p>
                </>
              )}
            </div>
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        {/* Card 3 — Best Profit Ever */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best Profit Ever</p>
              {historySummary.bestNetProfit !== null ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {historySummary.bestNetProfit.toFixed(3)}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">net after fees</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-gray-400">—</p>
                  <p className="mt-1 text-xs text-gray-500">no history yet</p>
                </>
              )}
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Card 4 — Avg Net Profit */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Net Profit</p>
              {historySummary.avgNetProfit !== null ? (
                <>
                  <p className={`mt-1 text-2xl font-bold ${
                    historySummary.avgNetProfit >= 0.5 ? 'text-green-600'
                    : historySummary.avgNetProfit >= 0.2 ? 'text-yellow-600'
                    : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {historySummary.avgNetProfit.toFixed(3)}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">across all saved opportunities</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-gray-400">—</p>
                  <p className="mt-1 text-xs text-gray-500">no history yet</p>
                </>
              )}
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

      </div>

      {/* ── Scanning Exchanges ── */}
      <div className="py-4 card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Live — Scanning 8 Exchanges
              </span>
            </div>
            <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
              · 
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Open accounts on all to execute manually
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { name: 'OKX',      fee: '0.10%', url: 'https://www.okx.com',    tier: 'low' },
            { name: 'KuCoin',   fee: '0.10%', url: 'https://www.kucoin.com', tier: 'low' },
            { name: 'Bitget',   fee: '0.10%', url: 'https://www.bitget.com', tier: 'low' },
            { name: 'Phemex',   fee: '0.10%', url: 'https://phemex.com',     tier: 'low' },
            { name: 'Poloniex', fee: '0.155%',url: 'https://poloniex.com',   tier: 'mid' },
            { name: 'Gate.io',  fee: '0.20%', url: 'https://www.gate.io',    tier: 'std' },
            { name: 'MEXC',     fee: '0.20%', url: 'https://www.mexc.com',   tier: 'std' },
            { name: 'HTX',      fee: '0.20%', url: 'https://www.htx.com',    tier: 'std' },
          ].map(ex => (
            <a
              key={ex.name}
              href={ex.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-brandDark-600 bg-white dark:bg-brandDark-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {ex.name}
              </span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                ex.tier === 'low'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : ex.tier === 'mid'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
              }`}>
                {ex.fee}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-300 transition-colors dark:text-gray-600 group-hover:text-primary-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Filters - Always show */}
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by coin or symbol..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 input"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="input"
            >
              <option value="profitPercent">Sort by Profit %</option>
              <option value="netProfitPercent">Sort by Net Profit %</option>
              <option value="volume">Sort by Volume</option>
            </select>

            <select
              value={filters.maxRisk}
              onChange={(e) => setFilters({ ...filters, maxRisk: e.target.value })}
              className="input"
            >
              <option value="High">All Risks</option>
              <option value="Medium">Low-Medium Only</option>
              <option value="Low">Low Risk Only</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer dark:border-gray-600">
              <input
                type="checkbox"
                checked={filters.showOnlyProfitable}
                onChange={(e) => setFilters({ ...filters, showOnlyProfitable: e.target.checked })}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Profitable Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Live Scanner ─────────────────────────────────────────────── */}
      <div className="order-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status.isLoading ? 'bg-amber-400 animate-pulse' :
              status.isReady   ? 'bg-green-500 animate-pulse' :
                                 'bg-gray-400'
            }`} />
            <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
              Live Scanner
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {status.isLoading && !status.isReady
                ? '· scanning…'
                : filteredOpportunities.length > 0
                  ? `· ${filteredOpportunities.length} spread${filteredOpportunities.length !== 1 ? 's' : ''} detected`
                  : status.isReady ? '· scan complete' : ''}
            </span>
          </div>
          {metadata.lastUpdate && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Updated {metadata.dataAgeFormatted || 'just now'} · refreshes every 5 min
            </p>
          )}
        </div>
      <div className="card">
        {/* Loading / Scanning State */}
        {loading.opportunities || (status.isLoading && !status.isReady) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="w-10 h-10 mb-4 animate-spin text-primary-500" />
            <p className="text-gray-600 dark:text-gray-400">
              {status.isLoading && !status.isReady
                ? 'Hunting for price gaps across exchanges…'
                : 'Loading opportunities…'}
            </p>
            {status.isLoading && !status.isReady && (
              <p className="mt-1 text-xs text-gray-400">Good things take a moment — checking live prices across all exchanges.</p>
            )}
          </div>
        ) : /* Waiting for first status response */
        !status.isReady && !status.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-10 h-10 mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Connecting to scanner…</p>
          </div>
        ) : /* No opportunities after loading */
        filteredOpportunities.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No Opportunities Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {opportunities.length === 0
                ? 'The scanner is running every 5 minutes across 8 exchanges. Real-time spread data will appear here shortly.'
                : 'All currently detected spreads are shown — try removing filters or disabling "profitable only" to see near-miss opportunities.'}
            </p>
          </div>
        ) : /* Data Table */ (
            <div>
              {metadata.isStale && (
                <div className="flex items-center gap-2 px-4 py-2.5 mb-0 text-sm text-amber-700 bg-amber-50 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                  <Clock className="flex-shrink-0 w-4 h-4" />
                  <span>No live opportunities right now — showing last known data. The scanner updates every 5 minutes.</span>
                </div>
              )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-brandDark-800">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Buy Exchange
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Sell Exchange
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                      Prices
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                      Profit
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
                      Risk
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
                      Transfer
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-brandDark-900 dark:divide-brandDark-700">
                  {filteredOpportunities.map((opp, index) => {
                    const transferBadge = getTransferBadge(opp.transferStatus);
                    const TransferIcon = transferBadge.icon;
                    // Extract coin from symbol if not present
                    const coin = opp.coin || opp.symbol?.split('/')[0] || '?';
                    const isProfitable = opp.isProfitableAfterFees ?? (opp.netProfitPercent > 0);

                    const profitTier = getProfitTier(opp.netProfitPercent);

                    return (
                      <tr
                        key={opp.id || `${opp.symbol}-${opp.buyExchange}-${opp.sellExchange}`}
                        className={`hover:bg-gray-50 dark:hover:bg-brandDark-800 transition-colors ${
                          index === 0 && isProfitable ? 'bg-green-50 dark:bg-green-900/10' :
                          !isProfitable ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''
                        } ${opp.isStale ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 mr-3 font-bold text-white rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                              {coin.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {coin}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {opp.symbol}
                              </div>
                              {/* Show confidence score if available */}
                              {opp.confidenceScore && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    opp.confidenceScore >= 70 ? 'bg-green-500' :
                                    opp.confidenceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  <span className="text-xs text-gray-400">{opp.confidenceScore}% conf</span>
                                </div>
                              )}
                              {/* Profit tier badge — visible to all tiers */}
                              <span className={`inline-flex mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded ${profitTier.cls}`}>
                                {profitTier.label} profit
                              </span>
                              {/* Stale indicator */}
                              {opp.isStale && opp.staleSince && (
                                <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                  Last seen: {new Date(opp.staleSince).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            {opp.buyExchange}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                            {opp.sellExchange}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {/* Buy Price & Ask Depth */}
                            <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-blue-600 dark:text-blue-400">Buy:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${opp.buyPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </span>
                              </div>
                              {opp.buyOrderBook?.[0] && (
                                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                  <span>Available:</span>
                                  <span className="font-mono">{opp.buyOrderBook[0][1]?.toFixed(4)} {opp.coin}</span>
                                </div>
                              )}
                            </div>
                            {/* Sell Price & Bid Depth */}
                            <div className="p-2 rounded bg-green-50 dark:bg-green-900/20">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-green-600 dark:text-green-400">Sell:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  ${opp.sellPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </span>
                              </div>
                              {opp.sellOrderBook?.[0] && (
                                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                  <span>Available:</span>
                                  <span className="font-mono">{opp.sellOrderBook[0][1]?.toFixed(4)} {opp.coin}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-right">
                            {/* Net profit (after all costs) — blurred for free tier */}
                            <div className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded ${
                              isProfitable
                                ? 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300'
                                : 'text-gray-700 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
                            } ${!isPremium ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {(opp.netProfitPercent || opp.profitPercent || 0).toFixed(3)}%
                            </div>
                            {!isPremium && (
                              <div className="mt-1 text-[10px] text-amber-500 font-semibold">Premium only</div>
                            )}
                            {/* Gross spread — premium only */}
                            {isPremium && opp.grossSpreadPercent && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Gross: {opp.grossSpreadPercent.toFixed(3)}%
                              </div>
                            )}
                            {/* Near-miss fee info — show how close to breakeven */}
                            {isPremium && !isProfitable && opp.feesPercent && (
                              <div className="mt-1 text-[10px] text-orange-600 dark:text-orange-400">
                                Need {opp.feesPercent.toFixed(2)}% to break even
                              </div>
                            )}
                            {/* Expected USD profit — premium only */}
                            {isPremium && (opp.expectedProfitUSD ? (
                              <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                                ${opp.expectedProfitUSD.toFixed(2)} expected
                              </div>
                            ) : opp.profitPerCoin && (
                              <div className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                                ${opp.profitPerCoin.toFixed(6)} per coin
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {/* Optimal trade size (new system) or tradeable volume (old system) */}
                          {opp.optimalTradeValueUSD ? (
                            <>
                              <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                ${opp.optimalTradeValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                optimal size
                              </div>
                              {opp.optimalTradeAmount && (
                                <div className="mt-1 text-xs text-gray-400">
                                  {opp.optimalTradeAmount.toFixed(4)} {coin}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {opp.tradeableVolume?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {coin}
                              </div>
                              {opp.maxProfitDollar && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Max: ${opp.maxProfitDollar.toFixed(2)}
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(opp.riskLevel)}`}>
                            {opp.riskLevel || 'Medium'}
                          </span>
                          {/* Show liquidity score if available (new system) */}
                          {opp.liquidity?.avgScore && (
                            <div className="mt-1">
                              <span className={`text-xs ${
                                opp.liquidity.avgScore >= 60 ? 'text-green-600' :
                                opp.liquidity.avgScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                Liq: {Math.round(opp.liquidity.avgScore)}%
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {opp.transferStatus ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${transferBadge.color}`}>
                              <TransferIcon className="w-3 h-3" />
                              {opp.transferStatus}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400">
                              <Info className="w-3 h-3" />
                              N/A
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOpportunity(opp)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                          >
                            Details
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}
      </div>
      </div>{/* end .order-2 Live Scanner wrapper */}

      {/* ── Notable Opportunities History ─────────────────────────── */}
      <div className="order-1 card">
        {/* Section header */}
        <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <History className="w-5 h-5 text-amber-500" />
              Notable Opportunities History
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Opportunities with ≥0.20% net profit — recorded here as they're detected. {isPremium ? 'Email alerts are active.' : 'Upgrade to Premium for instant email alerts.'}
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex items-center flex-shrink-0 gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-flex" />
              {pastMeta.activeCount} Active
            </span>
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-semibold">
              {pastMeta.clearedCount} Cleared
            </span>
            <button
              onClick={() => fetchPastOpportunities(pastFilter, pastPage)}
              disabled={pastLoading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pastLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 mb-4 bg-gray-100 rounded-lg dark:bg-brandDark-800 w-fit">
          {[
            { key: 'all',     label: 'All' },
            { key: 'active',  label: 'Active' },
            { key: 'cleared', label: 'Cleared' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setPastFilter(tab.key); setPastPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                pastFilter === tab.key
                  ? 'bg-white dark:bg-brandDark-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Email alert banner — premium gets active alerts, free gets upgrade nudge */}
        {isPremium ? (
          <div className="flex items-start gap-2 p-3 mb-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Email alerts active.</strong> You'll be notified instantly by email whenever a new opportunity with ≥0.20% net profit is detected — before it closes.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 mb-4 border rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800/40">
            <Bell className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-cyan-700 dark:text-cyan-300">
                <strong>Get instant email alerts.</strong> Premium members are notified the moment a high-profit opportunity is detected — with full profit details and exchange info.
              </p>
              <p className="mt-1 text-xs text-gray-400">Upgrade to Premium to unlock email alerts and full profit data.</p>
            </div>
          </div>
        )}

        {/* Table */}
        {pastLoading && pastOpps.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading history...</span>
          </div>
        ) : pastOpps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-700" />
            <p className="font-medium text-gray-500 dark:text-gray-400">No notable opportunities yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Opportunities with ≥0.20% net profit will appear here as they're detected. Most spreads surface within the first few scans.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-brandDark-800">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Pair</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Buy Exchange</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Sell Exchange</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Net Profit</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Peak Profit</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Expected $</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Risk</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">First Detected</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Last Seen / Cleared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-brandDark-700">
                {pastOpps.map(opp => {
                  const coin = opp.symbol?.split('/')[0] || '?';
                  const isActive = opp.status === 'active';
                  const fmtDate = (d) => d ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <tr key={opp._id} className={`hover:bg-gray-50 dark:hover:bg-brandDark-800 transition-colors ${isActive ? 'bg-green-50/40 dark:bg-green-900/5' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center text-xs font-bold text-white rounded-full w-7 h-7 bg-gradient-to-br from-primary-500 to-secondary-500">
                            {coin.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{coin}</div>
                            <div className="text-xs text-gray-400">{opp.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {opp.buyExchange}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {opp.sellExchange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {opp.netProfitPercent?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {opp.peakProfitPercent?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-right text-green-600 whitespace-nowrap dark:text-green-400">
                        ${(opp.expectedProfitUSD || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskBadgeColor(opp.riskLevel)}`}>
                          {opp.riskLevel || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            Cleared
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(opp.firstDetectedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {isActive ? fmtDate(opp.lastSeenAt) : fmtDate(opp.clearedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pastPagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-brandDark-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {(pastPagination.page - 1) * PAST_LIMIT + 1}–{Math.min(pastPagination.page * PAST_LIMIT, pastPagination.total)}
              </span>{' '}
              of <span className="font-medium text-gray-700 dark:text-gray-300">{pastPagination.total}</span> opportunities
            </p>

            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                onClick={() => setPastPage(1)}
                disabled={!pastPagination.hasPrev || pastLoading}
                className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                «
              </button>

              {/* Previous */}
              <button
                onClick={() => setPastPage(p => Math.max(1, p - 1))}
                disabled={!pastPagination.hasPrev || pastLoading}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹ Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: pastPagination.pages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - pastPagination.page) <= 2)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => setPastPage(p)}
                    disabled={pastLoading}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                      p === pastPagination.page
                        ? 'border-primary-500 bg-primary-500 text-white font-semibold'
                        : 'border-gray-200 dark:border-brandDark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700'
                    } disabled:cursor-not-allowed`}
                  >
                    {p}
                  </button>
                ))
              }

              {/* Next */}
              <button
                onClick={() => setPastPage(p => Math.min(pastPagination.pages, p + 1))}
                disabled={!pastPagination.hasNext || pastLoading}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next ›
              </button>

              {/* Last page */}
              <button
                onClick={() => setPastPage(pastPagination.pages)}
                disabled={!pastPagination.hasNext || pastLoading}
                className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-brandDark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl dark:bg-brandDark-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedOpportunity.symbol} Arbitrage Details
              </h3>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Buy on</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedOpportunity.buyExchange}</p>
                  <p className="text-sm text-gray-600">${selectedOpportunity.buyPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sell on</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedOpportunity.sellExchange}</p>
                  <p className="text-sm text-gray-600">${selectedOpportunity.sellPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Profit Analysis (VWAP-Based)</p>
                <div className="space-y-2">
                  {selectedOpportunity.grossSpreadPercent && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gross spread:</span>
                      <span className="font-medium">{selectedOpportunity.grossSpreadPercent?.toFixed(4) || selectedOpportunity.profitPercent?.toFixed(4)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Net profit (after costs):</span>
                    <span className={`font-medium ${(selectedOpportunity.netProfitPercent || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(selectedOpportunity.netProfitPercent || selectedOpportunity.profitPercent || 0).toFixed(4)}%
                    </span>
                  </div>
                  {selectedOpportunity.expectedProfitUSD ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Expected profit:</span>
                      <span className="font-bold text-green-600">${selectedOpportunity.expectedProfitUSD.toFixed(2)}</span>
                    </div>
                  ) : selectedOpportunity.maxProfitDollar && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max profit:</span>
                      <span className="font-medium">${selectedOpportunity.maxProfitDollar.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOpportunity.optimalTradeValueUSD && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Optimal trade size:</span>
                      <span className="font-medium">${selectedOpportunity.optimalTradeValueUSD.toFixed(0)}</span>
                    </div>
                  )}
                  {selectedOpportunity.confidenceScore && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence score:</span>
                      <span className={`font-bold ${selectedOpportunity.confidenceScore >= 60 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedOpportunity.confidenceScore}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Costs Breakdown (new system) */}
              {selectedOpportunity.costs && (
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <p className="mb-2 text-sm font-medium text-orange-700 dark:text-orange-300">Costs Breakdown</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Buy fee:</span>
                      <span>{selectedOpportunity.costs.buyFeePercent?.toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sell fee:</span>
                      <span>{selectedOpportunity.costs.sellFeePercent?.toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Buy slippage:</span>
                      <span>{selectedOpportunity.costs.buySlippagePercent?.toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sell slippage:</span>
                      <span>{selectedOpportunity.costs.sellSlippagePercent?.toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-2 mt-2 font-medium border-t border-orange-200 dark:border-orange-800">
                      <span className="text-orange-700 dark:text-orange-300">Total costs:</span>
                      <span className="text-orange-700 dark:text-orange-300">{selectedOpportunity.costs.totalCostPercent?.toFixed(3)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tradeable Volume</p>
                  <p className="text-lg font-bold text-blue-600">{selectedOpportunity.tradeableVolume.toFixed(4)} {selectedOpportunity.coin}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level</p>
                  <p className={`text-lg font-bold ${
                    selectedOpportunity.riskLevel === 'Low' ? 'text-green-600' :
                    selectedOpportunity.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{selectedOpportunity.riskLevel}</p>
                </div>
              </div>

              <div className="p-3 border-l-4 border-blue-500 rounded bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">{selectedOpportunity.fees.note}</p>
              </div>

              {/* Order Book Depth */}
              <div className="grid grid-cols-2 gap-4">
                {/* Buy Side Order Book */}
                <div className="p-4 border border-blue-200 rounded-lg dark:border-blue-800">
                  <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    Buy Order Book ({selectedOpportunity.buyExchange})
                  </p>
                  <div className="space-y-1">
                    {selectedOpportunity.buyOrderBook?.slice(0, 3).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          ${order[0]?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {order[1]?.toFixed(4)} {selectedOpportunity.coin}
                        </span>
                      </div>
                    )) || <p className="text-xs text-gray-500">No order book data</p>}
                  </div>
                </div>

                {/* Sell Side Order Book */}
                <div className="p-4 border border-green-200 rounded-lg dark:border-green-800">
                  <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
                    Sell Order Book ({selectedOpportunity.sellExchange})
                  </p>
                  <div className="space-y-1">
                    {selectedOpportunity.sellOrderBook?.slice(0, 3).map((order, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          ${order[0]?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                        <span className="font-mono text-green-600 dark:text-green-400">
                          {order[1]?.toFixed(4)} {selectedOpportunity.coin}
                        </span>
                      </div>
                    )) || <p className="text-xs text-gray-500">No order book data</p>}
                  </div>
                </div>
              </div>

              {/* Transfer Status */}
              <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Status</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedOpportunity.buyTransferable === true
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : selectedOpportunity.buyTransferable === false
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Buy Exchange</p>
                    <p className={`font-medium ${
                      selectedOpportunity.buyTransferable === true
                        ? 'text-green-600'
                        : selectedOpportunity.buyTransferable === false
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}>
                      {selectedOpportunity.buyTransferable === true ? '✓ Transfers Enabled' :
                       selectedOpportunity.buyTransferable === false ? '✗ Transfers Blocked' :
                       '? Unknown Status'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    selectedOpportunity.sellTransferable === true
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : selectedOpportunity.sellTransferable === false
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sell Exchange</p>
                    <p className={`font-medium ${
                      selectedOpportunity.sellTransferable === true
                        ? 'text-green-600'
                        : selectedOpportunity.sellTransferable === false
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}>
                      {selectedOpportunity.sellTransferable === true ? '✓ Transfers Enabled' :
                       selectedOpportunity.sellTransferable === false ? '✗ Transfers Blocked' :
                       '? Unknown Status'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOpportunity(null)}
              className="w-full mt-6 btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoArbitrage;