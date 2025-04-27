// src/components/ScrollToTop/index.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import './ScrollToTop.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Efeito para rolar para o topo quando a rota muda
  useEffect(() => {
    // Inicia a transição
    setIsTransitioning(true);
    
    // Rola para o topo imediatamente, sem esperar
    window.scrollTo(0, 0);
    
    // Remove o estado de transição após a animação
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Controla a visibilidade do botão de scroll
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Função para rolar suavemente para o topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Overlay de transição entre páginas */}
      {isTransitioning && <div className="page-transition-overlay" />}
      
      {/* Botão de scroll para o topo */}
      <button
        className={`scroll-to-top-btn ${isVisible ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
      >
        <ArrowUp size={24} />
        <span className="scroll-btn-ripple"></span>
      </button>
    </>
  );
};

export default ScrollToTop;