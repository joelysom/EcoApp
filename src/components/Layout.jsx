// src/components/Layout/index.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from './ScrollToTop';

const Layout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/cadastro', '/profile', '/demo', '/fullform'].includes(location.pathname);

  return (
    <div className="app-container">
      <ScrollToTop />
      {!isAuthPage && <Header />}
      <main className="main-content">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default Layout;
