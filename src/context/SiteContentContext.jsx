import { createContext, useContext, useMemo, useState } from 'react';
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
      updateContent,
      resetContent,
    }),
    [content],
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
