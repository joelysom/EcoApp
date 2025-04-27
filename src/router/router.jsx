// src/router/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home.jsx';
import Points from '../pages/PointsPage';
import Map from '../pages/MapPage';
import Rewards from '../pages/RewardsPage';
import Market from '../pages/MarketPage/index.jsx';
import Login from '../pages/LoginPage';
import Cadastro from '../pages/CadastroPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
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
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/cadastro",
        element: <Cadastro />
      }
    ]
  }
]);

export default router;