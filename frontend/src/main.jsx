import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { store } from './store';
import App from './App';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <HashRouter>
          <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#2d1b26',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(200,73,106,0.15)',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: '#c8496a', secondary: '#fff' },
            },
          }}
        />
        </HashRouter>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);
