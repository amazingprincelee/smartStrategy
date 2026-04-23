import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// ── Existing thunks ───────────────────────────────────────────────────────────
export const fetchAdminStats = createAsyncThunk(
  'admin/stats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/stats');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAdminUsers = createAsyncThunk(
  'admin/users',
  async ({ search = '', role = '', limit = 50, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit, page });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      const res = await authAPI.get(`/admin/users?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAdminSubscriptions = createAsyncThunk(
  'admin/subscriptions',
  async ({ limit = 50, skip = 0, status = '', provider = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit, skip });
      if (status)   params.set('status', status);
      if (provider) params.set('provider', provider);
      const res = await authAPI.get(`/admin/subscriptions?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAdminSettings = createAsyncThunk(
  'admin/settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/settings');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAdminSettings = createAsyncThunk(
  'admin/settings/update',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.put('/admin/settings', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchPaymentKeyStatus = createAsyncThunk(
  'admin/paymentKeys/status',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/payment-keys/status');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const savePaymentKeys = createAsyncThunk(
  'admin/paymentKeys/save',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.put('/admin/payment-keys', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminActivateUser = createAsyncThunk(
  'admin/activateUser',
  async ({ userId, days }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/admin/activate-premium', { userId, days });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── New thunks ────────────────────────────────────────────────────────────────
// Supports { userIds, days, note } for individuals or { all: true, days, note } for bulk
export const adminGrantTrial = createAsyncThunk(
  'admin/grantTrial',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/admin/grant-trial', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminSearchUsers = createAsyncThunk(
  'admin/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      return res.data.data?.users || res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminUpdateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, ...data }, { rejectWithValue }) => {
    try {
      const res = await authAPI.put(`/admin/users/${userId}`, data);
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminDeleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await authAPI.delete(`/admin/users/${userId}`);
      return userId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  'admin/revenueAnalytics',
  async ({ period = 30 } = {}, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/admin/analytics/revenue?period=${period}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUserAnalytics = createAsyncThunk(
  'admin/userAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/analytics/users');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchPlatformAnalytics = createAsyncThunk(
  'admin/platformAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/analytics/platform');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  'admin/auditLogs',
  async ({ page = 1, limit = 30, action = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (action) params.set('action', action);
      const res = await authAPI.get(`/admin/audit?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const sendTargetedEmail = createAsyncThunk(
  'admin/targetedEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/admin/broadcast/targeted-email', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'admin/updateAnnouncement',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.put('/admin/announcement', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchActiveAnnouncement = createAsyncThunk(
  'admin/activeAnnouncement',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/announcement/active');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

// ── Transaction thunks ────────────────────────────────────────────────────────
export const fetchAdminTransactions = createAsyncThunk(
  'admin/transactions/list',
  async (params = {}, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await authAPI.get(`/admin/transactions?${q}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTransactionStats = createAsyncThunk(
  'admin/transactions/stats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/transactions/stats');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTransactionDetail = createAsyncThunk(
  'admin/transactions/detail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/admin/transactions/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats:             null,
    users:             [],
    usersTotal:        0,
    subscriptions:     [],
    subsTotal:         0,
    settings:          null,
    revenueAnalytics:  null,
    userAnalytics:     null,
    platformAnalytics: null,
    auditLogs:         [],
    auditTotal:        0,
    announcement:      null,
    transactions:      [],
    transactionsTotal: 0,
    transactionStats:  null,
    transactionDetail: null,
    trialSearchResults: [],
    loading:           { stats: false, users: false, subs: false, settings: false, action: false, analytics: false, audit: false, transactions: false, trialSearch: false },
    error:             null,
    actionSuccess:     null,
  },
  reducers: {
    clearAdminAction: (state) => {
      state.actionSuccess = null;
      state.error         = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending,    (state) => { state.loading.stats = true; })
      .addCase(fetchAdminStats.fulfilled,  (state, action) => { state.loading.stats = false; state.stats = action.payload; })
      .addCase(fetchAdminStats.rejected,   (state, action) => { state.loading.stats = false; state.error = action.payload; });

    builder
      .addCase(fetchAdminUsers.pending,    (state) => { state.loading.users = true; })
      .addCase(fetchAdminUsers.fulfilled,  (state, action) => {
        state.loading.users = false;
        state.users         = action.payload.data?.users ?? action.payload.data ?? [];
        state.usersTotal    = action.payload.data?.pagination?.totalUsers ?? 0;
      })
      .addCase(fetchAdminUsers.rejected,   (state, action) => { state.loading.users = false; state.error = action.payload; });

    builder
      .addCase(fetchAdminSubscriptions.pending,   (state) => { state.loading.subs = true; })
      .addCase(fetchAdminSubscriptions.fulfilled, (state, action) => {
        state.loading.subs  = false;
        state.subscriptions = action.payload.data ?? [];
        state.subsTotal     = action.payload.meta?.total ?? 0;
      })
      .addCase(fetchAdminSubscriptions.rejected,  (state, action) => { state.loading.subs = false; state.error = action.payload; });

    builder
      .addCase(fetchAdminSettings.pending,   (state) => { state.loading.settings = true; })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => { state.loading.settings = false; state.settings = action.payload; })
      .addCase(fetchAdminSettings.rejected,  (state, action) => { state.loading.settings = false; state.error = action.payload; });

    builder
      .addCase(updateAdminSettings.pending,   (state) => { state.loading.settings = true; })
      .addCase(updateAdminSettings.fulfilled, (state, action) => { state.loading.settings = false; state.settings = action.payload; state.actionSuccess = 'Settings saved'; })
      .addCase(updateAdminSettings.rejected,  (state, action) => { state.loading.settings = false; state.error = action.payload; });

    builder
      .addCase(adminActivateUser.pending,   (state) => { state.loading.action = true; state.actionSuccess = null; })
      .addCase(adminActivateUser.fulfilled, (state, action) => { state.loading.action = false; state.actionSuccess = action.payload.message; })
      .addCase(adminActivateUser.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(adminGrantTrial.pending,   (state) => { state.loading.action = true; state.actionSuccess = null; })
      .addCase(adminGrantTrial.fulfilled, (state, action) => { state.loading.action = false; state.actionSuccess = action.payload.message; })
      .addCase(adminGrantTrial.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(adminUpdateUser.pending,   (state) => { state.loading.action = true; })
      .addCase(adminUpdateUser.fulfilled, (state, action) => {
        state.loading.action = false;
        state.actionSuccess  = 'User updated';
        const idx = state.users.findIndex(u => u._id === action.payload._id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(adminUpdateUser.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(adminDeleteUser.pending,   (state) => { state.loading.action = true; })
      .addCase(adminDeleteUser.fulfilled, (state, action) => {
        state.loading.action = false;
        state.actionSuccess  = 'User deleted';
        state.users          = state.users.filter(u => u._id !== action.payload);
        state.usersTotal     = Math.max(0, state.usersTotal - 1);
      })
      .addCase(adminDeleteUser.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(fetchRevenueAnalytics.pending,   (state) => { state.loading.analytics = true; })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => { state.loading.analytics = false; state.revenueAnalytics = action.payload; })
      .addCase(fetchRevenueAnalytics.rejected,  (state, action) => { state.loading.analytics = false; state.error = action.payload; });

    builder
      .addCase(fetchUserAnalytics.pending,   (state) => { state.loading.analytics = true; })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => { state.loading.analytics = false; state.userAnalytics = action.payload; })
      .addCase(fetchUserAnalytics.rejected,  (state, action) => { state.loading.analytics = false; state.error = action.payload; });

    builder
      .addCase(fetchPlatformAnalytics.pending,   (state) => { state.loading.analytics = true; })
      .addCase(fetchPlatformAnalytics.fulfilled, (state, action) => { state.loading.analytics = false; state.platformAnalytics = action.payload; })
      .addCase(fetchPlatformAnalytics.rejected,  (state, action) => { state.loading.analytics = false; state.error = action.payload; });

    builder
      .addCase(fetchAuditLogs.pending,   (state) => { state.loading.audit = true; })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => { state.loading.audit = false; state.auditLogs = action.payload.data; state.auditTotal = action.payload.meta?.total || 0; })
      .addCase(fetchAuditLogs.rejected,  (state, action) => { state.loading.audit = false; state.error = action.payload; });

    builder
      .addCase(sendTargetedEmail.pending,   (state) => { state.loading.action = true; state.actionSuccess = null; })
      .addCase(sendTargetedEmail.fulfilled, (state, action) => { state.loading.action = false; state.actionSuccess = `Email sent to ${action.payload.successCount} users`; })
      .addCase(sendTargetedEmail.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(updateAnnouncement.fulfilled, (state, action) => { state.settings = action.payload; state.actionSuccess = 'Announcement updated'; });

    builder
      .addCase(fetchActiveAnnouncement.fulfilled, (state, action) => { state.announcement = action.payload; });

    builder
      .addCase(adminSearchUsers.pending,   (state) => { state.loading.trialSearch = true; })
      .addCase(adminSearchUsers.fulfilled, (state, action) => { state.loading.trialSearch = false; state.trialSearchResults = action.payload; })
      .addCase(adminSearchUsers.rejected,  (state) => { state.loading.trialSearch = false; state.trialSearchResults = []; });

    builder
      .addCase(fetchAdminTransactions.pending,   (state) => { state.loading.transactions = true; })
      .addCase(fetchAdminTransactions.fulfilled, (state, action) => {
        state.loading.transactions = false;
        state.transactions      = action.payload.data || [];
        state.transactionsTotal = action.payload.total || 0;
      })
      .addCase(fetchAdminTransactions.rejected,  (state) => { state.loading.transactions = false; });

    builder
      .addCase(fetchTransactionStats.fulfilled, (state, action) => { state.transactionStats = action.payload; });

    builder
      .addCase(fetchTransactionDetail.fulfilled, (state, action) => { state.transactionDetail = action.payload; });
  },
});

export const { clearAdminAction } = adminSlice.actions;
export default adminSlice.reducer;
