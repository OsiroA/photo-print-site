import { useEffect, useMemo, useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import './Admin.css';

export default function Admin() {
  const { content, isLoaded, setContent, resetContent } = useSiteContent();
  const [savedMessage, setSavedMessage] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const aboutParagraphs = useMemo(
    () => content.about.paragraphs.join('\n\n'),
    [content.about.paragraphs],
  );

  useEffect(() => {
    let isCancelled = false;

    async function checkSession() {
      try {
        const response = await fetch('/api/admin-session');
        const data = await response.json();

        if (!isCancelled) {
          setIsAuthenticated(Boolean(data.authenticated));
        }
      } catch (error) {
        console.error('Unable to check CMS session.', error);
      } finally {
        if (!isCancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Unable to sign in.');
        return;
      }

      setPassword('');
      setIsAuthenticated(true);
      setSavedMessage('');
    } catch (error) {
      console.error('Unable to log into CMS.', error);
      setAuthError('Unable to sign in right now.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin-session', { method: 'DELETE' });
    setIsAuthenticated(false);
    setSavedMessage('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSavedMessage('');
    const formData = new FormData(event.currentTarget);
    const nextContent = {
      brand: {
        photographerName: formData.get('photographerName').trim(),
        siteTitle: formData.get('siteTitle').trim(),
        navLabel: formData.get('navLabel').trim(),
      },
      home: {
        headline: formData.get('headline').trim(),
        subheading: formData.get('subheading').trim(),
        primaryCtaLabel: formData.get('primaryCtaLabel').trim(),
      },
      about: {
        title: formData.get('aboutTitle').trim(),
        intro: formData.get('aboutIntro').trim(),
        paragraphs: formData
          .get('aboutParagraphs')
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
      },
      socials: {
        instagramUrl: formData.get('instagramUrl').trim(),
        instagramLabel: formData.get('instagramLabel').trim(),
        tiktokUrl: formData.get('tiktokUrl').trim(),
        tiktokLabel: formData.get('tiktokLabel').trim(),
      },
    };

    try {
      const response = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextContent),
      });

      const data = await response.json();

      if (!response.ok) {
        setSavedMessage(data.error || 'Unable to save content right now.');
        return;
      }

      setContent(data.content);
      window.localStorage.setItem('photo-print-site-content', JSON.stringify(data.content));
      setSavedMessage('Saved to the shared CMS. The live site now uses this content.');
    } catch (error) {
      console.error('Unable to save CMS content.', error);
      setSavedMessage('Unable to save content right now.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingSession || !isLoaded) {
    return (
      <main className="admin-page">
        <section className="admin-shell">
          <div className="admin-card">
            <h2>Loading studio</h2>
            <p>Checking your session and loading the latest site content.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-page">
        <section className="admin-shell">
          <div className="admin-intro">
            <p className="admin-eyebrow">Studio</p>
            <h1>Client CMS login</h1>
            <p>
              Sign in with the CMS password to edit the live text content shared across devices.
            </p>
          </div>

          <form className="admin-auth" onSubmit={handleLogin}>
            <label>
              CMS password
              <input
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button type="submit" className="admin-primary">Sign in</button>
            {authError ? <p className="admin-error">{authError}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-intro">
          <p className="admin-eyebrow">Studio</p>
          <h1>Launch-ready content editor</h1>
          <p>
            You can now edit the shared live copy here. Image upload and collection management can come next.
          </p>
          <p className="admin-note">
            This version saves shared text content through your deployed project and protects access with a CMS password.
          </p>
        </div>

        <form className="admin-form" onSubmit={handleSave}>
          <section className="admin-card">
            <h2>Brand</h2>
            <label>
              Photographer name
              <input name="photographerName" defaultValue={content.brand.photographerName} />
            </label>
            <label>
              Site title
              <input name="siteTitle" defaultValue={content.brand.siteTitle} />
            </label>
            <label>
              Navigation label
              <input name="navLabel" defaultValue={content.brand.navLabel} />
            </label>
          </section>

          <section className="admin-card">
            <h2>Home</h2>
            <label>
              Headline
              <input name="headline" defaultValue={content.home.headline} />
            </label>
            <label>
              Subheading
              <textarea name="subheading" defaultValue={content.home.subheading} rows="4" />
            </label>
            <label>
              Primary button label
              <input name="primaryCtaLabel" defaultValue={content.home.primaryCtaLabel} />
            </label>
          </section>

          <section className="admin-card">
            <h2>About</h2>
            <label>
              Page title
              <input name="aboutTitle" defaultValue={content.about.title} />
            </label>
            <label>
              Intro line
              <textarea name="aboutIntro" defaultValue={content.about.intro} rows="3" />
            </label>
            <label>
              Paragraphs
              <textarea name="aboutParagraphs" defaultValue={aboutParagraphs} rows="10" />
            </label>
          </section>

          <section className="admin-card">
            <h2>Social links</h2>
            <label>
              Instagram URL
              <input name="instagramUrl" defaultValue={content.socials.instagramUrl} />
            </label>
            <label>
              Instagram label
              <input name="instagramLabel" defaultValue={content.socials.instagramLabel} />
            </label>
            <label>
              TikTok URL
              <input name="tiktokUrl" defaultValue={content.socials.tiktokUrl} />
            </label>
            <label>
              TikTok label
              <input name="tiktokLabel" defaultValue={content.socials.tiktokLabel} />
            </label>
          </section>

          <div className="admin-actions">
            <button type="submit" className="admin-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => {
                resetContent();
                setSavedMessage('Reset to the default launch copy.');
              }}
            >
              Reset defaults
            </button>
            <button
              type="button"
              className="admin-secondary"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

          {savedMessage ? <p className="admin-feedback">{savedMessage}</p> : null}
        </form>
      </section>
    </main>
  );
}
