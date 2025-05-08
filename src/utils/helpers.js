
// src/utils/helpers.js
export const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje às " + date.toLocaleTimeString('pt-BR', { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem às " + date.toLocaleTimeString('pt-BR', { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: "2-digit", minute: "2-digit" });
    }
  };
  
  export const getReportTypeLabel = (type) => {
    switch (type) {
      case 'pollution':
        return 'Poluição';
      case 'waste':
        return 'Descarte irregular';
      case 'preservation':
        return 'Área de preservação';
      case 'initiative':
        return 'Iniciativa ecológica';
      default:
        return 'Outro';
    }
  };
  
  // src/utils/mapIcons.js
  import L from 'leaflet';
  
  // Custom map marker icons
  export const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color:${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };
  
  export const icons = {
    pollution: createCustomIcon('#FF5252'),
    waste: createCustomIcon('#FFC107'),
    preservation: createCustomIcon('#4CAF50'),
    initiative: createCustomIcon('#2196F3')
  };