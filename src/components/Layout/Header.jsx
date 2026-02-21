import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  Bot
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../redux/useTheme';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { token, user } = useSelector(state => state.auth);
  const { theme, toggleTheme, isDark } = useTheme();
  const isAuthenticated = !!token; // Derive authentication status from token

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsUserDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsUserDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-lg dark:bg-brandDark-900 dark:border-brandDark-700">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Mobile Menu Button + Logo */}
            <div className="flex items-center space-x-3">
              {/* Mobile Hamburger Menu - Only show when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={onMenuToggle}
                  className="p-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brandDark-700"
                  aria-label="Toggle menu"
                >
                  {isSidebarOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              )}

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
                {/* Icon Mark */}
                <div className="relative flex-shrink-0">
                  <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400/40 transition-transform duration-200 group-hover:scale-105">
                    <Bot className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-white" strokeWidth={1.75} />
                  </div>
                  {/* Live pulse indicator */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 border-[1.5px] border-white dark:border-brandDark-900" />
                  </span>
                </div>

                {/* Wordmark */}
                <span className="text-lg font-bold sm:text-xl tracking-tight leading-none select-none">
                  <span className="text-gray-900 dark:text-white">Smart</span>
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">Strategy</span>
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation - Hidden on mobile
            <nav className="items-center hidden space-x-6 md:flex">
              {isAuthenticated && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="transition-colors text-brandDark-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/arbitrage" 
                    className="relative transition-colors text-brandDark-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                  >
                    Arbitrage
                    <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </Link>
                  <Link 
                    to="/create-vault" 
                    className="transition-colors text-brandDark-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                  >
                    Create Vault
                  </Link>
                </>
              )}
            </nav> */}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-brandDark-700"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-brandDark-600 dark:text-gray-300" />
                )}
              </button>

              {/* Notifications - Hidden on small mobile */}
              {isAuthenticated && (
                <div className="hidden sm:block">
                  <NotificationDropdown />
                </div>
              )}

              {/* User Profile */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 text-brandDark-700 dark:text-gray-300"
                  >
                    <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                      <span className="text-sm font-semibold">
                        {user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="hidden text-sm font-medium md:block">
                      {user?.profile?.firstName || 'User'}
                    </span>
                    <ChevronDown className="hidden w-4 h-4 md:block" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 z-20 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-brandDark-800 dark:border-brandDark-700">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-brandDark-700">
                          <p className="text-sm font-medium text-brandDark-900 dark:text-white">
                            {user?.profile?.firstName} {user?.profile?.lastName}
                          </p>
                          <p className="text-xs truncate text-brandDark-600 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={handleProfileClick}
                            className="flex items-center w-full px-4 py-2 text-sm transition-colors text-brandDark-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brandDark-700"
                          >
                            <User className="w-4 h-4 mr-3" />
                            Profile
                          </button>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center w-full px-4 py-2 text-sm transition-colors text-brandDark-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brandDark-700"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                          </Link>
                        </div>
                        <div className="py-1 border-t border-gray-200 dark:border-brandDark-700">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-brandDark-700"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Login/Signup for non-authenticated users */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-medium transition-colors text-brandDark-700 dark:text-gray-300 hover:text-primary-500"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;