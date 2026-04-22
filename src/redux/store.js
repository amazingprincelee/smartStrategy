import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import arbitrageReducer from './slices/arbitrageslice';
import settingsReducer from './slices/settingsSlice';
import botReducer from './slices/botSlice';
import exchangeAccountReducer from './slices/exchangeAccountSlice';
import demoReducer from './slices/demoSlice';
import signalReducer from './slices/signalSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import adminReducer from './slices/adminSlice';
import supportReducer from './slices/supportSlice';
import withdrawalReducer from './slices/withdrawalSlice';
import investmentReducer from './slices/investmentSlice';
import alphaReducer from './slices/alphaSlice';
import listingsReducer from './slices/newListingsSlice';
import tradeCallReducer from './slices/tradeCallSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    dashboard: dashboardReducer,
    arbitrage: arbitrageReducer,
    settings: settingsReducer,
    bots: botReducer,
    exchangeAccounts: exchangeAccountReducer,
    demo: demoReducer,
    signals: signalReducer,
    subscription: subscriptionReducer,
    admin: adminReducer,
    support: supportReducer,
    withdrawals: withdrawalReducer,
    investment: investmentReducer,
    alpha:      alphaReducer,
    listings:   listingsReducer,
    tradeCalls: tradeCallReducer,
  },
});

export default store