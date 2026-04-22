import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const fetchCEXListings = createAsyncThunk(
  'listings/fetchCEX',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get('/listings/cex');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchDEXListings = createAsyncThunk(
  'listings/fetchDEX',
  async (network = 'all', { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get('/listings/dex', { params: { network } });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchCoinDetail = createAsyncThunk(
  'listings/fetchCoinDetail',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get(`/listings/coin/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchCoinNews = createAsyncThunk(
  'listings/fetchCoinNews',
  async (symbol, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.get(`/listings/news/${symbol}`);
      return data.data;
    } catch (err) {
      return rejectWithValue([]);
    }
  },
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState: {
    mode:         'cex', // 'cex' | 'dex'
    dexNetwork:   'all',
    cexCoins:     [],
    dexPools:     [],
    selectedCoin: null,
    coinNews:     [],
    loading:      false,
    detailLoading: false,
    newsLoading:  false,
    error:        null,
  },
  reducers: {
    setMode(state, action)       { state.mode = action.payload; },
    setDexNetwork(state, action) { state.dexNetwork = action.payload; },
    clearSelectedCoin(state)     { state.selectedCoin = null; state.coinNews = []; },
    clearListingsError(state)    { state.error = null; },
  },
  extraReducers: builder => {
    builder
      // CEX
      .addCase(fetchCEXListings.pending,   state => { state.loading = true; state.error = null; })
      .addCase(fetchCEXListings.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })
      .addCase(fetchCEXListings.fulfilled, (state, a) => { state.loading = false; state.cexCoins = a.payload; })
      // DEX
      .addCase(fetchDEXListings.pending,   state => { state.loading = true; state.error = null; })
      .addCase(fetchDEXListings.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })
      .addCase(fetchDEXListings.fulfilled, (state, a) => { state.loading = false; state.dexPools = a.payload; })
      // Coin detail
      .addCase(fetchCoinDetail.pending,   state => { state.detailLoading = true; })
      .addCase(fetchCoinDetail.rejected,  state => { state.detailLoading = false; })
      .addCase(fetchCoinDetail.fulfilled, (state, a) => { state.detailLoading = false; state.selectedCoin = a.payload; })
      // Coin news
      .addCase(fetchCoinNews.pending,   state => { state.newsLoading = true; })
      .addCase(fetchCoinNews.rejected,  state => { state.newsLoading = false; })
      .addCase(fetchCoinNews.fulfilled, (state, a) => { state.newsLoading = false; state.coinNews = a.payload; });
  },
});

export const { setMode, setDexNetwork, clearSelectedCoin, clearListingsError } = listingsSlice.actions;
export default listingsSlice.reducer;
