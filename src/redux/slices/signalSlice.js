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
  async ({ marketType, type, minConfidence, limit = 50, skip = 0 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (marketType)    params.append('marketType', marketType);
      if (type)          params.append('type', type);
      if (minConfidence) params.append('minConfidence', minConfidence);
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

/* ============= SLICE ============= */

const signalSlice = createSlice({
  name: 'signals',
  initialState: {
    spot:            [],
    futures:         [],
    stats:           null,
    history:         [],
    historyMeta:     { total: 0, limit: 50, skip: 0 },
    backtestResult:  null,
    loading:         false,
    statsLoading:    false,
    historyLoading:  false,
    backtestLoading: false,
    error:           null,
    backtestError:   null,
    lastUpdated:     null,
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
  },
});

export const { addLiveSignal, clearBacktestResult } = signalSlice.actions;
export default signalSlice.reducer;
