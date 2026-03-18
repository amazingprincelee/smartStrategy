import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

/* ============= THUNKS ============= */

export const fetchSignals = createAsyncThunk(
  'signals/fetch',
  async (marketType = 'spot', { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/signals?type=${marketType}`);
      return { marketType, signals: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchPlatformStats = createAsyncThunk(
  'signals/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/signals/stats');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSignalHistory = createAsyncThunk(
  'signals/fetchHistory',
  async ({ marketType, type, pair, minConfidence, sort = 'newest', limit = 50, skip = 0 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (marketType)    params.append('marketType', marketType);
      if (type)          params.append('type', type);
      if (pair)          params.append('pair', pair);
      if (minConfidence) params.append('minConfidence', minConfidence);
      params.append('sort', sort);
      params.append('limit', limit);
      params.append('skip', skip);

      const res = await authAPI.get(`/signals/history?${params.toString()}`);
      return { signals: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const runBacktest = createAsyncThunk(
  'signals/runBacktest',
  async (params, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/signals/backtest', params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const analyzeSignal = createAsyncThunk(
  'signals/analyze',
  async ({ symbol, timeframe = '1h', marketType = 'spot' }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/signals/analyze', { symbol, timeframe, marketType });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAvailablePairs = createAsyncThunk(
  'signals/fetchPairs',
  async (market = 'spot', { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/signals/pairs?market=${market}`);
      return { market, pairs: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetches ALL exchanges' USDT pairs in a single call for global preloading.
// Result shape: { okx: { spot: [...], futures: [...] }, kucoin: {...}, … }
export const fetchAllExchangePairs = createAsyncThunk(
  'signals/fetchAllExchangePairs',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/signals/all-exchange-pairs');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetches pairs for a single exchange+market on demand.
// The backend does a live CCXT fetch if the DB record is missing (handles first-run race).
// Result is merged into exchangePairsMap so it's only fetched once per session.
export const fetchExchangePairsForExchange = createAsyncThunk(
  'signals/fetchExchangePairsForExchange',
  async ({ exchange, market }, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/signals/exchange-pairs?exchange=${exchange}&market=${market}`);
      return { exchange, market, pairs: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* ============= SLICE ============= */

const signalSlice = createSlice({
  name: 'signals',
  initialState: {
    spot:             [],
    futures:          [],
    stats:            null,
    history:          [],
    historyMeta:      { total: 0, limit: 50, skip: 0 },
    backtestResult:   null,
    analysis:         null,
    availablePairs:      [],
    exchangePairsMap:     {},   // { okx: { spot: [...], futures: [...] }, ... }
    exchangePairsLoading:  false,
    exchangePairsFetching: false, // true while fetching a single exchange on demand
    loading:          false,
    statsLoading:     false,
    historyLoading:   false,
    backtestLoading:  false,
    analysisLoading:  false,
    pairsLoading:     false,
    error:            null,
    backtestError:    null,
    analysisError:    null,
    lastUpdated:      null,
  },
  reducers: {
    // Invoked by SocketContext when a live signal arrives via WebSocket
    addLiveSignal(state, action) {
      const signal = action.payload;
      const market = signal.marketType === 'futures' ? 'futures' : 'spot';
      state[market] = [signal, ...state[market]].slice(0, 20);
      state.lastUpdated = new Date().toISOString();
    },
    clearBacktestResult(state) {
      state.backtestResult = null;
      state.backtestError  = null;
    },
    clearAnalysis(state) {
      state.analysis      = null;
      state.analysisError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSignals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSignals.fulfilled, (state, { payload }) => {
        state.loading = false;
        state[payload.marketType] = payload.signals;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSignals.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    builder
      .addCase(fetchPlatformStats.pending,   (state) => { state.statsLoading = true; })
      .addCase(fetchPlatformStats.fulfilled, (state, { payload }) => { state.statsLoading = false; state.stats = payload; })
      .addCase(fetchPlatformStats.rejected,  (state) => { state.statsLoading = false; });

    builder
      .addCase(fetchSignalHistory.pending,   (state) => { state.historyLoading = true; })
      .addCase(fetchSignalHistory.fulfilled, (state, { payload }) => {
        state.historyLoading = false;
        state.history     = payload.signals;
        state.historyMeta = payload.meta;
      })
      .addCase(fetchSignalHistory.rejected,  (state) => { state.historyLoading = false; });

    builder
      .addCase(runBacktest.pending,   (state) => { state.backtestLoading = true; state.backtestError = null; state.backtestResult = null; })
      .addCase(runBacktest.fulfilled, (state, { payload }) => { state.backtestLoading = false; state.backtestResult = payload; })
      .addCase(runBacktest.rejected,  (state, { payload }) => { state.backtestLoading = false; state.backtestError = payload; });

    builder
      .addCase(analyzeSignal.pending,   (state) => { state.analysisLoading = true; state.analysisError = null; state.analysis = null; })
      .addCase(analyzeSignal.fulfilled, (state, { payload }) => { state.analysisLoading = false; state.analysis = payload; })
      .addCase(analyzeSignal.rejected,  (state, { payload }) => { state.analysisLoading = false; state.analysisError = payload; });

    builder
      .addCase(fetchAvailablePairs.pending,   (state) => { state.pairsLoading = true; })
      .addCase(fetchAvailablePairs.fulfilled, (state, { payload }) => { state.pairsLoading = false; state.availablePairs = payload.pairs; })
      .addCase(fetchAvailablePairs.rejected,  (state) => { state.pairsLoading = false; }); // keep existing pairs on error

    builder
      .addCase(fetchAllExchangePairs.pending,   (state) => { state.exchangePairsLoading = true; })
      .addCase(fetchAllExchangePairs.fulfilled, (state, { payload }) => {
        state.exchangePairsLoading = false;
        state.exchangePairsMap = payload;
      })
      .addCase(fetchAllExchangePairs.rejected,  (state) => { state.exchangePairsLoading = false; });

    builder
      .addCase(fetchExchangePairsForExchange.pending,   (state) => { state.exchangePairsFetching = true; })
      .addCase(fetchExchangePairsForExchange.fulfilled, (state, { payload }) => {
        state.exchangePairsFetching = false;
        if (!state.exchangePairsMap[payload.exchange]) state.exchangePairsMap[payload.exchange] = {};
        state.exchangePairsMap[payload.exchange][payload.market] = payload.pairs;
      })
      .addCase(fetchExchangePairsForExchange.rejected,  (state) => { state.exchangePairsFetching = false; });
  },
});

export const { addLiveSignal, clearBacktestResult, clearAnalysis } = signalSlice.actions;
export default signalSlice.reducer;
