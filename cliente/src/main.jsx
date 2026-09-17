import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import AplicacionPrincipal from './App.jsx';
import './index.css';

const DSN_SENTRY = import.meta.env.VITE_SENTRY_DSN || 'https://1ff59d130a54e539ce84c7d93175b0a4@o4512093978361856.ingest.us.sentry.io/4512093986095104';

if (DSN_SENTRY) {
  Sentry.init({ dsn: DSN_SENTRY });
}

ReactDOM.createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    <AplicacionPrincipal />
  </React.StrictMode>
);
