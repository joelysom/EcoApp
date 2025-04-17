import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Importando páginas
import Home from '../pages/Home';

// Criando as rotas da aplicação
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  // Aqui você pode adicionar mais rotas no futuro
  // Exemplo:
  // {
  //   path: '/pontos',
  //   element: <Pontos />,
  // },
  // {
  //   path: '/mapa',
  //   element: <Mapa />,
  // },
  // {
  //   path: '/recompensas',
  //   element: <Recompensas />,
  // },
]);

export default router;