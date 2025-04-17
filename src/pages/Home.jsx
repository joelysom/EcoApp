import React from 'react';
import { FaUser, FaQrcode, FaTint } from 'react-icons/fa';
import { MdHome, MdMap, MdCardGiftcard, MdStar, MdShoppingBag } from 'react-icons/md';
import logo from '../assets/icon/icon.webp';
import './EcoApp.css';

const Home = () => {
  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
        <img src={logo} alt="Logo" className="app-logo" />
        </div>
        <nav className="navigation">
          <button className="nav-item active">Home</button>
          <button className="nav-item">Pontos</button>
          <button className="nav-item">Mapa</button>
          <button className="nav-item">Recompensas</button>
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
          <button className="footer-btn active">
            <MdHome />
            <span>Home</span>
          </button>
          <button className="footer-btn">
            <MdMap />
            <span>Mapa</span>
          </button>
          <button className="footer-btn">
            <MdStar />
            <span>Pontos</span>
          </button>
          <button className="footer-btn">
            <MdCardGiftcard />
            <span>Recompensas</span>
          </button>
          <button className="footer-btn">
            <MdShoppingBag />
            <span>Mercado</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;