import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Initiate checkout — returns { paymentUrl }
export const createCheckout = createAsyncThunk(
  'subscription/checkout',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.post('/payments/checkout');
      return res.data.data; // { chargeId, paymentUrl, provider, amountUSD }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch public plan pricing (no auth required)
export const fetchPublicSettings = createAsyncThunk(
  'subscription/publicSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/admin/public-settings');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch subscription status + referral info + payment history
export const fetchSubscriptionStatus = createAsyncThunk(
  'subscription/status',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.get('/payments/status');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    // Checkout
    checkoutUrl:      null,
    checkoutProvider: null,
    checkoutLoading:  false,
    checkoutError:    null,

    // Status
    isPremium:       false,
    subscription:    null,   // { plan, status, expiresAt, startedAt, paymentProvider }
    referral:        null,   // { code, referrals, totalEarned, pendingCredit }
    credits:         0,
    paymentHistory:  [],
    statusLoading:   false,
    statusError:     null,

    // Public plan settings
    premiumPriceUSD:     20,
    premiumDurationDays: 30,
    referralRewardUSD:   5,
  },
  reducers: {
    clearCheckout: (state) => {
      state.checkoutUrl    = null;
      state.checkoutProvider = null;
      state.checkoutError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSettings.fulfilled, (state, action) => {
        state.premiumPriceUSD     = action.payload.premiumPriceUSD     ?? 20;
        state.premiumDurationDays = action.payload.premiumDurationDays ?? 30;
        state.referralRewardUSD   = action.payload.referralRewardUSD   ?? 5;
      });

    builder
      .addCase(createCheckout.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError   = null;
        state.checkoutUrl     = null;
      })
      .addCase(createCheckout.fulfilled, (state, action) => {
        state.checkoutLoading  = false;
        state.checkoutUrl      = action.payload.paymentUrl;
        state.checkoutProvider = action.payload.provider;
      })
      .addCase(createCheckout.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError   = action.payload;
      });

    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError   = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.statusLoading   = false;
        state.isPremium       = action.payload.isPremium;
        state.subscription    = action.payload.subscription;
        state.referral        = action.payload.referral;
        state.credits         = action.payload.credits ?? 0;
        state.paymentHistory  = action.payload.paymentHistory ?? [];
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError   = action.payload;
      });
  },
});

export const { clearCheckout } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
