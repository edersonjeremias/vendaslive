import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { PermissionsProvider } from './contexts/PermissionsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <PermissionsProvider>
          <App />
        </PermissionsProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>
);