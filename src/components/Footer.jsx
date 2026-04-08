// src/components/Footer.jsx
import './Footer.css';
import { useSiteContent } from '../context/SiteContentContext';

export default function Footer() {
  const { content } = useSiteContent();

  return (
    <footer className="footer">
      <p>© 2026 {content.brand.photographerName}. All rights reserved.</p>
      <div className="social-links">
        <a
          href={content.socials.instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        <a
          href={content.socials.tiktokUrl}
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>
      </div>
    </footer>
  );
}
