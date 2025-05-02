import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdHome, MdMap, MdStar, MdCardGiftcard, MdShoppingBag } from 'react-icons/md';

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <footer className="footer">
      <div className="footer-nav">
        <Link to="/home" className={`footer-btn ${pathname === '/' ? 'active' : ''}`}>
          <MdHome />
          <span>Home</span>
        </Link>
        <Link to="/map" className={`footer-btn ${pathname === '/map' ? 'active' : ''}`}>
          <MdMap />
          <span>Mapa</span>
        </Link>
        <Link to="/points" className={`footer-btn ${pathname === '/points' ? 'active' : ''}`}>
          <MdStar />
          <span>Pontos</span>
        </Link>
        <Link to="/rewards" className={`footer-btn ${pathname === '/rewards' ? 'active' : ''}`}>
          <MdCardGiftcard />
          <span>Recompensas</span>
        </Link>
        <Link to="/market" className={`footer-btn ${pathname === '/market' ? 'active' : ''}`}>
          <MdShoppingBag />
          <span>Mercado</span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;