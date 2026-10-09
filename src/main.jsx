import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

async function start() {
  const mode = import.meta.env.VITE_APP_MODE;
  if (!['demo', 'operational'].includes(mode)) throw new Error('Set VITE_APP_MODE explicitly to demo or operational.');
  const module = mode === 'operational'
    ? await import('./OperationalApp.jsx')
    : await import('./App.jsx');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>{React.createElement(module.default)}</React.StrictMode>,
  );
}

start().catch(error => {
  document.getElementById('root').innerHTML = '<main style="font:16px sans-serif;padding:2rem"><h1>Jewellery OS could not start</h1><p>Operational mode does not fall back to demo records.</p></main>';
  console.error('[startup]', error);
});
