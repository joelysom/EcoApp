import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import './demomap.css';
import { FaTimes, FaDirections } from 'react-icons/fa';

const DemoMap = () => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Collection points data
  const collectionPoints = [
    {
      id: 'cb-afogados',
      name: "Casas Bahia Recife – Afogados",
      coordinates: [-8.0732, -34.9125],
      address: "Afogados, Recife - PE",
      acceptedItems: ["Eletrônicos", "Pilhas", "Baterias"],
      hours: "Segunda a Sábado: 9h às 18h"
    },
    {
      id: 'cb-jaboatao',
      name: "Casas Bahia Jaboatão dos Guararapes",
      coordinates: [-8.1125, -34.9189],
      address: "Jaboatão dos Guararapes, PE",
      acceptedItems: ["Papel", "Plástico", "Metal"],
      hours: "Segunda a Sexta: 8h às 17h"
    },
    {
      id: 'cb-imbiribeira',
      name: "Casas Bahia Recife – Imbiribeira",
      coordinates: [-8.11218804562412, -34.91280757786449],
      address: "Imbiribeira, Recife - PE",
      acceptedItems: ["Orgânico", "Eletrônicos"],
      hours: "Segunda a Sábado: 8h às 18h"
    },
    {
      id: 'cb-marechal',
      name: "Avenida Marechal Mascarenhas de Morais, 3.214 – Recife (PE)",
      coordinates: [-8.119037684734353, -34.91363977785169],
      address: "Avenida Marechal, Recife - PE",
      acceptedItems: ["Entulho", "Madeira"],
      hours: "Segunda a Sexta: 9h às 17h"
    },
    {
      id: 'cb-casa-amarela',
      name: "Casas Bahia Recife – Casa Amarela",
      coordinates: [-8.02343345476325, -34.91815723550337],
      address: "Casa Amarela, Recife - PE",
      acceptedItems: ["Papel", "Plástico"],
      hours: "Segunda a Sábado: 9h às 17h"
    },
    {
      id: 'cb-padre-lemos',
      name: "Rua Padre Lemos, 350 – Recife (PE)",
      coordinates: [-8.023449183340285, -34.918063062491285],
      address: "Rua Padre Lemos, Recife - PE",
      acceptedItems: ["Orgânico", "Metal"],
      hours: "Segunda a Sexta: 8h às 17h"
    },
    {
      id: 'cb-centro',
      name: "Casas Bahia Recife – Centro",
      coordinates: [-8.065186934349518, -34.881528220137426],
      address: "Centro, Recife - PE",
      acceptedItems: ["Eletrônicos", "Plástico", "Papel"],
      hours: "Segunda a Sábado: 9h às 18h"
    },
    {
      id: 'cb-rua-concordia',
      name: "Rua da Concórdia, 176 – Recife (PE)",
      coordinates: [-8.065208179776429, -34.88150676252108],
      address: "Rua da Concórdia, Recife - PE",
      acceptedItems: ["Orgânico", "Entulho"],
      hours: "Segunda a Sexta: 8h às 17h"
    },
    {
      id: 'cb-rua-da-paz',
      name: "Rua da Paz, 283 – Recife (PE)",
      coordinates: [-8.080275576374305, -34.90503772014041],
      address: "Rua da Paz, Recife - PE",
      acceptedItems: ["Plástico", "Metal"],
      hours: "Segunda a Sábado: 9h às 17h"
    },
    {
      id: 'cb-barao-lucena',
      name: "Avenida Barão de Lucena, 593 – Jaboatão dos Guararapes (PE)",
      coordinates: [-8.112896774291755, -35.018790475989064],
      address: "Avenida Barão de Lucena, Jaboatão dos Guararapes - PE",
      acceptedItems: ["Eletrônicos", "Pilhas"],
      hours: "Segunda a Sexta: 8h às 17h"
    },
    {
      id: 'cb-camaragibe',
      name: "Casas Bahia Camaragibe",
      coordinates: [-8.0203765863867, -34.981438035498705],
      address: "Camaragibe, PE",
      acceptedItems: ["Papel", "Plástico", "Orgânico"],
      hours: "Segunda a Sábado: 9h às 18h"
    },
    {
      id: 'cb-doutor-belmino',
      name: "Avenida Doutor Belmino Correia, 1809 – Camaragibe (PE)",
      coordinates: [-8.020429705842512, -34.98137366251939],
      address: "Avenida Doutor Belmino, Camaragibe - PE",
      acceptedItems: ["Entulho", "Madeira"],
      hours: "Segunda a Sexta: 9h às 17h"
    },
    {
      id: 'cb-sao-lourenco',
      name: "Casas Bahia São Lourenço da Mata",
      coordinates: [-7.996649173078285, -35.03655252016426],
      address: "São Lourenço da Mata, PE",
      acceptedItems: ["Eletrônicos", "Pilhas", "Baterias"],
      hours: "Segunda a Sábado: 9h às 18h"
    },
    {
      id: 'cb-doutor-luiz',
      name: "Avenida Doutor Luiz Correia de Araújo, 44 – São Lourenço da Mata (PE)",
      coordinates: [-7.996617299545052, -35.036488147189196],
      address: "Avenida Doutor Luiz, São Lourenço da Mata - PE",
      acceptedItems: ["Papel", "Plástico", "Orgânico"],
      hours: "Segunda a Sexta: 8h às 17h"
    }
  ];

  // Create custom icons for different types of markers
  const redIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  const greenIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  const blueIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  // Component to center the map on a point
  const CenterMap = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
      if (coordinates) {
        map.setView(coordinates, 15);
      }
    }, [coordinates, map]);
    return null;
  };

  useEffect(() => {
    const fetchMarkers = async () => {
      const db = getFirestore();
      try {
        // Fetch both reports and collection requests
        const reportsSnapshot = await getDocs(collection(db, 'reports'));
        const requestsSnapshot = await getDocs(collection(db, 'collection_requests'));

        const markersData = [];

        // Process reports (red markers)
        reportsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.location && data.location.latitude && data.location.longitude) {
            markersData.push({
              id: doc.id,
              type: 'report',
              position: [data.location.latitude, data.location.longitude],
              details: {
                description: data.description,
                wasteType: data.wasteType,
                status: data.status,
                createdAt: data.createdAt?.toDate()?.toLocaleDateString() || 'Data não disponível',
                riskLevel: data.riskLevel
              }
            });
          }
        });

        // Process collection requests (green markers)
        requestsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.location && data.location.latitude && data.location.longitude) {
            markersData.push({
              id: doc.id,
              type: 'request',
              position: [data.location.latitude, data.location.longitude],
              details: {
                description: data.description,
                wasteType: data.wasteType,
                status: data.status,
                createdAt: data.createdAt?.toDate()?.toLocaleDateString() || 'Data não disponível',
                quantity: data.quantity
              }
            });
          }
        });

        setMarkers(markersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching markers:', error);
        setLoading(false);
      }
    };

    fetchMarkers();
  }, []);

  const handlePointClick = (point) => {
    setSelectedPoint(point);
  };

  const handleCloseDetails = () => {
    setSelectedPoint(null);
  };

  const openDirections = (coordinates) => {
    const [lat, lng] = coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getWasteTypeLabel = (type) => {
    const wasteTypes = {
      'organic': 'Orgânico',
      'plastic': 'Plástico',
      'electronic': 'Eletrônico',
      'construction': 'Entulho',
      'other': 'Outro'
    };
    return wasteTypes[type] || type;
  };

  const getStatusLabel = (status) => {
    const statusTypes = {
      'pending': 'Pendente',
      'in_progress': 'Em andamento',
      'resolved': 'Resolvido',
      'rejected': 'Rejeitado'
    };
    return statusTypes[status] || status;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className="demo-map-container">
      <div className="map-header">
        <h1>Mapa de Ocorrências</h1>
        <button className="back-button" onClick={() => navigate('/demo')}>
          Voltar para Demo
        </button>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker red"></div>
          <span>Denúncias</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker green"></div>
          <span>Solicitações de Coleta</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker blue"></div>
          <span>Pontos de Coleta</span>
        </div>
      </div>

      <MapContainer
        center={[-8.0476, -34.8770]} // Coordinates for Recife
        zoom={12}
        style={{ height: '70vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {selectedPoint && <CenterMap coordinates={selectedPoint.coordinates} />}
        
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={marker.type === 'report' ? redIcon : greenIcon}
          >
            <Popup>
              <div className="marker-popup">
                <h3>{marker.type === 'report' ? 'Denúncia' : 'Solicitação de Coleta'}</h3>
                <p><strong>Tipo de resíduo:</strong> {getWasteTypeLabel(marker.details.wasteType)}</p>
                <p><strong>Status:</strong> {getStatusLabel(marker.details.status)}</p>
                <p><strong>Data:</strong> {marker.details.createdAt}</p>
                {marker.type === 'report' && marker.details.riskLevel && (
                  <p><strong>Nível de risco:</strong> {marker.details.riskLevel}</p>
                )}
                {marker.type === 'request' && marker.details.quantity && (
                  <p><strong>Quantidade:</strong> {marker.details.quantity}</p>
                )}
                <p><strong>Descrição:</strong> {marker.details.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {collectionPoints.map((point) => (
          <Marker
            key={point.id}
            position={point.coordinates}
            icon={blueIcon}
            eventHandlers={{
              click: () => handlePointClick(point)
            }}
          />
        ))}
      </MapContainer>

      {selectedPoint && (
        <div className="point-details-modal">
          <div className="point-details-header">
            <h3>Ponto de Coleta</h3>
            <button className="point-details-close" onClick={handleCloseDetails}>
              <FaTimes />
            </button>
          </div>
          <div className="point-details-content">
            <div className="point-details-info">
              <h4>{selectedPoint.name}</h4>
              <p><strong>Endereço:</strong> {selectedPoint.address}</p>
              <p><strong>Horário de funcionamento:</strong> {selectedPoint.hours}</p>
              <p><strong>Itens aceitos:</strong></p>
              <ul>
                {selectedPoint.acceptedItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="point-details-action">
              <button 
                className="point-details-button"
                onClick={() => openDirections(selectedPoint.coordinates)}
              >
                <FaDirections /> Como Chegar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMap;