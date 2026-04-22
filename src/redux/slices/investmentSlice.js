import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeader = (getState) => ({
  headers: { Authorization: `Bearer ${getState().auth.token}` },
});

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchInvestmentDashboard = createAsyncThunk(
  'investment/fetchDashboard',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/investment/dashboard`, authHeader(getState));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const applyInvestment = createAsyncThunk(
  'investment/apply',
  async ({ tier, amount }, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API}/investment/apply`, { tier, amount }, authHeader(getState));
      return data.data; // { paymentUrl, investmentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const requestWithdrawal = createAsyncThunk(
  'investment/requestWithdrawal',
  async ({ investmentId, type, walletAddress }, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API}/investment/withdraw`,
        { investmentId, type, walletAddress },
        authHeader(getState),
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const triggerManualAccrual = createAsyncThunk(
  'investment/triggerManualAccrual',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API}/investment/admin/accrue-earnings`, {}, authHeader(getState));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Admin thunks ──────────────────────────────────────────────────────────────

export const fetchAdminInvestmentStats = createAsyncThunk(
  'investment/adminStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/investment/admin/stats`, authHeader(getState));
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchAdminInvestorList = createAsyncThunk(
  'investment/adminList',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/investment/admin/list`, {
        ...authHeader(getState),
        params,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchAdminWithdrawals = createAsyncThunk(
  'investment/adminWithdrawals',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/investment/admin/withdrawals`, {
        ...authHeader(getState),
        params,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const adminUpdateWithdrawal = createAsyncThunk(
  'investment/adminUpdateWithdrawal',
  async ({ id, status, adminNote }, { getState, rejectWithValue }) => {
    try {
      const { data } = await axios.put(
        `${API}/investment/admin/withdrawal/${id}`,
        { status, adminNote },
        authHeader(getState),
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const investmentSlice = createSlice({
  name: 'investment',
  initialState: {
    // User
    investments:  [],
    withdrawals:  [],
    tiers:        null,
    // Admin
    adminStats:   null,
    investorList: [],
    investorTotal: 0,
    adminWithdrawals: [],
    adminWithdrawalsTotal: 0,
    // Admin misc
    accrualResult: null,
    // UI
    loading:   false,
    error:     null,
    success:   null,
  },
  reducers: {
    clearInvestmentMessages(state) {
      state.error   = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      // dashboard
      .addCase(fetchInvestmentDashboard.pending,   pending)
      .addCase(fetchInvestmentDashboard.rejected,  rejected)
      .addCase(fetchInvestmentDashboard.fulfilled, (state, action) => {
        state.loading    = false;
        state.investments = action.payload.investments;
        state.withdrawals = action.payload.withdrawals;
        state.tiers       = action.payload.tiers;
      })
      // apply
      .addCase(applyInvestment.pending,   pending)
      .addCase(applyInvestment.rejected,  rejected)
      .addCase(applyInvestment.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Redirecting to payment…';
      })
      // withdraw
      .addCase(requestWithdrawal.pending,   pending)
      .addCase(requestWithdrawal.rejected,  rejected)
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Withdrawal request submitted. An admin will process it manually.';
        state.withdrawals.unshift(action.payload);
      })
      // admin stats
      .addCase(fetchAdminInvestmentStats.fulfilled, (state, action) => {
        state.adminStats = action.payload;
      })
      // admin investor list
      .addCase(fetchAdminInvestorList.fulfilled, (state, action) => {
        state.investorList  = action.payload.investments;
        state.investorTotal = action.payload.total;
      })
      // admin withdrawals
      .addCase(fetchAdminWithdrawals.fulfilled, (state, action) => {
        state.adminWithdrawals      = action.payload.withdrawals;
        state.adminWithdrawalsTotal = action.payload.total;
      })
      // admin update withdrawal
      .addCase(adminUpdateWithdrawal.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.adminWithdrawals.findIndex(w => w._id === updated._id);
        if (idx !== -1) state.adminWithdrawals[idx] = updated;
        state.success = `Withdrawal marked as ${updated.status}`;
      })
      // manual accrual
      .addCase(triggerManualAccrual.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(triggerManualAccrual.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(triggerManualAccrual.fulfilled, (state, action) => {
        state.loading       = false;
        state.accrualResult = action.payload;
        state.success       = `Earnings accrued for ${action.payload.updated} investments`;
      });
  },
});

export const { clearInvestmentMessages } = investmentSlice.actions;
export default investmentSlice.reducer;
