import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api";

/* ======================
  FETCH ARBITRAGE OPPORTUNITIES (from cache)
====================== */
export const fetchArbitrageOpportunities = createAsyncThunk(
  "arbitrage/fetchOpportunities",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/arbitrage/fetch-opportunity');
      
      // Backend returns: { success: true, count: 5, data: [...], metadata: {...} }
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch arbitrage opportunities";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  REFRESH ARBITRAGE OPPORTUNITIES (Manual refresh)
====================== */
export const refreshArbitrageOpportunities = createAsyncThunk(
  "arbitrage/refreshOpportunities",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.post('/arbitrage/refresh');
      
      // Returns: { success: true, message: "Refresh started...", isLoading: true }
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to refresh arbitrage opportunities";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  FETCH ARBITRAGE STATUS
====================== */
export const fetchArbitrageStatus = createAsyncThunk(
  "arbitrage/fetchStatus",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/arbitrage/status');
      
      // Returns: { success: true, status: { isReady, isLoading, opportunitiesCount, lastUpdate, ... } }
      return response.data.status;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch arbitrage status";
      return thunkAPI.rejectWithValue({ message });
    }
  }
);

/* ======================
  FETCH TRIANGULAR OPPORTUNITIES
====================== */
export const fetchTriangularOpportunities = createAsyncThunk(
  "arbitrage/fetchTriangular",
  async (_, thunkAPI) => {
    try {
      const response = await authAPI.get('/arbitrage/triangular');
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch triangular opportunities");
    }
  }
);

export const fetchTriangularHistory = createAsyncThunk(
  "arbitrage/fetchTriangularHistory",
  async (params = {}, thunkAPI) => {
    try {
      const { limit = 50, status = 'all' } = params;
      const response = await authAPI.get(`/arbitrage/triangular/history?limit=${limit}&status=${status}`);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch triangular history");
    }
  }
);

/* ======================
  INITIAL STATE
====================== */
const initialState = {
  // Arbitrage data
  opportunities: [],
  
  // Status information
  status: {
    isReady: false,
    isLoading: false,
    opportunitiesCount: 0,
    lastUpdate: null,
    nextUpdate: null,
    dataAge: null,
    error: null
  },
  
  // Metadata from API
  metadata: {
    lastUpdate: null,
    nextUpdate: null,
    isRefreshing: false,
    dataAge: null,
    dataAgeFormatted: null,
    isStale: false
  },
  
  // Calculated stats
  stats: {
    totalOpportunities: 0,
    avgProfitPercent: 0,
    avgNetProfitPercent: 0,
    profitableAfterFees: 0,
    totalVolume: 0,
    bestOpportunity: null,
    riskBreakdown: {
      low: 0,
      medium: 0,
      high: 0
    }
  },
  
  // Triangular arbitrage
  triangular: {
    opportunities: [],
    history: [],
    loading: false,
    historyLoading: false,
    lastScan: null,
    isScanning: false,
    gated: false,
    error: null,
  },

  // Loading states
  loading: {
    opportunities: false,
    status: false,
    refreshing: false
  },
  
  // Error and success
  error: null,
  successMessage: null,
};

