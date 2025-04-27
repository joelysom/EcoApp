import React from 'react';
import { FaLocationArrow, FaList, FaFilter, FaTint, FaRecycle, FaLeaf } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';

const Map = () => {
  return (
    <div className="main-content">
      <div className="map-container">
        {/* This would be a real map integration, using a placeholder for now */}
        <div className="map-placeholder">
          {/* Map would be displayed here with proper integration */}
          <div className="map-center-marker">
            <FaLocationArrow />
          </div>
        </div>
        
        <div className="map-controls">
          <button className="map-control-btn">
            <FaLocationArrow />
          </button>
          <button className="map-control-btn">
            <FaFilter />
          </button>
          <button className="map-control-btn">
            <FaList />
          </button>
        </div>
      </div>

      <section className="nearby-ecopoints">
        <h2 className="section-title">Ecopontos próximos</h2>
        <div className="ecopoints-list">
          <div className="ecopoint-item">
            <div className="ecopoint-icon">
              <FaRecycle />
            </div>
            <div className="ecopoint-info">
              <h3>Ecoponto Central</h3>
              <p>Av. Paulista, 1000 - 1.2 km</p>
              <div className="ecopoint-services">
                <span className="service-tag">Óleo</span>
                <span className="service-tag">Plástico</span>
                <span className="service-tag">Vidro</span>
              </div>
            </div>
            <button className="directions-btn">
              <MdDirections />
            </button>
          </div>
          
          <div className="ecopoint-item">
            <div className="ecopoint-icon">
              <FaTint />
            </div>
            <div className="ecopoint-info">
              <h3>Ponto de Coleta de Óleo</h3>
              <p>Rua Augusta, 500 - 1.8 km</p>
              <div className="ecopoint-services">
                <span className="service-tag">Óleo</span>
              </div>
            </div>
            <button className="directions-btn">
              <MdDirections />
            </button>
          </div>
          
          <div className="ecopoint-item">
            <div className="ecopoint-icon">
              <FaLeaf />
            </div>
            <div className="ecopoint-info">
              <h3>Horta Comunitária</h3>
              <p>Rua Oscar Freire, 750 - 2.3 km</p>
              <div className="ecopoint-services">
                <span className="service-tag">Composto</span>
                <span className="service-tag">Voluntariado</span>
              </div>
            </div>
            <button className="directions-btn">
              <MdDirections />
            </button>
          </div>
        </div>
      </section>

      <section className="upcoming-events">
        <h2 className="section-title">Eventos ecológicos</h2>
        <div className="events-list">
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">28</span>
              <span className="event-month">ABR</span>
            </div>
            <div className="event-info">
              <h3>Limpeza da Praia</h3>
              <p>Praia de Copacabana • 09:00</p>
              <span className="event-points">+100 pontos</span>
            </div>
          </div>
          
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">05</span>
              <span className="event-month">MAI</span>
            </div>
            <div className="event-info">
              <h3>Plantio de Árvores</h3>
              <p>Parque Ibirapuera • 10:00</p>
              <span className="event-points">+150 pontos</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Map;