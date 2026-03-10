/**
 * AuthCallback.jsx
 * Landing page for the Google OAuth redirect.
 *
 * Backend redirects here after Google OAuth with:
 *   /auth/callback?token=...&refreshToken=...&userId=...&email=...&role=...&fullName=...
 *
 * We store the token in Redux + localStorage then send the user to /dashboard.
 * On failure (e.g. ?error=google_auth_failed from /login redirect), we show an error.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setGoogleSession } from '../redux/slices/authSlice';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [error, setError]   = useState('');

  useEffect(() => {
    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const email        = searchParams.get('email');
    const role         = searchParams.get('role') || 'user';
    const fullName     = searchParams.get('fullName') || '';
    const userId       = searchParams.get('userId');
    const err          = searchParams.get('error');

    if (err || !token) {
      setError('Google sign-in failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Store tokens
    localStorage.setItem('refreshToken', refreshToken || '');

    const user = { id: userId, email, role, fullName, preferences: {} };

    dispatch(setGoogleSession({ token, user, role }));

    // Small delay to let Redux settle, then redirect
    setTimeout(() => navigate('/dashboard'), 100);
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-brandDark-900">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-red-500 font-medium">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to login…</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Signing you in with Google…</p>
          </>
        )}
      </div>
    </div>
  );
}
