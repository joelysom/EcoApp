import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home.jsx';
import Points from '../pages/PointsPage';
import Map from '../pages/MapPage';
import Rewards from '../pages/RewardsPage';
import Market from '../pages/MarketPage/index.jsx';
import Login from '../pages/LoginPage';
import Cadastro from '../pages/CadastroPage';
import { useAuth } from '../auth/auth';
import Profile from '../pages/ProfilePage';
import AdminPoints from '../pages/AdminPages';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Create the router with a correct structure
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/cadastro",
    element: <Cadastro />
  },
  {
    path: "/adminpoints",
    element: <ProtectedRoute><AdminPoints /></ProtectedRoute>
  },
  // Fix: Use a separate route group for the protected routes
  {
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: "/home",
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
        path: "/profile",
        element: <Profile />
      }
    ]
  }
]);

export default router;