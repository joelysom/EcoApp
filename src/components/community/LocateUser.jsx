// src/components/community/LocateUser.js
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const LocateUser = ({ setUserLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    
    map.on('locationfound', (e) => {
      setUserLocation([e.latlng.lat, e.latlng.lng]);
    });
    
    map.on('locationerror', () => {
      console.log("Location access denied or unavailable");
      // Default location if user denies location access
      setUserLocation([-23.5505, -46.6333]); // São Paulo coordinates
      map.setView([-23.5505, -46.6333], 13);
    });
  }, [map, setUserLocation]);
  
  return null;
};

export default LocateUser;