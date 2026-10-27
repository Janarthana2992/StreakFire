import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { cloudConfigured } from './lib/firebase-config';
import './index.css';

if (cloudConfigured) void import('./lib/cloud').then((m) => m.startCloud());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
