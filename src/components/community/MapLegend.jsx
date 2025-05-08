
// src/components/community/MapLegend.js
import React from 'react';

const MapLegend = () => {
  return (
    <div className="map-legend">
      <h3>Legenda</h3>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#FF5252' }}></div>
        <span>Poluição</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#FFC107' }}></div>
        <span>Descarte irregular</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
        <span>Área de preservação</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
        <span>Iniciativa ecológica</span>
      </div>
    </div>
  );
};

export default MapLegend;