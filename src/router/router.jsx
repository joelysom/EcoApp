// src/router/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Points from '../pages/PointsPage';
import Map from '../pages/MapPage';
import Rewards from '../pages/RewardsPage';
import Market from '../pages/MarketPage/index.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/points",
    element: <Points />
  },
  {
    path: "/map",
    element: <Map />
  },
  {
    path: "/rewards",
    element: <Rewards />
  },
  {
    path: "/market",
    element: <Market />
  }
]);

export default router;