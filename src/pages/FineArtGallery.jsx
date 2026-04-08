// src/pages/FineArtGallery.jsx

import { Link } from 'react-router-dom';
import fineArtData from '../data/fineArtData';

export default function FineArtGallery({ theme }) {
  const filtered = fineArtData.filter(
    (item) => item.theme.toLowerCase() === theme.toLowerCase()
  );

  return (
    <div style={{ padding: '40px' }}>
      <h1>{theme} Series</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {filtered.map((item) => (
          <Link key={item.id} to={`/product/${item.id}`}>
            <img
              src={item.image}
              alt={item.title}
              style={{ width: '220px', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <div style={{ marginTop: '8px' }}>{item.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
