import { Link } from 'react-router-dom';
import './FineArt.css';
import { useCatalog } from '../context/CatalogContext';

export default function FineArt() {
  const { catalog, isLoaded } = useCatalog();

  if (!isLoaded) {
    return (
      <div className="fine-art-page">
        <h1>Fine Art Photography</h1>
        <p className="subtitle">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="fine-art-page">
      <h1>Fine Art Photography</h1>
      <p className="subtitle">Explore limited edition fine art series</p>

      <div className="theme-grid">
        {catalog.fineArtThemes.map((theme) => (
          <Link key={theme.slug} to={`/fine-art/${theme.slug}`} className="theme-card">
            <img src={theme.coverImage} alt={theme.title} />
            <h2>{theme.title}</h2>
            <p>{theme.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
