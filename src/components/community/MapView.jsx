// src/components/community/MapView.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LocateUser } from './LocateUser';
import { getReportTypeLabel } from '../../utils/helpers';
import { icons } from '../../utils/mapIcons';
import MapLegend from './MapLegend';
import ReportButton from './ReportButton';

const MapView = ({ 
  userLocation, 
  setUserLocation, 
  reports, 
  handleSelectReport, 
  setShowReportForm 
}) => {
  if (!userLocation) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando localização...</p>
      </div>
    );
  }
  
  return (
    <div className="map-container">
      <MapContainer 
        center={userLocation} 
        zoom={15} 
        style={{ height: '65vh', width: '100%', borderRadius: '16px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocateUser setUserLocation={setUserLocation} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'current-location-marker',
              html: `<div style="background-color:#1155cc; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>Sua localização atual</Popup>
          </Marker>
        )}
        
        {/* Report markers */}
        {reports.map(report => (
          report.location && (
            <Marker 
              key={report.id}
              position={report.location}
              icon={icons[report.type]}
              eventHandlers={{
                click: () => handleSelectReport(report)
              }}
            >
              <Popup>
                <div className="map-popup">
                  <h3>{report.title}</h3>
                  <p className="popup-type">{getReportTypeLabel(report.type)}</p>
                  {report.imageUrl && (
                    <img 
                      src={report.imageUrl} 
                      alt={report.title} 
                      className="popup-image" 
                    />
                  )}
                  <button 
                    className="popup-details-btn"
                    onClick={() => handleSelectReport(report)}
                  >
                    Ver detalhes
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      
      <MapLegend />
      <ReportButton setShowReportForm={setShowReportForm} />
    </div>
  );
};

export default MapView;
