// src/components/Navbar.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useSiteContent } from '../context/SiteContentContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { content } = useSiteContent();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <span>{content.brand.photographerName}</span>
          <small>{content.brand.navLabel}</small>
        </Link>
      </div>

      <button
        type="button"
        className="navbar-toggle"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span aria-hidden="true">{menuOpen ? 'Close' : 'Menu'}</span>
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/fine-art" onClick={() => setMenuOpen(false)}>Fine Art</Link>
        <Link to="/stock" onClick={() => setMenuOpen(false)}>Stock & Licensing</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        <Link to="/studio" onClick={() => setMenuOpen(false)}>Studio</Link>
      </div>
    </nav>
  );
}
