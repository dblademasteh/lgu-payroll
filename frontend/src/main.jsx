import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/sora';
import '@fontsource-variable/jetbrains-mono';

// Apply saved theme on load
const savedTheme = localStorage.getItem('lgu-payroll-theme');
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.dataset.theme = 'dark';
}

// Apply saved scales
try {
  const saved = JSON.parse(localStorage.getItem('lgu-payroll-settings') || '{}');
  if (saved.fontScale) document.documentElement.style.setProperty('--font-scale', `${saved.fontScale}%`);
  if (saved.uiScale) document.documentElement.style.setProperty('--ui-scale', `${saved.uiScale}%`);
} catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);