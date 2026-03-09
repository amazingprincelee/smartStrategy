import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Zap, TrendingUp, Loader, ChevronRight, Star } from 'lucide-react';
import { fetchStrategies } from '../redux/slices/botSlice';

const RISK_CONFIG = {
  low: { label: 'Low Risk', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  medium: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  high: { label: 'High Risk', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const StrategyCard = ({ strategy, onSelect }) => {
  const risk = RISK_CONFIG[strategy.riskLevel] || RISK_CONFIG.medium;

  return (
    <div className="bg-white dark:bg-brandDark-800 rounded-xl border border-gray-200 dark:border-brandDark-700 p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
            {strategy.isDefault && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${risk.className}`}>
              {risk.label}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-brandDark-700 dark:text-gray-300 rounded-full">
              <Clock className="w-3 h-3" />
              {strategy.timeframe}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1 leading-relaxed">
        {strategy.description}
      </p>

      {/* Supported markets */}
      <div className="flex gap-2 mb-4">
        {strategy.supportedMarkets.map(market => (
          <span
            key={market}
            className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded capitalize"
          >
            {market}
          </span>
        ))}
      </div>

      {/* Best for */}
      {strategy.bestFor && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Best for:</p>
          <div className="flex flex-wrap gap-1">
            {strategy.bestFor.map(item => (
              <span key={item} className="px-2 py-0.5 text-xs bg-gray-50 dark:bg-brandDark-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-brandDark-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect(strategy.id)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm mt-auto"
      >
        Use This Strategy
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const StrategyLibrary = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { strategies, loading } = useSelector(state => state.bots);
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchStrategies());
  }, [dispatch]);

  const filtered = riskFilter === 'all'
    ? strategies
    : strategies.filter(s => s.riskLevel === riskFilter);

  const handleSelect = (strategyId) => {
    navigate(`/bots/create?strategy=${strategyId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Library</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Choose from {strategies.length} trading strategies. Click "Use This Strategy" to create a bot.
        </p>
      </div>

      {/* Risk filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'low', 'medium', 'high'].map(level => (
          <button
            key={level}
            onClick={() => setRiskFilter(level)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              riskFilter === level
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-brandDark-800 border border-gray-200 dark:border-brandDark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brandDark-700'
            }`}
          >
            {level === 'all' ? 'All Strategies' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
          </button>
        ))}
      </div>

      {/* Strategy grid */}
      {loading.strategies ? (
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(strategy => (
            <StrategyCard key={strategy.id} strategy={strategy} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyLibrary;
