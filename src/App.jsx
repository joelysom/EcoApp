import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router/router.jsx';  // Adicionando a extensão .jsx
import './index.css'; // Presumindo que você tenha seu CSS global aqui

function App() {
  return <RouterProvider router={router} />;
}

export default App;