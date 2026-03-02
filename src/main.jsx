import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import  store  from './redux/store.js'
import './index.css'
import App from './App.jsx'

// Initialize theme — navy dark mode is the default
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');

  // Navy dark mode is always active
  document.documentElement.classList.add('dark');

  if (savedTheme === 'darkest') {
    // Pure black mode was explicitly chosen
    document.documentElement.classList.add('darkest');
  } else {
    document.documentElement.classList.remove('darkest');
    if (!savedTheme) {
      localStorage.setItem('theme', 'dark');
    }
  }
};

// Initialize theme before rendering
initializeTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
