// src/App.jsx

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import FineArt from './pages/FineArt';
import Gallery from './pages/Gallery';
import Product from './pages/Product';
import Stock from './pages/Stock';
import About from './pages/About';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fine-art" element={<FineArt />} />
        <Route path="/fine-art/:theme" element={<Gallery />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/about" element={<About />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/studio" element={<Admin />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
