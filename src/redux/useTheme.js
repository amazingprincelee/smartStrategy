import { useState } from 'react';

export const useTheme = () => {
  // 'dark'    = navy theme (the app's default look)
  // 'darkest' = pure black theme (user-activated)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'darkest' ? 'dark' : 'darkest';
    applyTheme(newTheme);
  };

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // .dark is always present — it's the base navy theme
    document.documentElement.classList.add('dark');

    if (newTheme === 'darkest') {
      document.documentElement.classList.add('darkest');
    } else {
      document.documentElement.classList.remove('darkest');
    }
  };

  return {
    theme,
    toggleTheme,
    isBlack: theme === 'darkest',   // pure black mode active
    isDark: theme !== 'darkest',    // navy mode active (default)
    isLight: false,                 // no white/light mode exists
  };
};
