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

  const handleMapDemo = async () => {
    try {
      await loginAsAnonymous();
      navigate('/demomap');
    } catch (error) {
      console.error('Failed to access map demo:', error);
    }
  };

  return (
    <div className="container">
      <div className="demoCard">
        <img src="/src/assets/icon/icon.webp" alt="ColetaAI Logo" className="icon" />
        <h1 className="title">Demonstração ColetaAi</h1>
        
        <div className="section">
          <button className="button" onClick={handleDemoAccess}>
            Demo Gestão de solicitações e denúncias
          </button>
          
          <button className="button secondaryButton" onClick={handleFormDemo}>
            Demo Realizar denúncia/solicitação
          </button>

          <button className="button secondaryButton" onClick={handleMapDemo}>
            Demo Mapa e Monitoramento
          </button>
        </div>

        <div className="infoText">
          Explore as funcionalidades do ColetaAI em modo demonstração
        </div>
      </div>
    </div>
  );
};

export default DemoPage;