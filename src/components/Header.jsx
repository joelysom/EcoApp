import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import logo from '../assets/icon/icon.webp';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const { currentUser, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Detectar scroll para adicionar efeitos visuais no header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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

  const handleLogoClick = () => {
    navigate('/home');
  };

  // Array de navegação para facilitar manutenção
  const navItems = [
    { path: '/home', label: 'Home' },
    { path: '/points', label: 'Pontos' },
    { path: '/map', label: 'Mapa' },
    { path: '/rewards', label: 'Rec.' },
    { path: '/comunidade', label: 'Comunidade' },
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-top">
        <div className="logo-container" onClick={handleLogoClick}>
          <img src={logo} alt="Logo" className="app-logo" />
        </div>
        
        {currentUser && (
          <div className="profile-icon" onClick={handleProfileClick} aria-label="Perfil de usuário">
            <span className="user-initial">{getUserInitial()}</span>
          </div>
        )}
      </div>
      
      <nav className="navigation" aria-label="Navegação principal">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;