import { Link, useParams } from 'react-router-dom';
import './Gallery.css';
import { useCatalog } from '../context/CatalogContext';

export default function Gallery() {
  const { theme } = useParams();
  const { catalog, isLoaded } = useCatalog();

  const themeData = catalog.fineArtThemes.find((item) => item.slug === theme);
  const filteredImages = catalog.products.filter(
    (item) => item.collection === 'fine-art' && item.theme === theme,
  );
  const pageTitle = themeData?.title || 'Collection';

  if (!isLoaded) {
    return (
      <main className="gallery-page">
        <div className="gallery-shell">
          <h1>Loading collection...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="gallery-page">
      <div className="gallery-shell">
        <h1>{pageTitle}</h1>
        <p className="gallery-intro">
          {themeData?.description || 'A focused selection of photographs available as collectible prints.'}
        </p>

        {filteredImages.length === 0 ? (
          <p>No images found for this theme.</p>
        ) : (
          <div className="gallery-grid">
            {filteredImages.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="gallery-card">
                <img
                  src={item.image}
                  alt={item.title}
                  className="gallery-image"
                />
                <h2>{item.title}</h2>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
