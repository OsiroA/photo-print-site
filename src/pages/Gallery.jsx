import { Link, useParams } from 'react-router-dom';
import fineArtData from '../data/fineArtData';
import './Gallery.css';

export default function Gallery() {
  const { theme } = useParams();

  const filteredImages = fineArtData.filter((item) => item.theme === theme);
  const pageTitle =
    theme === 'black-and-white' ? 'Black & White Collection' : 'Colour Collection';

  return (
    <main className="gallery-page">
      <div className="gallery-shell">
        <h1>{pageTitle}</h1>
        <p className="gallery-intro">
          A focused selection of photographs available as collectible prints.
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
