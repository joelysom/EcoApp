import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdHome, MdMap, MdCardGiftcard, MdStar, MdShoppingBag } from 'react-icons/md';

// Navigation header component that can be reused across pages
export const NavHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

  return (
    <header className="header">
      <div className="logo-container">
        <img src="/assets/icon/icon.webp" alt="Logo" className="app-logo" />
      </div>
      <nav className="navigation">
        <button 
          className={`nav-item ${path === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          Home
        </button>
        <button 
          className={`nav-item ${path === '/points' ? 'active' : ''}`}
          onClick={() => navigate('/points')}
        >
          Pontos
        </button>
        <button 
          className={`nav-item ${path === '/map' ? 'active' : ''}`}
          onClick={() => navigate('/map')}
        >
          Mapa
        </button>
        <button 
          className={`nav-item ${path === '/rewards' ? 'active' : ''}`}
          onClick={() => navigate('/rewards')}
        >
          Recompensas
        </button>
      </nav>
    </header>
  );
};

// Footer navigation component that can be reused across pages
export const NavFooter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

  return (
    <footer className="footer">
      <div className="footer-nav">
        <button 
          className={`footer-btn ${path === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <MdHome />
          <span>Home</span>
        </button>
        <button 
          className={`footer-btn ${path === '/map' ? 'active' : ''}`}
          onClick={() => navigate('/map')}
        >
          <MdMap />
          <span>Mapa</span>
        </button>
        <button 
          className={`footer-btn ${path === '/points' ? 'active' : ''}`}
          onClick={() => navigate('/points')}
        >
          <MdStar />
          <span>Pontos</span>
        </button>
        <button 
          className={`footer-btn ${path === '/rewards' ? 'active' : ''}`}
          onClick={() => navigate('/rewards')}
        >
          <MdCardGiftcard />
          <span>Recompensas</span>
        </button>
        <button 
          className={`footer-btn ${path === '/market' ? 'active' : ''}`}
          onClick={() => navigate('/market')}
        >
          <MdShoppingBag />
          <span>Mercado</span>
        </button>
      </div>
    </footer>
  );
};