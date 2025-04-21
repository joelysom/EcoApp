import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaQrcode, FaTint } from 'react-icons/fa';
import { MdHome, MdMap, MdCardGiftcard, MdStar, MdShoppingBag } from 'react-icons/md';
import logo from '../assets/icon/icon.webp';
import './EcoApp.css';

const Home = () => {
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

        <section className="recent-activities">
          <h2 className="section-title">Atividades recentes</h2>
          <div className="activities-grid">
            <div className="activity-card oil-disposal">
              <div className="activity-icon">
                <FaTint />
              </div>
              <div className="activity-info">
                <h3>Descarte de óleo</h3>
                <p>Hoje</p>
              </div>
            </div>
            <div className="activity-card qr-code">
              <div className="activity-icon qr-icon">
                <FaQrcode />
              </div>
              <div className="activity-info">
                <h3>Escanear QR code</h3>
              </div>
            </div>
          </div>
        </section>

        <section className="community-ranking">
          <h2 className="section-title">Classificação comunitária</h2>
          <div className="ranking-list">
            <div className="ranking-item rank-1">
              <div className="rank-number">1</div>
              <div className="rank-user-avatar">
                <FaUser />
              </div>
              <div className="rank-user-name">Maria</div>
              <div className="rank-points">11</div>
            </div>
            <div className="ranking-item rank-2">
              <div className="rank-number">2</div>
              <div className="rank-user-avatar">
                <FaUser />
              </div>
              <div className="rank-user-name">João</div>
              <div className="rank-points">2</div>
            </div>
            <div className="ranking-item rank-3">
              <div className="rank-number">3</div>
              <div className="rank-user-avatar">
                <FaUser />
              </div>
              <div className="rank-user-name">Ana</div>
              <div className="rank-points">3</div>
            </div>
          </div>
        </section>

        <section className="local-offers">
          <h2 className="section-title">Ofertas para negócios locais</h2>
          <div className="offers-list">
            <div className="offer-card">
              <div className="offer-image"></div>
              <div className="offer-content">
                <h3 className="offer-title">Desconto em Produtos Orgânicos</h3>
                <p className="offer-description">Troque 250 pontos por 15% de desconto na próxima compra</p>
                <div className="offer-action">
                  <button className="offer-button">Resgatar</button>
                </div>
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

export default Home;