import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import arbitrageReducer from './slices/arbitrageslice';
import settingsReducer from './slices/settingsSlice';
import botReducer from './slices/botSlice';
import exchangeAccountReducer from './slices/exchangeAccountSlice';
import demoReducer from './slices/demoSlice';

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
  },
});

export default store