import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

/* ============= THUNKS ============= */

export const fetchBots = createAsyncThunk('bots/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/bots');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchBotDetail = createAsyncThunk('bots/detail', async (id, { rejectWithValue }) => {
  try {
    const res = await authAPI.get(`/bots/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createBot = createAsyncThunk('bots/create', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.post('/bots', data);
    return res.data.data.bot;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateBot = createAsyncThunk('bots/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await authAPI.put(`/bots/${id}`, data);
    return res.data.data.bot;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteBot = createAsyncThunk('bots/delete', async (id, { rejectWithValue }) => {
  try {
    await authAPI.delete(`/bots/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const startBot = createAsyncThunk('bots/start', async (id, { rejectWithValue }) => {
  try {
    await authAPI.post(`/bots/${id}/start`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const stopBot = createAsyncThunk('bots/stop', async (id, { rejectWithValue }) => {
  try {
    await authAPI.post(`/bots/${id}/stop`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchBotTrades = createAsyncThunk('bots/trades', async ({ id, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const res = await authAPI.get(`/bots/${id}/trades`, { params: { page, limit } });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchBotPositions = createAsyncThunk('bots/positions', async ({ id, status = 'open' }, { rejectWithValue }) => {
  try {
    const res = await authAPI.get(`/bots/${id}/positions`, { params: { status } });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchStrategies = createAsyncThunk('bots/strategies', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/strategies');
    return res.data.data.strategies;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

/* ============= INITIAL STATE ============= */

const initialState = {
  list: [],
  detail: null,
  openPositions: [],
  trades: [],
  tradesMeta: { total: 0, page: 1, totalPages: 1 },
  strategies: [],
  loading: {
    list: false,
    detail: false,
    action: false,
    trades: false,
    strategies: false,
  },
  error: null,
};

/* ============= SLICE ============= */

const botSlice = createSlice({
  name: 'bots',
  initialState,
  reducers: {
    clearBotError: (state) => { state.error = null; },

    // Called from SocketContext on bot:tick events
    updateBotRealtime: (state, action) => {
      const { botId, currentPrice, openPositions, status, unrealizedPnL, lastAnalysis, tickEntry } = action.payload;
      const bot = state.list.find(b => b._id === botId);
      if (bot) {
        bot.realtimePrice = currentPrice;
        bot.openPositionsCount = openPositions;
        if (status) bot.status = status;
        bot.unrealizedPnL = unrealizedPnL;
      }
      if (state.detail?.bot?._id === botId) {
        state.detail.bot.realtimePrice = currentPrice;
        if (status) state.detail.bot.status = status;
        if (lastAnalysis) state.detail.bot.lastAnalysis = lastAnalysis;
        if (tickEntry) {
          if (!state.detail.bot.tickLog) state.detail.bot.tickLog = [];
          state.detail.bot.tickLog.push(tickEntry);
          if (state.detail.bot.tickLog.length > 10) state.detail.bot.tickLog.shift();
        }
      }
    },

    // Update position prices in real time
    updatePositionPrice: (state, action) => {
      const { positionId, currentPrice } = action.payload;
      const pos = state.openPositions.find(p => p._id === positionId);
      if (pos) {
        pos.currentPrice = currentPrice;
        pos.unrealizedPnL = (currentPrice - pos.entryPrice) * pos.amount - pos.entryFee;
        pos.unrealizedPnLPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      }
    }
  },
  extraReducers: (builder) => {
    // fetchBots
    builder
      .addCase(fetchBots.pending, (state) => { state.loading.list = true; state.error = null; })
      .addCase(fetchBots.fulfilled, (state, action) => {
        state.loading.list = false;
        state.list = action.payload.bots || [];
      })
      .addCase(fetchBots.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });

    // fetchBotDetail
    builder
      .addCase(fetchBotDetail.pending, (state) => { state.loading.detail = true; })
      .addCase(fetchBotDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.detail = action.payload;
        state.openPositions = action.payload.openPositions || [];
        state.trades = action.payload.recentTrades || [];
      })
      .addCase(fetchBotDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      });

    // createBot
    builder
      .addCase(createBot.pending, (state) => { state.loading.action = true; state.error = null; })
      .addCase(createBot.fulfilled, (state, action) => {
        state.loading.action = false;
        state.list.unshift(action.payload);
      })
      .addCase(createBot.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });

    // updateBot
    builder
      .addCase(updateBot.fulfilled, (state, action) => {
        const idx = state.list.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.detail?.bot?._id === action.payload._id) state.detail.bot = action.payload;
      });

    // deleteBot
    builder
      .addCase(deleteBot.fulfilled, (state, action) => {
        state.list = state.list.filter(b => b._id !== action.payload);
      });

    // startBot / stopBot
    builder
      .addCase(startBot.pending, (state) => { state.loading.action = true; })
      .addCase(startBot.fulfilled, (state, action) => {
        state.loading.action = false;
        const bot = state.list.find(b => b._id === action.payload);
        if (bot) bot.status = 'running';
      })
      .addCase(startBot.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });

    builder
      .addCase(stopBot.pending, (state) => { state.loading.action = true; })
      .addCase(stopBot.fulfilled, (state, action) => {
        state.loading.action = false;
        const bot = state.list.find(b => b._id === action.payload);
        if (bot) bot.status = 'stopped';
      })
      .addCase(stopBot.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });

    // fetchBotTrades
    builder
      .addCase(fetchBotTrades.pending, (state) => { state.loading.trades = true; })
      .addCase(fetchBotTrades.fulfilled, (state, action) => {
        state.loading.trades = false;
        state.trades = action.payload.trades || [];
        state.tradesMeta = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchBotTrades.rejected, (state) => { state.loading.trades = false; });

    // fetchBotPositions
    builder
      .addCase(fetchBotPositions.fulfilled, (state, action) => {
        state.openPositions = action.payload.positions || [];
      });

    // fetchStrategies
    builder
      .addCase(fetchStrategies.pending, (state) => { state.loading.strategies = true; })
      .addCase(fetchStrategies.fulfilled, (state, action) => {
        state.loading.strategies = false;
        state.strategies = action.payload || [];
      })
      .addCase(fetchStrategies.rejected, (state) => { state.loading.strategies = false; });
  }
});

export const { clearBotError, updateBotRealtime, updatePositionPrice } = botSlice.actions;
export default botSlice.reducer;
