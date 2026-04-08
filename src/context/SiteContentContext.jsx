import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultSiteContent } from '../data/siteContent';

const STORAGE_KEY = 'photo-print-site-content';

const SiteContentContext = createContext(null);

function mergeContent(savedContent) {
  if (!savedContent) {
    return defaultSiteContent;
  }

  return {
    ...defaultSiteContent,
    ...savedContent,
    brand: { ...defaultSiteContent.brand, ...savedContent.brand },
    home: { ...defaultSiteContent.home, ...savedContent.home },
    about: {
      ...defaultSiteContent.about,
      ...savedContent.about,
      paragraphs:
        savedContent.about?.paragraphs?.length
          ? savedContent.about.paragraphs
          : defaultSiteContent.about.paragraphs,
    },
    socials: { ...defaultSiteContent.socials, ...savedContent.socials },
  };
}

export function SiteContentProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [content, setContent] = useState(() => {
    try {
      const savedContent = window.localStorage.getItem(STORAGE_KEY);
      if (savedContent) {
        return mergeContent(JSON.parse(savedContent));
      }
    } catch (error) {
      console.error('Unable to load saved site content.', error);
    }

    return defaultSiteContent;
  });

  useEffect(() => {
    let isCancelled = false;

    async function syncContent() {
      try {
        const response = await fetch('/api/site-content');

        if (!response.ok) {
          throw new Error('Unable to fetch site content.');
        }

        const data = await response.json();

        if (!isCancelled) {
          const mergedContent = mergeContent(defaultSiteContent, data.content);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedContent));
          setContent(mergedContent);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Unable to sync remote site content.', error);
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    syncContent();

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateContent = (section, value) => {
    setContent((currentContent) => {
      const nextContent = {
        ...currentContent,
        [section]: value,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextContent));
      return nextContent;
    });
  };

  const resetContent = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setContent(defaultSiteContent);
  };

  const contextValue = useMemo(
    () => ({
      content,
      isLoaded,
      setContent,
      updateContent,
      resetContent,
    }),
    [content, isLoaded],
  );

  return (
    <SiteContentContext.Provider value={contextValue}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider.');
  }

  return context;
}
