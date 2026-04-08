// src/pages/Stock.jsx

import { Link } from 'react-router-dom';
import './Stock.css';
import { useCatalog } from '../context/CatalogContext';

export default function Stock() {
  const { catalog, isLoaded } = useCatalog();
  const stockData = catalog.products.filter((item) => item.collection === 'stock');

  if (!isLoaded) {
    return (
      <main className="stock-page">
        <div className="stock-shell">
          <h1>Stock & Licensing</h1>
          <p>Loading collection...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="stock-page">
      <div className="stock-shell">
        <h1>Stock & Licensing</h1>
        <p>Available for commercial use, editorial features, and select licensing enquiries.</p>

        <div className="stock-grid">
          {stockData.map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              className="stock-card"
            >
              <img
                src={item.image}
                alt={item.title}
                className="stock-image"
              />
              <div className="stock-title">
                {item.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
