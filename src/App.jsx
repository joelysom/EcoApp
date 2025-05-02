import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router/router.jsx';  
import './index.css'; 
import { AuthProvider } from './auth/auth';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;