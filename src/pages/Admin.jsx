import { useEffect, useMemo, useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { useCatalog } from '../context/CatalogContext';
import './Admin.css';

const CONTENT_STORAGE_KEY = 'photo-print-site-content';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyThemeForm() {
  return {
    slug: '',
    title: '',
    description: '',
    coverImage: '',
  };
}

function emptyProductForm() {
  return {
    id: '',
    title: '',
    collection: 'fine-art',
    theme: '',
    image: '',
    sizes: {
      A4: '',
      A3: '',
      A2: '',
    },
  };
}

export default function Admin() {
  const { content, isLoaded, setContent, resetContent } = useSiteContent();
  const { catalog, setCatalog, isLoaded: isCatalogLoaded } = useCatalog();
  const [savedMessage, setSavedMessage] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState('');
  const [isCatalogSaving, setIsCatalogSaving] = useState(false);
  const [themeForm, setThemeForm] = useState(emptyThemeForm());
  const [productForm, setProductForm] = useState(emptyProductForm());
  const [uploadStatus, setUploadStatus] = useState('');
  const [showAdvancedTheme, setShowAdvancedTheme] = useState(false);
  const [showAdvancedProduct, setShowAdvancedProduct] = useState(false);

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
    setCatalogMessage('');
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
      window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(data.content));
      setSavedMessage('Saved to the shared CMS. The live site now uses this content.');
    } catch (error) {
      console.error('Unable to save CMS content.', error);
      setSavedMessage('Unable to save content right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCatalogData = async (nextCatalog, successMessage) => {
    setIsCatalogSaving(true);
    setCatalogMessage('');

    try {
      const response = await fetch('/api/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextCatalog),
      });

      const data = await response.json();

      if (!response.ok) {
        setCatalogMessage(data.error || 'Unable to save catalog right now.');
        return false;
      }

      setCatalog(data.catalog);
      setCatalogMessage(successMessage);
      return true;
    } catch (error) {
      console.error('Unable to save catalog.', error);
      setCatalogMessage('Unable to save catalog right now.');
      return false;
    } finally {
      setIsCatalogSaving(false);
    }
  };

  const handleThemeSubmit = async (event) => {
    event.preventDefault();

    if (!themeForm.title.trim()) {
      setCatalogMessage('Section title is required.');
      return;
    }

    const slug = themeForm.slug.trim() || slugify(themeForm.title);

    if (!slug) {
      setCatalogMessage('Unable to generate a valid section link from that title.');
      return;
    }

    const existingIndex = catalog.fineArtThemes.findIndex((item) => item.slug === slug);
    const nextTheme = {
      slug,
      title: themeForm.title.trim(),
      description: themeForm.description.trim(),
      coverImage: themeForm.coverImage.trim(),
    };

    const nextThemes = [...catalog.fineArtThemes];
    if (existingIndex >= 0) {
      nextThemes[existingIndex] = nextTheme;
    } else {
      nextThemes.push(nextTheme);
    }

    const success = await saveCatalogData(
      { ...catalog, fineArtThemes: nextThemes },
      existingIndex >= 0 ? 'Section updated.' : 'Section created.',
    );

    if (success) {
      setThemeForm(emptyThemeForm());
    }
  };

  const handleThemeDelete = async (slug) => {
    const nextThemes = catalog.fineArtThemes.filter((item) => item.slug !== slug);
    const nextProducts = catalog.products.filter((item) => item.theme !== slug);
    await saveCatalogData(
      { ...catalog, fineArtThemes: nextThemes, products: nextProducts },
      'Section deleted.',
    );
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    if (!productForm.title.trim() || !productForm.image.trim()) {
      setCatalogMessage('Artwork title and image are required. Upload an image or paste an existing path.');
      return;
    }

    const generatedId = productForm.id.trim() || slugify(productForm.title);

    if (!generatedId) {
      setCatalogMessage('Unable to generate a valid artwork reference from that title.');
      return;
    }

    const nextProduct = {
      id: generatedId,
      title: productForm.title.trim(),
      collection: productForm.collection,
      theme: productForm.collection === 'fine-art' ? productForm.theme.trim() : '',
      image: productForm.image.trim(),
      sizes: {
        A4: Number(productForm.sizes.A4) || 0,
        A3: Number(productForm.sizes.A3) || 0,
        A2: Number(productForm.sizes.A2) || 0,
      },
    };

    const existingIndex = catalog.products.findIndex((item) => item.id === nextProduct.id);
    const nextProducts = [...catalog.products];

    if (existingIndex >= 0) {
      nextProducts[existingIndex] = nextProduct;
    } else {
      nextProducts.push(nextProduct);
    }

    const success = await saveCatalogData(
      { ...catalog, products: nextProducts },
      existingIndex >= 0 ? 'Artwork updated.' : 'Artwork created.',
    );

    if (success) {
      setProductForm(emptyProductForm());
    }
  };

  const handleProductDelete = async (id) => {
    const nextProducts = catalog.products.filter((item) => item.id !== id);
    await saveCatalogData({ ...catalog, products: nextProducts }, 'Artwork deleted.');
  };

  const handleImageUpload = async (event, target) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadStatus('Uploading image...');

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadStatus(data.error || 'Upload failed.');
        return;
      }

      if (target === 'theme') {
      setThemeForm((current) => ({ ...current, coverImage: data.path }));
      } else {
        setProductForm((current) => ({ ...current, image: data.path }));
      }

      setUploadStatus(`Uploaded: ${data.path}`);
    } catch (error) {
      console.error('Unable to upload image.', error);
      setUploadStatus('Upload failed.');
    } finally {
      event.target.value = '';
    }
  };

  if (isCheckingSession || !isLoaded || !isCatalogLoaded) {
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
              Sign in with the CMS password to edit the live text content, collections, and artworks.
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
          <h1>Shared content editor</h1>
          <p>
            Edit live copy, manage fine art sections, update artworks, and upload images from one place.
          </p>
          <p className="admin-note">
            Changes save through your deployed project and are protected by the CMS password.
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

        <div className="admin-intro">
          <p className="admin-eyebrow">Catalog</p>
          <h1>Collections and artworks</h1>
          <p>
            Add, edit, and remove sections and artworks here. Upload an image first, then save. New uploads are published after the next deployment completes.
          </p>
        </div>

        <div className="admin-grid">
          <form className="admin-card" onSubmit={handleThemeSubmit}>
            <h2>Fine art section</h2>
            <label>
              Section title
              <input
                placeholder="Example: Black & White"
                value={themeForm.title}
                onChange={(event) => setThemeForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <p className="admin-help">
              We create the section link automatically from the title.
            </p>
            <label>
              Short description
              <textarea
                rows="4"
                placeholder="A short sentence describing this collection."
                value={themeForm.description}
                onChange={(event) => setThemeForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <div className="admin-upload-block">
              <label className="admin-upload-label">
                Cover image
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'theme')} />
              </label>
              {themeForm.coverImage ? (
                <div className="admin-preview">
                  <img src={themeForm.coverImage} alt="Section preview" />
                  <p>{themeForm.coverImage}</p>
                </div>
              ) : (
                <p className="admin-help">Upload a cover image for this section.</p>
              )}
            </div>
            <button
              type="button"
              className="admin-linkish"
              onClick={() => setShowAdvancedTheme((current) => !current)}
            >
              {showAdvancedTheme ? 'Hide advanced options' : 'Show advanced options'}
            </button>
            {showAdvancedTheme ? (
              <label>
                Image path
                <input
                  value={themeForm.coverImage}
                  onChange={(event) => setThemeForm((current) => ({ ...current, coverImage: event.target.value }))}
                />
              </label>
            ) : null}
            <div className="admin-actions">
              <button type="submit" className="admin-primary" disabled={isCatalogSaving}>
                {isCatalogSaving ? 'Saving...' : 'Save section'}
              </button>
              <button
                type="button"
                className="admin-secondary"
                onClick={() => setThemeForm(emptyThemeForm())}
              >
                Clear form
              </button>
            </div>
          </form>

          <form className="admin-card" onSubmit={handleProductSubmit}>
            <h2>Artwork</h2>
            <label>
              Artwork title
              <input
                placeholder="Example: Madonna Shrine"
                value={productForm.title}
                onChange={(event) => setProductForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <p className="admin-help">
              We generate the internal reference automatically from the title.
            </p>
            <label>
              Collection
              <select
                value={productForm.collection}
                onChange={(event) => setProductForm((current) => ({ ...current, collection: event.target.value }))}
              >
                <option value="fine-art">Fine Art</option>
                <option value="stock">Stock</option>
              </select>
            </label>
            <label>
              Section
              <select
                value={productForm.theme}
                onChange={(event) => setProductForm((current) => ({ ...current, theme: event.target.value }))}
                disabled={productForm.collection !== 'fine-art'}
              >
                <option value="">Select section</option>
                {catalog.fineArtThemes.map((theme) => (
                  <option key={theme.slug} value={theme.slug}>{theme.title}</option>
                ))}
              </select>
            </label>
            <div className="admin-upload-block">
              <label className="admin-upload-label">
                Artwork image
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'product')} />
              </label>
              {productForm.image ? (
                <div className="admin-preview">
                  <img src={productForm.image} alt="Artwork preview" />
                  <p>{productForm.image}</p>
                </div>
              ) : (
                <p className="admin-help">Upload the artwork image before saving.</p>
              )}
            </div>
            <button
              type="button"
              className="admin-linkish"
              onClick={() => setShowAdvancedProduct((current) => !current)}
            >
              {showAdvancedProduct ? 'Hide advanced options' : 'Show advanced options'}
            </button>
            {showAdvancedProduct ? (
              <label>
                Image path
                <input
                  value={productForm.image}
                  onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
                />
              </label>
            ) : null}
            <div className="admin-price-intro">
              <strong>Print prices</strong>
              <p>Enter numbers only. The dollar sign is added automatically on the live site.</p>
            </div>
            <div className="admin-three">
              <label>
                A4 price
                <input
                  type="number"
                  min="0"
                  value={productForm.sizes.A4}
                  onChange={(event) => setProductForm((current) => ({
                    ...current,
                    sizes: { ...current.sizes, A4: event.target.value },
                  }))}
                />
              </label>
              <label>
                A3 price
                <input
                  type="number"
                  min="0"
                  value={productForm.sizes.A3}
                  onChange={(event) => setProductForm((current) => ({
                    ...current,
                    sizes: { ...current.sizes, A3: event.target.value },
                  }))}
                />
              </label>
              <label>
                A2 price
                <input
                  type="number"
                  min="0"
                  value={productForm.sizes.A2}
                  onChange={(event) => setProductForm((current) => ({
                    ...current,
                    sizes: { ...current.sizes, A2: event.target.value },
                  }))}
                />
              </label>
            </div>
            <div className="admin-actions">
              <button type="submit" className="admin-primary" disabled={isCatalogSaving}>
                {isCatalogSaving ? 'Saving...' : 'Save artwork'}
              </button>
              <button
                type="button"
                className="admin-secondary"
                onClick={() => setProductForm(emptyProductForm())}
              >
                Clear form
              </button>
            </div>
          </form>
        </div>

        {uploadStatus ? <p className="admin-feedback">{uploadStatus}</p> : null}
        {catalogMessage ? <p className="admin-feedback">{catalogMessage}</p> : null}

        <div className="admin-grid">
          <section className="admin-card">
            <h2>Current sections</h2>
            <div className="admin-list">
              {catalog.fineArtThemes.map((theme) => (
                <div key={theme.slug} className="admin-list-item">
                  <div>
                    <strong>{theme.title}</strong>
                    <p>{theme.description || 'No description yet.'}</p>
                  </div>
                  <div className="admin-inline-actions">
                    <button
                      type="button"
                      className="admin-secondary"
                      onClick={() => setThemeForm(theme)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => handleThemeDelete(theme.slug)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <h2>Current artworks</h2>
            <div className="admin-list">
              {catalog.products.map((product) => (
                <div key={product.id} className="admin-list-item">
                  <div>
                    <strong>{product.title}</strong>
                    <p>
                      {product.collection === 'fine-art'
                        ? `Fine Art${product.theme ? ` / ${product.theme}` : ''}`
                        : 'Stock & Licensing'}
                    </p>
                  </div>
                  <div className="admin-inline-actions">
                    <button
                      type="button"
                      className="admin-secondary"
                      onClick={() => setProductForm({
                        ...product,
                        sizes: {
                          A4: String(product.sizes.A4 ?? ''),
                          A3: String(product.sizes.A3 ?? ''),
                          A2: String(product.sizes.A2 ?? ''),
                        },
                      })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-danger"
                      onClick={() => handleProductDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
