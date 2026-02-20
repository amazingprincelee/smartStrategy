import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api";

/* ======================
  FETCH DASHBOARD DATA
====================== */
export const fetchDashboard = createAsyncThunk(
  "dashboard/fetchDashboard",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/dashboard');
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch dashboard data";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  FETCH DASHBOARD STATS
====================== */
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/user/stats');
      return response.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch stats";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  INITIAL STATE
====================== */
const initialState = {
  stats: {
    portfolioValue: 0,
    totalReturns: 0,
    activeBots: 0,
    totalTrades: 0,
  },
  recentActivity: [],

  loading: {
    dashboard: false,
    stats: false,
  },

  error: null,
  successMessage: null,
};

/* ======================
  DASHBOARD SLICE
====================== */
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetDashboardState: () => initialState,
    updateStat: (state, action) => {
      const { key, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.stats, key)) {
        state.stats[key] = value;
      }
    },
  },

  extraReducers: (builder) => {
    /* ===== FETCH DASHBOARD ===== */
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading.dashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.stats = action.payload.stats || state.stats;
        state.recentActivity = action.payload.recentActivity || [];
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error = action.payload?.message || "Failed to fetch dashboard";
      });

    /* ===== FETCH STATS ===== */
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = { ...state.stats, ...action.payload };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload?.message || "Failed to fetch stats";
      });
  },
});

export const {
  clearDashboardMessages,
  resetDashboardState,
  updateStat,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
