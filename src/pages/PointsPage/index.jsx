import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaQrcode, FaLeaf, FaRecycle, FaTint } from 'react-icons/fa';
import { MdHome, MdMap, MdCardGiftcard, MdStar, MdShoppingBag } from 'react-icons/md';
import logo from '../../assets/icon/icon.webp';
import '../EcoApp.css';

const Points = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="app-container">
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

      <main className="main-content">
        <div className="points-card">
          <h1 className="points-value">1.260</h1>
          <p className="points-label">Pontos ecológicos</p>
        </div>

        <section className="points-history">
          <h2 className="section-title">Histórico de pontos</h2>
          <div className="history-list">
            <div className="history-item">
              <div className="history-icon oil-icon">
                <FaTint />
              </div>
              <div className="history-info">
                <div className="history-details">
                  <h3>Descarte de óleo</h3>
                  <p>Ecoponto Central</p>
                </div>
                <div className="history-points">
                  <span className="points-earned">+50</span>
                  <span className="history-date">Hoje</span>
                </div>
              </div>
            </div>
            
            <div className="history-item">
              <div className="history-icon recycle-icon">
                <FaRecycle />
              </div>
              <div className="history-info">
                <div className="history-details">
                  <h3>Reciclagem de plástico</h3>
                  <p>Ecoponto Norte</p>
                </div>
                <div className="history-points">
                  <span className="points-earned">+35</span>
                  <span className="history-date">Ontem</span>
                </div>
              </div>
            </div>
            
            <div className="history-item">
              <div className="history-icon qr-icon">
                <FaQrcode />
              </div>
              <div className="history-info">
                <div className="history-details">
                  <h3>Escanear QR code</h3>
                  <p>Feira Orgânica</p>
                </div>
                <div className="history-points">
                  <span className="points-earned">+15</span>
                  <span className="history-date">3 dias atrás</span>
                </div>
              </div>
            </div>
            
            <div className="history-item">
              <div className="history-icon plant-icon">
                <FaLeaf />
              </div>
              <div className="history-info">
                <div className="history-details">
                  <h3>Participação em plantio</h3>
                  <p>Parque Municipal</p>
                </div>
                <div className="history-points">
                  <span className="points-earned">+100</span>
                  <span className="history-date">1 semana atrás</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="points-info">
          <h2 className="section-title">Como ganhar pontos</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">
                <FaTint />
              </div>
              <div className="info-content">
                <h3>Descarte de óleo</h3>
                <p>50 pontos por litro</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <FaRecycle />
              </div>
              <div className="info-content">
                <h3>Reciclagem</h3>
                <p>5-35 pontos por kg</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <FaLeaf />
              </div>
              <div className="info-content">
                <h3>Evento de plantio</h3>
                <p>100 pontos por participação</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-nav">
          <Link to="/" className={`footer-btn ${pathname === '/' ? 'active' : ''}`}>
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
    </div>
  );
};

export default Points;