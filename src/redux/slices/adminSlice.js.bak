import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Platform stats
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

// All users
export const fetchAdminUsers = createAsyncThunk(
  'admin/users',
  async ({ search = '', role = '', limit = 50, skip = 0 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ limit, skip });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      const res = await authAPI.get(`/admin/users?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Subscription history
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

// AppSettings
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

// Manual premium activation
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

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats:         null,
    users:         [],
    usersTotal:    0,
    subscriptions: [],
    subsTotal:     0,
    settings:      null,
    loading:       { stats: false, users: false, subs: false, settings: false, action: false },
    error:         null,
    actionSuccess: null,
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
        state.users         = action.payload.data ?? [];
        state.usersTotal    = action.payload.pagination?.total ?? 0;
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
      .addCase(updateAdminSettings.fulfilled, (state, action) => { state.loading.settings = false; state.settings = action.payload; })
      .addCase(updateAdminSettings.rejected,  (state, action) => { state.loading.settings = false; state.error = action.payload; });

    builder
      .addCase(adminActivateUser.pending,   (state) => { state.loading.action = true; state.actionSuccess = null; })
      .addCase(adminActivateUser.fulfilled, (state, action) => { state.loading.action = false; state.actionSuccess = action.payload.message; })
      .addCase(adminActivateUser.rejected,  (state, action) => { state.loading.action = false; state.error = action.payload; });
  },
});

export const { clearAdminAction } = adminSlice.actions;
export default adminSlice.reducer;
