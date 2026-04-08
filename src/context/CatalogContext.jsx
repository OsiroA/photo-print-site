import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultCatalog } from '../data/catalog';

const CatalogContext = createContext(null);

function normalizeCatalog(catalog) {
  return {
    fineArtThemes: Array.isArray(catalog?.fineArtThemes) ? catalog.fineArtThemes : defaultCatalog.fineArtThemes,
    products: Array.isArray(catalog?.products) ? catalog.products : defaultCatalog.products,
  };
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(defaultCatalog);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch('/api/catalog');
        if (!response.ok) {
          throw new Error('Unable to fetch catalog.');
        }

        const data = await response.json();

        if (!cancelled) {
          setCatalog(normalizeCatalog(data.catalog));
        }
      } catch (error) {
        console.error('Unable to load catalog.', error);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      catalog,
      setCatalog,
      isLoaded,
    }),
    [catalog, isLoaded],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider.');
  }

  return context;
}
