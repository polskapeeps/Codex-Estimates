import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HomePage } from '../features/dashboard/HomePage';
import { JobsPage } from '../features/projects/JobsPage';
import { JobDetailPage } from '../features/projects/JobDetailPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { ClientDetailPage } from '../features/clients/ClientDetailPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { EstimateEditorPage } from '../features/estimates/EstimateEditorPage';
import { EstimatePreviewPage } from '../features/estimates/EstimatePreviewPage';
import { DocumentBuilderPage } from '../features/documents/DocumentBuilderPage';
import { LibraryPage } from '../features/general/LibraryPage';
import { NotFoundPage } from '../features/NotFoundPage';
import { InvoicesPage } from '../features/invoices/InvoicesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'jobs/:projectId', element: <JobDetailPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:clientId', element: <ClientDetailPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'quote/new', element: <DocumentBuilderPage /> },
      { path: 'estimate/new', element: <EstimateEditorPage /> },
      { path: 'estimate/:estimateId', element: <EstimatePreviewPage /> },
      { path: 'estimate/:estimateId/edit', element: <EstimateEditorPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
