import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { applyThemeClass } from './redux/useTheme';
import CryptoArbitrage from './components/Cryptoarbitrage/Cryptoarbitrage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import WalletProvider from './components/Web3/WalletProvider';
import { SocketProvider } from './components/socket/SocketContext';
import Settings from './components/Settings/Settings';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BotDashboard from './pages/BotDashboard';
import CreateBot from './pages/CreateBot';
import BotDetail from './pages/BotDetail';
import DemoAccount from './pages/DemoAccount';
import StrategyLibrary from './pages/StrategyLibrary';
import Signals from './pages/Signals';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

function AppInner() {
  const profileTheme = useSelector(state => state.user.profile?.preferences?.theme);
  const authTheme    = useSelector(state => state.auth.user?.preferences?.theme);

  // Apply from localStorage immediately (avoids flash before Redux loads)
  useEffect(() => {
    applyThemeClass(localStorage.getItem('theme') || 'dark');
  }, []);

  // Re-apply whenever the user's saved theme arrives from the DB
  useEffect(() => {
    const theme = profileTheme || authTheme;
    if (theme) {
      localStorage.setItem('theme', theme);
      applyThemeClass(theme);
    }
  }, [profileTheme, authTheme]);

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-brandDark-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bots" element={<BotDashboard />} />
              <Route path="/bots/create" element={<CreateBot />} />
              <Route path="/bots/:id" element={<BotDetail />} />
              <Route path="/demo" element={<DemoAccount />} />
              <Route path="/strategies" element={<StrategyLibrary />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/arbitrage" element={<CryptoArbitrage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          className="mt-16"
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <WalletProvider>
          <AppInner />
        </WalletProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
