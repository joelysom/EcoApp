
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