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

export const fetchAlphaFavorites = createAsyncThunk(
  'alpha/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/alpha/favorites');
      return res.data; // { data: signals[], favorites: ids[] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch favorites');
    }
  }
);

export const toggleAlphaFavorite = createAsyncThunk(
  'alpha/toggleFavorite',
  async (signalId, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/alpha/favorite/${signalId}`);
      return res.data; // { favorited, favorites: ids[] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update favorite');
    }
  }
);

export const analyzeAlphaSignal = createAsyncThunk(
  'alpha/analyze',
  async (signalId, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/alpha/analyze/${signalId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Analysis failed');
    }
  }
);

const alphaSlice = createSlice({
  name: 'alpha',
  initialState: {
    signals:         [],
    favoriteSignals: [],   // full signal docs for favorites tab
    favoriteIds:     [],   // just IDs for quick lookup
    meta:     { total: 0, page: 1, limit: 20, gated: false },
    stats:    null,
    loading:  false,
    favLoading: false,
    error:    null,
    livePrices:      {},   // { OGNUSDT: 0.0123, ... } — pushed via Socket.IO
    analysis:        null,
    analysisLoading: false,
    analysisError:   null,
  },
  reducers: {
    addLiveAlphaSignal(state, action) {
      const exists = state.signals.some(s => s._id === action.payload._id);
      if (!exists) state.signals.unshift(action.payload);
    },
    updateAlphaLivePrices(state, action) {
      // Merge incoming prices — only update keys present in payload
      state.livePrices = { ...state.livePrices, ...action.payload };
    },
    clearAlphaAnalysis(state) {
      state.analysis = null;
      state.analysisError = null;
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
      })
      .addCase(fetchAlphaFavorites.pending,   (state) => { state.favLoading = true; })
      .addCase(fetchAlphaFavorites.fulfilled, (state, { payload }) => {
        state.favLoading     = false;
        state.favoriteSignals = payload.data;
        state.favoriteIds    = payload.favorites;
      })
      .addCase(fetchAlphaFavorites.rejected, (state) => { state.favLoading = false; })
      .addCase(toggleAlphaFavorite.fulfilled, (state, { payload }) => {
        state.favoriteIds = payload.favorites;
        // If unfavorited, remove from favoriteSignals list
        if (!payload.favorited) {
          state.favoriteSignals = state.favoriteSignals.filter(
            s => payload.favorites.includes(s._id.toString())
          );
        }
      })
      .addCase(analyzeAlphaSignal.pending, (state) => {
        state.analysisLoading = true;
        state.analysisError   = null;
        state.analysis        = null;
      })
      .addCase(analyzeAlphaSignal.fulfilled, (state, { payload }) => {
        state.analysisLoading = false;
        state.analysis        = payload;
      })
      .addCase(analyzeAlphaSignal.rejected, (state, { payload }) => {
        state.analysisLoading = false;
        state.analysisError   = payload;
      });
  },
});

export const { addLiveAlphaSignal, updateAlphaLivePrices, clearAlphaAnalysis } = alphaSlice.actions;
export default alphaSlice.reducer;
