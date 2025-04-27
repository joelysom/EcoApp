import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/icon/icon.webp';

const Header = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <header className="header">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="app-logo" />
      </div>
      <nav className="navigation">
        <Link to="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/points" className={`nav-item ${pathname === '/points' ? 'active' : ''}`}>Pontos</Link>
        <Link to="/map" className={`nav-item ${pathname === '/map' ? 'active' : ''}`}>Mapa</Link>
        <Link to="/rewards" className={`nav-item ${pathname === '/rewards' ? 'active' : ''}`}>Recompensas</Link>
      </nav>
    </header>
  );
};

export default Header;