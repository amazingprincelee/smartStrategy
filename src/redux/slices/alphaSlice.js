import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeader = getState => ({ headers: { Authorization: `Bearer ${getState().auth.token}` } });

export const fetchAlphaSignals = createAsyncThunk(
  'alpha/fetchSignals',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/alpha/signals`, authHeader(getState));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

const alphaSlice = createSlice({
  name: 'alpha',
  initialState: {
    signals:      [],
    total:        0,
    lockedCount:  0,
    isPremium:    false,
    freeLimit:    2,
    generatedAt:  null,
    nextRefreshMs: 0,
    loading: false,
    error:   null,
  },
  reducers: {
    clearAlphaError(state) { state.error = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAlphaSignals.pending,   state => { state.loading = true; state.error = null; })
      .addCase(fetchAlphaSignals.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAlphaSignals.fulfilled, (state, action) => {
        state.loading      = false;
        state.signals      = action.payload.signals;
        state.total        = action.payload.total;
        state.lockedCount  = action.payload.lockedCount;
        state.isPremium    = action.payload.isPremium;
        state.freeLimit    = action.payload.freeLimit;
        state.generatedAt  = action.payload.generatedAt;
        state.nextRefreshMs = action.payload.nextRefreshMs;
      });
  },
});

export const { clearAlphaError } = alphaSlice.actions;
export default alphaSlice.reducer;
