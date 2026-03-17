import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { registerUser } from '../redux/slices/authSlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const schema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]*$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  acceptTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const termsAccepted = watch('acceptTerms');

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword and acceptTerms from the data sent to backend
      const { confirmPassword, acceptTerms, ...registrationData } = data;
      if (refCode) registrationData.referralCode = refCode;
      await dispatch(registerUser(registrationData)).unwrap();
      navigate('/login');
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-brandDark-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join SmartStrategy and start trading smarter
          </p>
        </div>

        {/* Register Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="sr-only">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('fullName')}
                  type="text"
                  autoComplete="name"
                  className="relative block w-full px-3 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg appearance-none dark:border-brandDark-600 dark:placeholder-gray-400 dark:text-white dark:bg-brandDark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="relative block w-full px-3 py-3 pl-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg appearance-none dark:border-brandDark-600 dark:placeholder-gray-400 dark:text-white dark:bg-brandDark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="relative block w-full px-3 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg appearance-none dark:border-brandDark-600 dark:placeholder-gray-400 dark:text-white dark:bg-brandDark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="relative block w-full px-3 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg appearance-none dark:border-brandDark-600 dark:placeholder-gray-400 dark:text-white dark:bg-brandDark-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className={`rounded-xl border p-4 transition-colors ${errors.acceptTerms ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'}`}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  {...register('acceptTerms')}
                  type="checkbox"
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${termsAccepted ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-600 group-hover:border-blue-400'}`}>
                  {termsAccepted && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-300 leading-relaxed">
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
                . I understand that SmartStrategy provides informational signals only and is not financial advice.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              {typeof error === 'object' && error.type === 'validation' && error.details ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
                  <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                    {error.details.map((err, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        <span><strong>{err.field}:</strong> {err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {typeof error === 'object' ? error.formattedMessage || error.message : error}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors border border-transparent rounded-lg group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-brandDark-600" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gray-50 dark:bg-brandDark-900 text-gray-400">or</span>
            </div>
          </div>

          {/* Google Sign-Up */}
          <a
            href={`${import.meta.env.VITE_LOCAL_API_URL || import.meta.env.VITE_API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-brandDark-600 bg-white dark:bg-brandDark-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-brandDark-700 transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium transition-colors text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;