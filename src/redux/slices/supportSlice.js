import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// ── User thunks ───────────────────────────────────────────────────────────────
export const submitTicket = createAsyncThunk(
  'support/submitTicket',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/support', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUserTickets = createAsyncThunk(
  'support/fetchUserTickets',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/support?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'support/fetchTicketById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/support/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const replyToTicket = createAsyncThunk(
  'support/replyToTicket',
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/support/${id}/reply`, { message });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Admin thunks ──────────────────────────────────────────────────────────────
export const adminFetchAllTickets = createAsyncThunk(
  'support/adminFetchAll',
  async ({ page = 1, limit = 30, status = '', category = '', search = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status)   params.set('status', status);
      if (category) params.set('category', category);
      if (search)   params.set('search', search);
      const res = await authAPI.get(`/support/admin/all?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminFetchTicket = createAsyncThunk(
  'support/adminFetchTicket',
  async (id, { rejectWithValue }) => {
    try {
      const res = await authAPI.get(`/support/admin/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminReplyTicket = createAsyncThunk(
  'support/adminReply',
  async ({ id, message, status }, { rejectWithValue }) => {
    try {
      const res = await authAPI.post(`/support/admin/${id}/reply`, { message, status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const adminUpdateTicketStatus = createAsyncThunk(
  'support/adminUpdateStatus',
  async ({ id, status, priority }, { rejectWithValue }) => {
    try {
      const res = await authAPI.patch(`/support/admin/${id}/status`, { status, priority });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────
const supportSlice = createSlice({
  name: 'support',
  initialState: {
    // User
    myTickets:    [],
    myTotal:      0,
    activeTicket: null,
    // Admin
    allTickets:   [],
    allTotal:     0,
    unreadCount:  0,
    adminTicket:  null,
    loading:      { list: false, ticket: false, action: false },
    error:        null,
    success:      null,
  },
  reducers: {
    clearSupportState: (state) => { state.error = null; state.success = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitTicket.pending,    (state) => { state.loading.action = true; state.error = null; })
      .addCase(submitTicket.fulfilled,  (state, action) => { state.loading.action = false; state.myTickets.unshift(action.payload); state.success = 'Ticket submitted successfully'; })
      .addCase(submitTicket.rejected,   (state, action) => { state.loading.action = false; state.error = action.payload; });

    builder
      .addCase(fetchUserTickets.pending,    (state) => { state.loading.list = true; })
      .addCase(fetchUserTickets.fulfilled,  (state, action) => { state.loading.list = false; state.myTickets = action.payload.data; state.myTotal = action.payload.meta?.total || 0; })
      .addCase(fetchUserTickets.rejected,   (state, action) => { state.loading.list = false; state.error = action.payload; });

    builder
      .addCase(fetchTicketById.pending,    (state) => { state.loading.ticket = true; })
      .addCase(fetchTicketById.fulfilled,  (state, action) => { state.loading.ticket = false; state.activeTicket = action.payload; })
      .addCase(fetchTicketById.rejected,   (state, action) => { state.loading.ticket = false; state.error = action.payload; });

    builder
      .addCase(replyToTicket.fulfilled, (state, action) => { state.activeTicket = action.payload; });

    builder
      .addCase(adminFetchAllTickets.pending,    (state) => { state.loading.list = true; })
      .addCase(adminFetchAllTickets.fulfilled,  (state, action) => { state.loading.list = false; state.allTickets = action.payload.data; state.allTotal = action.payload.meta?.total || 0; state.unreadCount = action.payload.meta?.unreadCount || 0; })
      .addCase(adminFetchAllTickets.rejected,   (state, action) => { state.loading.list = false; state.error = action.payload; });

    builder
      .addCase(adminFetchTicket.pending,    (state) => { state.loading.ticket = true; })
      .addCase(adminFetchTicket.fulfilled,  (state, action) => { state.loading.ticket = false; state.adminTicket = action.payload; })
      .addCase(adminFetchTicket.rejected,   (state, action) => { state.loading.ticket = false; state.error = action.payload; });

    builder
      .addCase(adminReplyTicket.fulfilled,       (state, action) => { state.adminTicket = action.payload; state.success = 'Reply sent'; })
      .addCase(adminUpdateTicketStatus.fulfilled, (state, action) => { state.adminTicket = action.payload; state.success = 'Status updated'; });
  },
});

export const { clearSupportState } = supportSlice.actions;
export default supportSlice.reducer;
