import React from 'react';
import { useNavigate } from 'react-router-dom';
import './demopage.css';
import { useAuth } from '../../auth/auth';

const DemoPage = () => {
  const navigate = useNavigate();
  const { loginAsAnonymous } = useAuth();

  const handleDemoAccess = async () => {
    try {
      await loginAsAnonymous();
      navigate('/admincontent');
    } catch (error) {
      console.error('Failed to access demo:', error);
    }
  };

  const handleFormDemo = async () => {
    try {
      await loginAsAnonymous();
      navigate('/fullform', { state: { isDemo: true } });
    } catch (error) {
      console.error('Failed to access form demo:', error);
    }
  };

  return (
    <div className="container">
      <div className="demoCard">
        <img src="/src/assets/icon/icon.webp" alt="EcoApp Logo" className="icon" />
        <h1 className="title">Demonstração ColetaAi</h1>
        
        <div className="section">
          <button className="button" onClick={handleDemoAccess}>
            Acessar Demo
          </button>
          
          <button className="button secondaryButton" onClick={handleFormDemo}>
            Demo Formulário
          </button>
        </div>

        <div className="infoText">
          Explore as funcionalidades do EcoApp em modo demonstração
        </div>
      </div>
    </div>
  );
};

export default DemoPage;