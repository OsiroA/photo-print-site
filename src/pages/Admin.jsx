import { useMemo, useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import './Admin.css';

export default function Admin() {
  const { content, updateContent, resetContent } = useSiteContent();
  const [savedMessage, setSavedMessage] = useState('');

  const aboutParagraphs = useMemo(
    () => content.about.paragraphs.join('\n\n'),
    [content.about.paragraphs],
  );

  const handleSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    updateContent('brand', {
      photographerName: formData.get('photographerName').trim(),
      siteTitle: formData.get('siteTitle').trim(),
      navLabel: formData.get('navLabel').trim(),
    });

    updateContent('home', {
      headline: formData.get('headline').trim(),
      subheading: formData.get('subheading').trim(),
      primaryCtaLabel: formData.get('primaryCtaLabel').trim(),
    });

    updateContent('about', {
      title: formData.get('aboutTitle').trim(),
      intro: formData.get('aboutIntro').trim(),
      paragraphs: formData
        .get('aboutParagraphs')
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    });

    updateContent('socials', {
      instagramUrl: formData.get('instagramUrl').trim(),
      instagramLabel: formData.get('instagramLabel').trim(),
      tiktokUrl: formData.get('tiktokUrl').trim(),
      tiktokLabel: formData.get('tiktokLabel').trim(),
    });

    setSavedMessage('Saved locally in this browser. You can keep refining while the public site is live.');
  };

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-intro">
          <p className="admin-eyebrow">Studio</p>
          <h1>Launch-ready content editor</h1>
          <p>
            This gives you a lightweight editing surface for the live copy while we build a fuller CMS underneath.
          </p>
          <p className="admin-note">
            Changes here save to this browser only for now. A full CMS will need shared storage, authentication, and deployment setup.
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
            <button type="submit" className="admin-primary">Save changes</button>
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
          </div>

          {savedMessage ? <p className="admin-feedback">{savedMessage}</p> : null}
        </form>
      </section>
    </main>
  );
}
