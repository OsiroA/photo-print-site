import { useState } from 'react';
import { useParams } from 'react-router-dom';
import productData from '../productData';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const product = productData[id];
  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const [size, setSize] = useState('A4');
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <main className="product-page">
        <div className="product-shell product-shell-missing">
          <h1>Product not found</h1>
          <p>This artwork could not be loaded.</p>
        </div>
      </main>
    );
  }

  const pricePerUnit = product.sizes[size];
  const totalPrice = pricePerUnit * quantity;

  const handleCheckout = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${product.title} (${size}) x${quantity}`,
          price: totalPrice,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe session failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to payment server.');
    }
  };

  return (
    <main className="product-page">
      <div className="product-shell">
        <h1>{product.title}</h1>

        <img
          src={product.image}
          alt={product.title}
          className="product-image"
        />

        <div className="product-control">
          <label htmlFor="size"><strong>Print size:</strong></label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="product-select"
          >
            {Object.keys(product.sizes).map((s) => (
              <option key={s} value={s}>
                {s} - ${product.sizes[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="product-control">
          <label htmlFor="quantity"><strong>Quantity:</strong></label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number.parseInt(e.target.value, 10))}
            className="product-select"
          >
            {[...Array(10).keys()].map((q) => (
              <option key={q + 1} value={q + 1}>
                {q + 1}
              </option>
            ))}
          </select>
        </div>

        <p className="product-total"><strong>Total:</strong> ${totalPrice}</p>

        <button
          onClick={handleCheckout}
          className="product-button"
        >
          Buy Print (${totalPrice})
        </button>
      </div>
    </main>
  );
}
