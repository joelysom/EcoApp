import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Points from './pages/Points';
import Map from './pages/Map';
import Rewards from './pages/Rewards';
import Market from './pages/Market';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/points" element={<Points />} />
        <Route path="/map" element={<Map />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/market" element={<Market />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;