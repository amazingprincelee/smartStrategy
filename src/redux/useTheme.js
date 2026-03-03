import { useDispatch, useSelector } from 'react-redux';
import { updateTheme } from './slices/userSlice';

// 'dark'    = navy theme (the app's default look)
// 'darkest' = pure black theme (user-activated)
// No light mode exists — .dark class is always present on <html>

export function applyThemeClass(theme) {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.toggle('darkest', theme === 'darkest');
}

export const useTheme = () => {
  const dispatch = useDispatch();

  // Derive current theme from Redux so all components stay in sync:
  // profile (fetched after login) → auth user (from login payload) → localStorage fallback
  const profileTheme = useSelector(state => state.user.profile?.preferences?.theme);
  const authTheme    = useSelector(state => state.auth.user?.preferences?.theme);
  const theme = profileTheme || authTheme || localStorage.getItem('theme') || 'dark';

  const applyTheme = (newTheme) => {
    localStorage.setItem('theme', newTheme);
    applyThemeClass(newTheme);
    // Persist to DB — thunk silently handles 401 if user is not logged in
    dispatch(updateTheme(newTheme));
  };

  const toggleTheme = () => {
    applyTheme(theme === 'darkest' ? 'dark' : 'darkest');
  };

  return {
    theme,
    toggleTheme,
    applyTheme,
    isBlack: theme === 'darkest',  // pure black mode active
    isDark:  theme !== 'darkest',  // navy mode active (default)
    isLight: false,                // no white/light mode exists
  };
};
