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

/* ============= SLICE ============= */

const signalSlice = createSlice({
  name: 'signals',
  initialState: {
    spot:     [],
    futures:  [],
    stats:    null,
    loading:  false,
    statsLoading: false,
    error:    null,
    lastUpdated: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchSignals
    builder
      .addCase(fetchSignals.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchSignals.fulfilled, (state, action) => {
        state.loading = false;
        const { marketType, signals } = action.payload;
        state[marketType]   = signals;
        state.lastUpdated   = new Date().toISOString();
      })
      .addCase(fetchSignals.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // fetchPlatformStats
    builder
      .addCase(fetchPlatformStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats        = action.payload;
      })
      .addCase(fetchPlatformStats.rejected, (state) => {
        state.statsLoading = false;
      });
  },
});

export default signalSlice.reducer;
