import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { applyThemeClass } from './redux/useTheme';
import OnboardingTour, { TOUR_KEY } from './components/Tour/OnboardingTour';
import CryptoArbitrage from './components/Cryptoarbitrage/Cryptoarbitrage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
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
import Signals from './pages/Signals';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Pricing from './pages/Pricing';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import Support from './pages/Support';
import Account from './pages/Account';
import Guide from './pages/Guide';
import Trade4Me from './pages/Trade4Me';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

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
  const token        = useSelector(state => state.auth.token);
  const [showTour, setShowTour] = useState(false);

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

  // Show onboarding tour once on first login
  useEffect(() => {
    if (token && !localStorage.getItem(TOUR_KEY)) {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return (
    <Router>
      <SocketProvider>
      <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-brandDark-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bots" element={<BotDashboard />} />
              <Route path="/bots/create" element={<CreateBot />} />
              <Route path="/bots/:id" element={<BotDetail />} />
              <Route path="/demo" element={<DemoAccount />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/arbitrage" element={<CryptoArbitrage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/tickets/:id" element={<Support />} />
              <Route path="/trade4me" element={<Trade4Me />} />
              <Route path="/account" element={<Account />} />
              <Route path="/guide" element={<Guide />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {showTour && (
          <OnboardingTour
            onDone={() => {
              localStorage.setItem(TOUR_KEY, '1');
              setShowTour(false);
            }}
          />
        )}

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
      </SocketProvider>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
