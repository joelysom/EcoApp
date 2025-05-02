import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import logo from '../assets/icon/icon.webp';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const { currentUser, logout } = useAuth();
  
  // Get the first letter of the user's display name or email if logged in
  const getUserInitial = () => {
    if (!currentUser) return null;
    
    if (currentUser.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    } else if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="app-logo" />
        </div>
        
        {currentUser && (
          <div className="profile-icon" onClick={handleProfileClick}>
            <span className="user-initial">{getUserInitial()}</span>
          </div>
        )}
      </div>
      
      <nav className="navigation">
        <Link to="/home" className={`nav-item ${pathname === '/home' ? 'active' : ''}`}>Home</Link>
        <Link to="/points" className={`nav-item ${pathname === '/points' ? 'active' : ''}`}>Pontos</Link>
        <Link to="/map" className={`nav-item ${pathname === '/map' ? 'active' : ''}`}>Mapa</Link>
        <Link to="/rewards" className={`nav-item ${pathname === '/rewards' ? 'active' : ''}`}>Recompensas</Link>
      </nav>
    </header>
  );
};

export default Header;