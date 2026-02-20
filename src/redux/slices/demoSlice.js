import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const fetchDemoAccount = createAsyncThunk('demo/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/demo');
    return res.data.data.account;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchDemoPerformance = createAsyncThunk('demo/performance', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/demo/performance');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const resetDemoAccount = createAsyncThunk('demo/reset', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.post('/demo/reset');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const demoSlice = createSlice({
  name: 'demo',
  initialState: {
    virtualBalance: 10000,
    initialBalance: 10000,
    peakBalance: 10000,
    totalRealizedPnL: 0,
    totalFeesPaid: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    pnlPercent: 0,
    balanceLine: [],
    dailyPnL: [],
    bestTrade: null,
    worstTrade: null,
    loading: { account: false, performance: false, reset: false },
    error: null,
  },
  reducers: {
    clearDemoError: (state) => { state.error = null; },
    updateDemoBalance: (state, action) => {
      state.virtualBalance = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDemoAccount.pending, (state) => { state.loading.account = true; })
      .addCase(fetchDemoAccount.fulfilled, (state, action) => {
        state.loading.account = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchDemoAccount.rejected, (state, action) => {
        state.loading.account = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchDemoPerformance.pending, (state) => { state.loading.performance = true; })
      .addCase(fetchDemoPerformance.fulfilled, (state, action) => {
        state.loading.performance = false;
        state.balanceLine = action.payload.balanceLine || [];
        state.dailyPnL = action.payload.dailyPnL || [];
        state.bestTrade = action.payload.bestTrade;
        state.worstTrade = action.payload.worstTrade;
      })
      .addCase(fetchDemoPerformance.rejected, (state) => { state.loading.performance = false; });

    builder
      .addCase(resetDemoAccount.pending, (state) => { state.loading.reset = true; })
      .addCase(resetDemoAccount.fulfilled, (state, action) => {
        state.loading.reset = false;
        state.virtualBalance = action.payload.virtualBalance;
        state.totalRealizedPnL = 0;
        state.totalTrades = 0;
        state.winningTrades = 0;
        state.losingTrades = 0;
        state.winRate = 0;
        state.pnlPercent = 0;
        state.balanceLine = [];
      })
      .addCase(resetDemoAccount.rejected, (state, action) => {
        state.loading.reset = false;
        state.error = action.payload;
      });
  }
});

export const { clearDemoError, updateDemoBalance } = demoSlice.actions;
export default demoSlice.reducer;
