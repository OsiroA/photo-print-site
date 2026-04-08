import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { SiteContentProvider } from './context/SiteContentContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteContentProvider>
      <CatalogProvider>
        <App />
      </CatalogProvider>
    </SiteContentProvider>
  </StrictMode>,
);
