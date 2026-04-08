import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { useSiteContent } from '../context/SiteContentContext';

export default function Home() {
  const heroImages = [
    '/images/hero/hero-street-scene.jpeg',
    '/images/hero/hero-people-gathered.jpeg',
    '/images/hero/hero-street-road.jpeg',
    '/images/hero/hero-coloured-madonna.jpeg',
  ];
  const { content } = useSiteContent();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const currentImage = heroImages[currentImageIndex];

  return (
    <main className="home-page">
      <section
        className="hero"
        style={{ backgroundImage: `url(${currentImage})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-kicker">{content.brand.siteTitle}</p>
          <h1>{content.home.headline}</h1>
          <p>{content.home.subheading}</p>
          <Link to="/fine-art">
            <button>{content.home.primaryCtaLabel}</button>
          </Link>
        </div>
      </section>

      <section className="section section-intro">
        <p className="section-label">Collections</p>
        <h2>Fine art prints and licensing-ready images</h2>
        <p>
          Explore curated black and white and colour series, along with selected
          imagery available for editorial and commercial use.
        </p>
        <div className="gallery-grid">
          <Link to="/fine-art/black-and-white" className="gallery-item">
            <img src="/images/black-and-white/statue.jpeg" alt="Black and White" />
            <h3>Black & White Series</h3>
          </Link>
          <Link to="/fine-art/colour" className="gallery-item">
            <img src="/images/architecture/boy-and-girl-statue.jpeg" alt="Colour" />
            <h3>Colour Series</h3>
          </Link>
          <Link to="/stock" className="gallery-item">
            <img src="/images/street/POS-girl.jpeg" alt="POS Girl" />
            <h3>Stock Collection</h3>
          </Link>
        </div>
      </section>
    </main>
  );
}
