import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// ── User thunks ───────────────────────────────────────────────────────────────
export const requestWithdrawal = createAsyncThunk(
  'withdrawals/request',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/withdrawals', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUserWithdrawals = createAsyncThunk(
  'withdrawals/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/withdrawals');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Admin thunks ──────────────────────────────────────────────────────────────
export const adminFetchWithdrawals = createAsyncThunk(
  'withdrawals/adminFetchAll',
  async ({ page = 1, limit = 30, status = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.set('status', status);
      const res = await authAPI.get(`/withdrawals/admin/all?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminApproveWithdrawal = createAsyncThunk(
  'withdrawals/approve',
  async ({ id, adminNote = '' }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/withdrawals/admin/${id}/approve`, { adminNote });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminRejectWithdrawal = createAsyncThunk(
  'withdrawals/reject',
  async ({ id, adminNote = '' }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/withdrawals/admin/${id}/reject`, { adminNote });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminMarkPaid = createAsyncThunk(
  'withdrawals/markPaid',
  async ({ id, txHash, adminNote = '' }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/withdrawals/admin/${id}/mark-paid`, { txHash, adminNote });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const withdrawalSlice = createSlice({
  name: 'withdrawals',
  initialState: {
    myWithdrawals:   [],
    allWithdrawals:  [],
    allTotal:        0,
    pendingCount:    0,
    loading:         { list: false, action: false },
    error:           null,
    success:         null,
  },
  reducers: {
    clearWithdrawalState: (state) => { state.error = null; state.success = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestWithdrawal.pending,    (state) => { state.loading.action = true; state.error = null; })
      .addCase(requestWithdrawal.fulfilled,  (state, action) => { state.loading.action = false; state.myWithdrawals.unshift(action.payload); state.success = 'Withdrawal request submitted'; })
      .addCase(requestWithdrawal.rejected,   (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(fetchUserWithdrawals.pending,    (state) => { state.loading.list = true; })
      .addCase(fetchUserWithdrawals.fulfilled,  (state, action) => { state.loading.list = false; state.myWithdrawals = action.payload; })
      .addCase(fetchUserWithdrawals.rejected,   (state, action) => { state.loading.list = false; state.error = action.payload; });

    builder
      .addCase(adminFetchWithdrawals.pending,    (state) => { state.loading.list = true; })
      .addCase(adminFetchWithdrawals.fulfilled,  (state, action) => {
        state.loading.list   = false;
        state.allWithdrawals = action.payload.data;
        state.allTotal       = action.payload.meta?.total || 0;
        state.pendingCount   = action.payload.meta?.pendingCount || 0;
      })
      .addCase(adminFetchWithdrawals.rejected,   (state, action) => { state.loading.list = false; state.error = action.payload; });

    const updateOne = (state, action) => {
      state.loading.action = false;
      state.success = 'Action completed';
      const idx = state.allWithdrawals.findIndex(w => w._id === action.payload._id);
      if (idx !== -1) state.allWithdrawals[idx] = action.payload;
    };
    builder
      .addCase(adminApproveWithdrawal.pending,    (state) => { state.loading.action = true; state.error = null; })
      .addCase(adminApproveWithdrawal.fulfilled,  updateOne)
      .addCase(adminApproveWithdrawal.rejected,   (state, action) => { state.loading.action = false; state.error = action.payload; });
    builder
      .addCase(adminRejectWithdrawal.pending,    (state) => { state.loading.action = true; state.error = null; })
      .addCase(adminRejectWithdrawal.fulfilled,  updateOne)
      .addCase(adminRejectWithdrawal.rejected,   (state, action) => { state.loading.action = false; state.error = action.payload; });
    builder
      .addCase(adminMarkPaid.pending,    (state) => { state.loading.action = true; state.error = null; })
      .addCase(adminMarkPaid.fulfilled,  updateOne)
      .addCase(adminMarkPaid.rejected,   (state, action) => { state.loading.action = false; state.error = action.payload; });
  },
});

export const { clearWithdrawalState } = withdrawalSlice.actions;
export default withdrawalSlice.reducer;
