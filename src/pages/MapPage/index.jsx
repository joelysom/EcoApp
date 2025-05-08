import React, { useState, useEffect, useRef } from 'react';
import { FaLocationArrow, FaList, FaFilter, FaTint, FaRecycle, FaLeaf } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';
import L from 'leaflet';
import './MapPage.css';
import ReportButton from './ReportFeature.jsx'; // Importar o componente de denúncia

// Definir os ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = () => {
  // Referência para o elemento DOM do mapa
  const mapRef = useRef(null);
  // Referência para a instância do mapa Leaflet
  const leafletMapRef = useRef(null);
  // Referência para o marcador de localização atual
  const currentMarkerRef = useRef(null);
  // Referência para marcadores de ecopontos
  const ecopointMarkersRef = useRef([]);
  // Referência para marcadores de denúncias
  const reportMarkersRef = useRef([]);
  
  // Estado para armazenar a localização atual
  const [currentLocation, setCurrentLocation] = useState(null);
  // Estado para controlar erros de geolocalização
  const [locationError, setLocationError] = useState(null);
  // Estado para controlar se estamos rastreando o usuário
  const [isTracking, setIsTracking] = useState(false);
  // Referência para o watchPosition ID
  const [watchId, setWatchId] = useState(null);
  // Estado para saber se o mapa já foi inicializado
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Lista de ecopontos (normalmente viria de uma API baseada na localização)
  const [ecopoints, setEcopoints] = useState([
    {
      id: 1,
      name: 'Ecoponto Central',
      address: 'Av. Paulista, 1000',
      lat: -23.5630,
      lng: -46.6543,
      distance: 1.2,
      icon: 'recycle',
      services: ['Óleo', 'Plástico', 'Vidro']
    },
    {
      id: 2,
      name: 'Ponto de Coleta de Óleo',
      address: 'Rua Augusta, 500',
      lat: -23.5528,
      lng: -46.6478,
      distance: 1.8,
      icon: 'tint',
      services: ['Óleo']
    },
    {
      id: 3,
      name: 'Horta Comunitária',
      address: 'Rua Oscar Freire, 750',
      lat: -23.5615,
      lng: -46.6695,
      distance: 2.3,
      icon: 'leaf',
      services: ['Composto', 'Voluntariado']
    }
  ]);

  // Função para inicializar o mapa Leaflet
  const initializeMap = (lat, lng) => {
    // Verificar se a referência do mapa existe
    if (!mapRef.current || mapInitialized) return;
    
    // Criar mapa e definir a visualização inicial
    const map = L.map(mapRef.current).setView([lat, lng], 15);
    
    // Adicionar tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Adicionar marcador para a localização atual
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="map-center-marker pulse"><i class="fa fa-location-arrow"></i></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    
    const marker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    currentMarkerRef.current = marker;
    
    // Adicionar marcadores para ecopontos
    addEcopointMarkers(map);
    
    // Adicionar marcadores de denúncias existentes
    fetchAndDisplayReports(map);
    
    // Guardar referência do mapa
    leafletMapRef.current = map;
    setMapInitialized(true);
  };

  // Função para adicionar marcadores de ecopontos ao mapa
  const addEcopointMarkers = (map) => {
    // Limpar marcadores anteriores
    if (ecopointMarkersRef.current.length > 0) {
      ecopointMarkersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      ecopointMarkersRef.current = [];
    }
    
    // Adicionar novos marcadores
    ecopoints.forEach(point => {
      // Criar ícone personalizado baseado no tipo de ponto
      let iconClass;
      switch(point.icon) {
        case 'recycle':
          iconClass = 'recycle-icon';
          break;
        case 'tint':
          iconClass = 'oil-icon';
          break;
        case 'leaf':
          iconClass = 'garden-icon';
          break;
        default:
          iconClass = 'eco-icon';
      }
      
      const ecoIcon = L.divIcon({
        className: `ecopoint-marker ${iconClass}`,
        html: `<div class="ecopoint-icon">${getIconHTML(point.icon)}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      // Criar marcador e adicionar ao mapa
      const marker = L.marker([point.lat, point.lng], { icon: ecoIcon })
        .addTo(map)
        .bindPopup(`
          <div class="ecopoint-popup">
            <h3>${point.name}</h3>
            <p>${point.address} - ${point.distance} km</p>
            <div class="ecopoint-services">
              ${point.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
            </div>
            <a href="${getDirectionsUrl(point.lat, point.lng)}" target="_blank" class="directions-link">
              Ver rotas
            </a>
          </div>
        `);
      
      ecopointMarkersRef.current.push(marker);
    });
  };

  // Nova função para buscar e exibir denúncias do Firebase
  const fetchAndDisplayReports = async (map) => {
    try {
      // Aqui você faria uma chamada para o Firebase Firestore
      // para buscar denúncias existentes
      const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore');
      const db = getFirestore();
      
      // Limpar marcadores anteriores
      if (reportMarkersRef.current.length > 0) {
        reportMarkersRef.current.forEach(marker => {
          map.removeLayer(marker);
        });
        reportMarkersRef.current = [];
      }
      
      // Buscar denúncias pendentes (não resolvidas)
      const q = query(collection(db, "reports"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const report = doc.data();
        
        // Criar ícone para denúncia
        const reportIcon = L.divIcon({
          className: 'report-marker',
          html: '<div class="report-icon"><i class="fa fa-exclamation-triangle"></i></div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });
        
        // Criar marcador e popup
        const marker = L.marker([report.location.lat, report.location.lng], { icon: reportIcon })
          .addTo(map)
          .bindPopup(`
            <div class="report-popup">
              <h3>Denúncia de descarte</h3>
              <div class="report-image">
                <img src="${report.imageUrl}" alt="Descarte irregular" />
              </div>
              <p><strong>Tipo:</strong> ${getWasteTypeLabel(report.wasteType)}</p>
              <p><strong>Descrição:</strong> ${report.description || 'Sem descrição'}</p>
              <p><strong>Status:</strong> Pendente</p>
              <p><strong>Data:</strong> ${formatTimestamp(report.createdAt)}</p>
            </div>
          `);
        
        reportMarkersRef.current.push(marker);
      });
    } catch (error) {
      console.error("Erro ao buscar denúncias:", error);
    }
  };

  // Função auxiliar para obter rótulo do tipo de resíduo
  const getWasteTypeLabel = (wasteType) => {
    const types = {
      'plastic': 'Plástico',
      'glass': 'Vidro',
      'paper': 'Papel/Papelão',
      'electronic': 'Eletrônico',
      'construction': 'Entulho',
      'furniture': 'Móveis',
      'other': 'Outro'
    };
    
    return types[wasteType] || 'Não especificado';
  };

  // Função auxiliar para formatar timestamp do Firebase
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Data desconhecida';
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Função auxiliar para obter HTML do ícone
  const getIconHTML = (icon) => {
    switch(icon) {
      case 'recycle':
        return '<i class="fa fa-recycle"></i>';
      case 'tint':
        return '<i class="fa fa-tint"></i>';
      case 'leaf':
        return '<i class="fa fa-leaf"></i>';
      default:
        return '<i class="fa fa-recycle"></i>';
    }
  };

  // Iniciar rastreamento GPS
  const startTracking = () => {
    if (navigator.geolocation) {
      setIsTracking(true);
      
      // Verificar se o navegador suporta geolocalização
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Inicializar mapa se ainda não foi inicializado
          if (!mapInitialized) {
            initializeMap(latitude, longitude);
          } else if (leafletMapRef.current && currentMarkerRef.current) {
            // Atualizar posição do marcador e centralizar mapa
            currentMarkerRef.current.setLatLng([latitude, longitude]);
            leafletMapRef.current.setView([latitude, longitude], leafletMapRef.current.getZoom());
          }
          
          // Atualizar distâncias dos ecopontos com base na localização atual
          updateEcopointsDistances(latitude, longitude);
          
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          setIsTracking(false);
        },
        { 
          enableHighAccuracy: true, // Usar GPS de alta precisão
          maximumAge: 0, // Sempre obter posição mais recente
          timeout: 5000 // Timeout para obter a localização
        }
      );
      
      setWatchId(id);
    } else {
      setLocationError("Seu navegador não suporta geolocalização");
    }
  };

  // Parar rastreamento GPS
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  // Atualizar distâncias dos ecopontos
  const updateEcopointsDistances = (lat, lng) => {
    const updatedEcopoints = ecopoints.map(point => {
      // Calcular distância usando a fórmula de Haversine
      const distance = calculateDistance(lat, lng, point.lat, point.lng);
      return {
        ...point,
        distance: parseFloat(distance.toFixed(1))
      };
    });
    
    // Ordenar por distância
    updatedEcopoints.sort((a, b) => a.distance - b.distance);
    
    setEcopoints(updatedEcopoints);
    
    // Atualizar marcadores no mapa se ele existir
    if (leafletMapRef.current) {
      addEcopointMarkers(leafletMapRef.current);
    }
  };

  // Fórmula de Haversine para calcular distância entre dois pontos em km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distância em km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  // Iniciar rastreamento quando componente for montado
  useEffect(() => {
    startTracking();
    
    // Limpar o rastreamento quando o componente for desmontado
    return () => {
      stopTracking();
      
      // Limpar mapa quando o componente for desmontado
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
    };
  }, []);

  // Renderizar ícone do ecoponto baseado no tipo
  const renderEcopointIcon = (icon) => {
    switch(icon) {
      case 'recycle':
        return <FaRecycle />;
      case 'tint':
        return <FaTint />;
      case 'leaf':
        return <FaLeaf />;
      default:
        return <FaRecycle />;
    }
  };

  // Obter link para direções no Google Maps
  const getDirectionsUrl = (lat, lng) => {
    if (!currentLocation) return "#";
    
    return `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${lat},${lng}`;
  };

  // Centralizar mapa na localização do usuário
  const centerMapOnUser = () => {
    if (leafletMapRef.current && currentLocation) {
      leafletMapRef.current.setView([currentLocation.lat, currentLocation.lng], 15);
    } else {
      startTracking();
    }
  };

  return (
    <div className="main-content">
      <div className="map-container">
        {/* Mapa Leaflet */}
        <div 
          ref={mapRef}
          className={`map-placeholder ${isTracking ? 'tracking-active' : ''}`}
          style={{ height: '100%', width: '100%' }}
        >
          {locationError ? (
            <div className="location-error">
              <p>{locationError}</p>
              <button onClick={startTracking} className="retry-btn">
                Tentar novamente
              </button>
            </div>
          ) : (!currentLocation && !mapInitialized) ? (
            <div className="loading-location">
              <div className="loading-spinner"></div>
              <p>Obtendo sua localização...</p>
            </div>
          ) : null}
        </div>
        
        {/* Botão de denúncia integrado ao mapa */}
        {currentLocation && (
          <ReportButton 
            currentLocation={currentLocation} 
            leafletMap={leafletMapRef.current}
            onReportSubmitted={() => {
              // Atualizar marcadores de denúncias quando uma nova for enviada
              if (leafletMapRef.current) {
                fetchAndDisplayReports(leafletMapRef.current);
              }
            }}
          />
        )}
        
        <div className="map-controls">
          <button 
            className={`map-control-btn ${isTracking ? 'active' : ''}`}
            onClick={isTracking ? stopTracking : startTracking}
            title={isTracking ? "Parar rastreamento" : "Iniciar rastreamento"}
          >
            <FaLocationArrow />
          </button>
          <button 
            className="map-control-btn"
            onClick={centerMapOnUser}
            title="Centralizar no usuário"
          >
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
          {ecopoints.map(point => (
            <div className="ecopoint-item" key={point.id}>
              <div className="ecopoint-icon">
                {renderEcopointIcon(point.icon)}
              </div>
              <div className="ecopoint-info">
                <h3>{point.name}</h3>
                <p>{point.address} - {point.distance} km</p>
                <div className="ecopoint-services">
                  {point.services.map((service, idx) => (
                    <span className="service-tag" key={idx}>{service}</span>
                  ))}
                </div>
              </div>
              <a 
                href={getDirectionsUrl(point.lat, point.lng)}
                className="directions-btn"
                target="_blank"
                rel="noopener noreferrer"
                title="Ver rotas no Google Maps"
              >
                <MdDirections />
              </a>
            </div>
          ))}
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