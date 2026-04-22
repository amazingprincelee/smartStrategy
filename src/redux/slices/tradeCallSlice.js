import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// ── Public thunks ──────────────────────────────────────────────────────────────

export const fetchTradeCalls = createAsyncThunk(
  'tradeCalls/fetchAll',
  async ({ status, limit = 20, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get('/trade-calls', { params: { status, limit, page } });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchTradeCallStats = createAsyncThunk(
  'tradeCalls/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get('/trade-calls/stats');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Admin thunks ───────────────────────────────────────────────────────────────

export const adminCreateTradeCall = createAsyncThunk(
  'tradeCalls/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.post('/trade-calls', payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const adminUpdateTradeCall = createAsyncThunk(
  'tradeCalls/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.put(`/trade-calls/${id}`, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const adminDeleteTradeCall = createAsyncThunk(
  'tradeCalls/delete',
  async (id, { rejectWithValue }) => {
    try {
      await authAPI.delete(`/trade-calls/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const tradeCallSlice = createSlice({
  name: 'tradeCalls',
  initialState: {
    calls:      [],
    total:      0,
    stats:      null,
    livePrices: {}, // pair → current price, populated via Socket.IO
    loading:    false,
    error:      null,
    success:    null,
  },
  reducers: {
    updateLivePrices(state, action) {
      state.livePrices = { ...state.livePrices, ...action.payload };
    },
    resolveTradeCall(state, action) {
      const { _id, status, tp1Hit, tp2Hit, closedAt, closingPrice } = action.payload;
      const idx = state.calls.findIndex(c => c._id === _id);
      if (idx !== -1) {
        state.calls[idx] = { ...state.calls[idx], status, tp1Hit, tp2Hit, closedAt, closingPrice };
      }
    },
    clearTradeCallMessages(state) {
      state.error   = null;
      state.success = null;
    },
  },
  extraReducers: builder => {
    const pending  = state => { state.loading = true;  state.error = null; };
    const rejected = (state, a) => { state.loading = false; state.error = a.payload; };

    builder
      .addCase(fetchTradeCalls.pending,   pending)
      .addCase(fetchTradeCalls.rejected,  rejected)
      .addCase(fetchTradeCalls.fulfilled, (state, a) => {
        state.loading = false;
        state.calls   = a.payload.calls;
        state.total   = a.payload.total;
      })
      .addCase(fetchTradeCallStats.fulfilled, (state, a) => { state.stats = a.payload; })
      .addCase(adminCreateTradeCall.pending,   pending)
      .addCase(adminCreateTradeCall.rejected,  rejected)
      .addCase(adminCreateTradeCall.fulfilled, (state, a) => {
        state.loading = false;
        state.calls.unshift(a.payload);
        state.success = 'Trade call posted successfully';
      })
      .addCase(adminUpdateTradeCall.fulfilled, (state, a) => {
        const idx = state.calls.findIndex(c => c._id === a.payload._id);
        if (idx !== -1) state.calls[idx] = a.payload;
        state.success = 'Trade call updated';
      })
      .addCase(adminDeleteTradeCall.fulfilled, (state, a) => {
        state.calls = state.calls.filter(c => c._id !== a.payload);
        state.success = 'Trade call deleted';
      });
  },
});

export const { updateLivePrices, resolveTradeCall, clearTradeCallMessages } = tradeCallSlice.actions;
export default tradeCallSlice.reducer;
