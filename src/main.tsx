import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { rateBookRepo, ratesRepo } from './data/repositories';
import './index.css';

// Auto-update the service worker so the app refreshes its cache after deploys.
registerSW({ immediate: true });

// Seed the editable stores once (outside any liveQuery read context).
void ratesRepo.ensureSeeded();
void rateBookRepo.ensureSeeded();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
