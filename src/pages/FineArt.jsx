import { Link } from 'react-router-dom';
import './FineArt.css';

export default function FineArt() {
  return (
    <div className="fine-art-page">
      <h1>Fine Art Photography</h1>
      <p className="subtitle">Explore limited edition fine art series</p>

      <div className="theme-grid">
        <Link to="/fine-art/black-and-white" className="theme-card">
          <img src="/images/black-and-white/statue.jpeg" alt="Black and White" />
          <h2>Black & White</h2>
        </Link>

        <Link to="/fine-art/colour" className="theme-card">
          <img src="/images/architecture/boy-and-girl-statue.jpeg" alt="Colour" />
          <h2>Colour</h2>
        </Link>
      </div>
    </div>
  );
}
