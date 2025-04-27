import React from 'react';
import { FaShoppingCart, FaSearch, FaHeart, FaStar, FaLeaf } from 'react-icons/fa';
import { MdShoppingBag } from 'react-icons/md';

const Market = () => {
  return (
    <div className="main-content">
      <div className="search-container">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar produtos ecológicos" 
          />
        </div>
      </div>

      <div className="market-stats">
        <div className="points-card" style={{height: '80px', paddingTop: '12px', paddingBottom: '12px'}}>
          <h1 className="points-value">1.260</h1>
          <p className="points-label">Pontos para usar em compras</p>
        </div>
      </div>

      <div className="market-categories">
        <h2 className="section-title">Categorias</h2>
        <div className="categories-grid">
          <div className="category-card">
            <div className="category-icon">
              <FaLeaf />
            </div>
            <span className="category-name">Orgânicos</span>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <MdShoppingBag />
            </div>
            <span className="category-name">Eco-bags</span>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <FaHeart />
            </div>
            <span className="category-name">Bem-estar</span>
          </div>
          <div className="category-card">
            <div className="category-icon">
              <FaStar />
            </div>
            <span className="category-name">Produtos</span>
          </div>
        </div>
      </div>

      <section className="featured-products">
        <div className="section-header">
          <h2 className="section-title">Produtos em destaque</h2>
          <button className="view-all-btn">Ver todos</button>
        </div>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-badge eco">ECO</div>
            <div className="product-image"></div>
            <div className="product-details">
              <h3 className="product-name">Escova de Bambu</h3>
              <div className="product-vendor">Eco Store</div>
              <div className="product-price-container">
                <span className="product-price">R$ 12,90</span>
                <span className="product-points">ou 129 pts</span>
              </div>
              <button className="add-to-cart-btn">
                <FaShoppingCart />
              </button>
            </div>
          </div>
          
          <div className="product-card">
            <div className="product-badge organic">ORGÂNICO</div>
            <div className="product-image"></div>
            <div className="product-details">
              <h3 className="product-name">Café Orgânico</h3>
              <div className="product-vendor">Café Sustentável</div>
              <div className="product-price-container">
                <span className="product-price">R$ 24,50</span>
                <span className="product-points">ou 245 pts</span>
              </div>
              <button className="add-to-cart-btn">
                <FaShoppingCart />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="eco-partners">
        <h2 className="section-title">Parceiros ecológicos</h2>
        <div className="partners-list">
          <div className="partner-card">
            <div className="partner-logo"></div>
            <div className="partner-info">
              <h3>Mercado Verde</h3>
              <div className="partner-rating">
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#e0e0e0'}} />
                <span className="rating-count">(42)</span>
              </div>
              <p>Produtos orgânicos e sustentáveis</p>
            </div>
          </div>
          
          <div className="partner-card">
            <div className="partner-logo"></div>
            <div className="partner-info">
              <h3>Eco Store</h3>
              <div className="partner-rating">
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <FaStar style={{color: '#f1c232'}} />
                <span className="rating-count">(87)</span>
              </div>
              <p>Produtos ecológicos para o dia a dia</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;