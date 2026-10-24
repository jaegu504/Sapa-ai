import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionGlobalConfig } from 'motion/react';
import { App } from './App';
import './index.css';

// Dev only: `?noanim` turns animations off for screenshot checks in a background browser tab.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('noanim')) {
  MotionGlobalConfig.skipAnimations = true;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
