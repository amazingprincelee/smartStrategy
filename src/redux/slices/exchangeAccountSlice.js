import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const fetchAccounts = createAsyncThunk('exchangeAccounts/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/exchange-accounts');
    return res.data.data.accounts;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchSupportedExchanges = createAsyncThunk('exchangeAccounts/supported', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.get('/exchange-accounts/supported');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const addAccount = createAsyncThunk('exchangeAccounts/add', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.post('/exchange-accounts', data);
    return res.data.data.account;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const testAccount = createAsyncThunk('exchangeAccounts/test', async (id, { rejectWithValue }) => {
  try {
    const res = await authAPI.post(`/exchange-accounts/${id}/test`);
    return { id, testResult: res.data.data.testResult };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const removeAccount = createAsyncThunk('exchangeAccounts/remove', async (id, { rejectWithValue }) => {
  try {
    await authAPI.delete(`/exchange-accounts/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchAccountBalance = createAsyncThunk('exchangeAccounts/balance', async (id, { rejectWithValue }) => {
  try {
    const res = await authAPI.get(`/exchange-accounts/${id}/balance`);
    return { id, balances: res.data.data.balances, fetchedAt: res.data.data.fetchedAt };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const exchangeAccountSlice = createSlice({
  name: 'exchangeAccounts',
  initialState: {
    accounts: [],
    supportedExchanges: { popular: [], all: [] },
    loading: { list: false, action: false, test: false, balance: false },
    testResult: null,
    balances: {},   // { [accountId]: { balances: [], fetchedAt, error } }
    error: null,
  },
  reducers: {
    clearExchangeError: (state) => { state.error = null; },
    clearTestResult: (state) => { state.testResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => { state.loading.list = true; })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading.list = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSupportedExchanges.fulfilled, (state, action) => {
        state.supportedExchanges = action.payload;
      });

    builder
      .addCase(addAccount.pending, (state) => { state.loading.action = true; state.error = null; })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.loading.action = false;
        state.accounts.unshift(action.payload);
      })
      .addCase(addAccount.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      });

    builder
      .addCase(testAccount.pending, (state) => { state.loading.test = true; })
      .addCase(testAccount.fulfilled, (state, action) => {
        state.loading.test = false;
        state.testResult = action.payload.testResult;
        const acc = state.accounts.find(a => a._id === action.payload.id);
        if (acc) acc.isValid = action.payload.testResult.isValid;
      })
      .addCase(testAccount.rejected, (state, action) => {
        state.loading.test = false;
        state.error = action.payload;
      });

    builder
      .addCase(removeAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(a => a._id !== action.payload);
        delete state.balances[action.payload];
      });

    builder
      .addCase(fetchAccountBalance.pending, (state, action) => {
        state.loading.balance = true;
        const id = action.meta.arg;
        state.balances[id] = { ...state.balances[id], error: null };
      })
      .addCase(fetchAccountBalance.fulfilled, (state, action) => {
        state.loading.balance = false;
        const { id, balances, fetchedAt } = action.payload;
        state.balances[id] = { balances, fetchedAt, error: null };
      })
      .addCase(fetchAccountBalance.rejected, (state, action) => {
        state.loading.balance = false;
        // store the error keyed by account id so we can show it per-account
        // action.meta.arg is the account id passed to the thunk
      });
  }
});

export const { clearExchangeError, clearTestResult } = exchangeAccountSlice.actions;
export default exchangeAccountSlice.reducer;