/* ======================
  ARBITRAGE SLICE
====================== */
const arbitrageSlice = createSlice({
  name: "arbitrage",
  initialState,
  reducers: {
    // Clear messages
    clearArbitrageMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // Reset arbitrage state
    resetArbitrageState: (state) => {
      return initialState;
    },

    // Update local stats
    updateLocalStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    // Live push from Socket.IO arbitrage:update event — always fresh, never stale
    setLiveArbitrageOpportunities: (state, action) => {
      const opportunities = action.payload || [];
      state.opportunities = opportunities;
      state.metadata.lastUpdate = new Date().toISOString();
      state.metadata.isRefreshing = false;
      state.metadata.isStale = false;
      state.stats.totalOpportunities = opportunities.length;
    },

    // Live push from Socket.IO triangular:update event
    setLiveTriangularOpportunities: (state, action) => {
      state.triangular.opportunities = action.payload?.opportunities || [];
      state.triangular.lastScan = action.payload?.lastScan || null;
      state.triangular.isScanning = false;
    },
  },
  
  extraReducers: (builder) => {
    /* ===== FETCH OPPORTUNITIES ===== */
    builder
      .addCase(fetchArbitrageOpportunities.pending, (state) => {
        state.loading.opportunities = true;
        state.error = null;
      })
      .addCase(fetchArbitrageOpportunities.fulfilled, (state, action) => {
        state.loading.opportunities = false;
        
        const { data, metadata, count } = action.payload;
        
        // Store opportunities
        state.opportunities = data || [];
        
        // Store metadata
        state.metadata = {
          lastUpdate: metadata?.lastUpdate || null,
          nextUpdate: metadata?.nextUpdate || null,
          isRefreshing: metadata?.isRefreshing || false,
          dataAge: metadata?.dataAge || null,
          dataAgeFormatted: metadata?.dataAgeFormatted || null,
          isStale: action.payload.isStale || false
        };
        
        // Calculate comprehensive stats
        const opportunities = data || [];
        
        if (opportunities.length > 0) {
          const profitable = opportunities.filter(o => o.isProfitableAfterFees);
          
          // Calculate averages
          const avgProfit = opportunities.reduce((sum, o) => sum + o.profitPercent, 0) / opportunities.length;
          const avgNetProfit = opportunities.reduce((sum, o) => sum + o.netProfitPercent, 0) / opportunities.length;
          
          // Calculate total volume
          const totalVol = opportunities.reduce((sum, o) => sum + (o.totalVolume24h || 0), 0);
          
          // Risk breakdown
          const riskBreakdown = opportunities.reduce((acc, o) => {
            const risk = o.riskLevel.toLowerCase();
            acc[risk] = (acc[risk] || 0) + 1;
            return acc;
          }, { low: 0, medium: 0, high: 0 });
          
          // Best opportunity (highest profit after fees)
          const best = opportunities.reduce((best, current) => {
            if (!best) return current;
            return current.profitPercent > best.profitPercent ? current : best;
          }, null);
          
          state.stats = {
            totalOpportunities: opportunities.length,
            avgProfitPercent: avgProfit,
            avgNetProfitPercent: avgNetProfit,
            profitableAfterFees: profitable.length,
            totalVolume: totalVol,
            bestOpportunity: best,
            riskBreakdown
          };
        } else {
          // Reset stats if no opportunities
          state.stats = {
            totalOpportunities: 0,
            avgProfitPercent: 0,
            avgNetProfitPercent: 0,
            profitableAfterFees: 0,
            totalVolume: 0,
            bestOpportunity: null,
            riskBreakdown: { low: 0, medium: 0, high: 0 }
          };
        }
      })
      .addCase(fetchArbitrageOpportunities.rejected, (state, action) => {
        state.loading.opportunities = false;
        
        // Check if it's a loading state (202 status)
        if (action.payload?.message?.includes('loading') || 
            action.payload?.message?.includes('still loading')) {
          state.error = null;
          state.successMessage = action.payload.message;
          state.metadata.isRefreshing = true;
        } else {
          state.error = action.payload?.message || "Failed to fetch opportunities";
        }
      });

    /* ===== REFRESH OPPORTUNITIES ===== */
    builder
      .addCase(refreshArbitrageOpportunities.pending, (state) => {
        state.loading.refreshing = true;
        state.error = null;
      })
      .addCase(refreshArbitrageOpportunities.fulfilled, (state, action) => {
        state.loading.refreshing = false;
        state.metadata.isRefreshing = true;
        state.successMessage = action.payload.message || "Refresh started. Data will update in a few minutes.";
      })
      .addCase(refreshArbitrageOpportunities.rejected, (state, action) => {
        state.loading.refreshing = false;
        state.error = action.payload?.message || "Failed to trigger refresh";
      });

    /* ===== TRIANGULAR OPPORTUNITIES ===== */
    builder
      .addCase(fetchTriangularOpportunities.pending, (state) => {
        state.triangular.loading = true;
        state.triangular.error = null;
      })
      .addCase(fetchTriangularOpportunities.fulfilled, (state, action) => {
        state.triangular.loading = false;
        state.triangular.opportunities = action.payload.data || [];
        state.triangular.lastScan = action.payload.metadata?.lastScan || null;
        state.triangular.isScanning = action.payload.metadata?.isScanning || false;
        state.triangular.gated = action.payload.metadata?.gated || false;
      })
      .addCase(fetchTriangularOpportunities.rejected, (state, action) => {
        state.triangular.loading = false;
        state.triangular.error = action.payload || "Failed to fetch triangular opportunities";
      });

    builder
      .addCase(fetchTriangularHistory.pending, (state) => { state.triangular.historyLoading = true; })
      .addCase(fetchTriangularHistory.fulfilled, (state, action) => {
        state.triangular.historyLoading = false;
        state.triangular.history = action.payload.data || [];
      })
      .addCase(fetchTriangularHistory.rejected, (state) => { state.triangular.historyLoading = false; });

    /* ===== FETCH STATUS ===== */
    builder
      .addCase(fetchArbitrageStatus.pending, (state) => {
        state.loading.status = true;
        state.error = null;
      })
      .addCase(fetchArbitrageStatus.fulfilled, (state, action) => {
        state.loading.status = false;
        state.status = {
          isReady: action.payload.isReady || false,
          isLoading: action.payload.isLoading || false,
          opportunitiesCount: action.payload.opportunitiesCount || 0,
          lastUpdate: action.payload.lastUpdate || null,
          nextUpdate: action.payload.nextUpdate || null,
          dataAge: action.payload.dataAge || null,
          error: action.payload.error || null
        };
      })
      .addCase(fetchArbitrageStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error = action.payload?.message || "Failed to fetch status";
      });
  },
});

export const {
  clearArbitrageMessages,
  resetArbitrageState,
  updateLocalStats,
  setLiveArbitrageOpportunities,
  setLiveTriangularOpportunities,
} = arbitrageSlice.actions;

export default arbitrageSlice.reducer;