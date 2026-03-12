import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const fetchAlphaSignals = createAsyncThunk(
  'alpha/fetchSignals',
  async ({ page = 1, limit = 20, category } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (category) params.append('category', category);
      const res = await authAPI.get(`/alpha?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch alpha signals');
    }
  }
);

export const fetchAlphaStats = createAsyncThunk(
  'alpha/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/alpha/stats');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch alpha stats');
    }
  }
);

const alphaSlice = createSlice({
  name: 'alpha',
  initialState: {
    signals:  [],
    meta:     { total: 0, page: 1, limit: 20, gated: false },
    stats:    null,
    loading:  false,
    error:    null,
  },
  reducers: {
    addLiveAlphaSignal(state, action) {
      // Prepend real-time signal from WebSocket without duplicates
      const exists = state.signals.some(s => s._id === action.payload._id);
      if (!exists) state.signals.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlphaSignals.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAlphaSignals.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.signals = payload.data;
        state.meta    = payload.meta;
      })
      .addCase(fetchAlphaSignals.rejected,  (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      })
      .addCase(fetchAlphaStats.fulfilled, (state, { payload }) => {
        state.stats = payload;
      });
  },
});

export const { addLiveAlphaSignal } = alphaSlice.actions;
export default alphaSlice.reducer;
