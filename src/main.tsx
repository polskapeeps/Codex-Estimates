import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { rateBookRepo, ratesRepo } from './data/repositories';
import { initializeCloudSync } from './data/cloud/cloudSync';
import './index.css';

// Auto-update the service worker so the app refreshes its cache after deploys.
registerSW({ immediate: true });

// Seed the editable stores once (outside any liveQuery read context).
void Promise.all([ratesRepo.ensureSeeded(), rateBookRepo.ensureSeeded()])
  .then(() => initializeCloudSync())
  .catch((error) => {
    console.error('App initialization failed', error);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
