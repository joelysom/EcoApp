import React, { useState, useEffect } from 'react';
import { FaUser, FaQrcode, FaTint } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './EcoApp.css';

const Home = () => {
  const { currentUser, ecoToastError } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const db = getFirestore();
        
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          ecoToastError("Dados do usuário não encontrados.");
        }

        // Fetch top users for ranking
        const rankingQuery = query(
          collection(db, "users"),
          orderBy("pontos", "desc"),
          limit(10)
        );
        
        const rankingSnapshot = await getDocs(rankingQuery);
        const rankingData = [];
        
        rankingSnapshot.forEach((doc) => {
          const data = doc.data();
          rankingData.push({
            id: doc.id,
            nome: data.nome || "Usuário",
            pontos: data.pontos || 0,
            isCurrentUser: doc.id === currentUser.uid
          });
        });
        
        setTopUsers(rankingData);

        // Fetch user's recent activities
        // This would typically be in a separate collection
        // For now, we'll use placeholder data
        setRecentActivities([
          { 
            type: 'oil', 
            title: 'Descarte de óleo', 
            date: new Date(), 
            points: 50 
          },
          { 
            type: 'qr', 
            title: 'Escanear QR code', 
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
            points: 20 
          }
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        ecoToastError("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, ecoToastError]);

  // Format date to display "Today", "Yesterday" or the actual date
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dados ecológicos...</p>
      </div>
    );
  }

  return (
    <>
      <div className="points-card">
        <h1 className="points-value">{userData?.pontos || 0}</h1>
        <p className="points-label">Pontos ecológicos</p>
      </div>

      <section className="recent-activities">
        <h2 className="section-title">Atividades recentes</h2>
        {recentActivities.length > 0 ? (
          <div className="activities-grid">
            {recentActivities.map((activity, index) => (
              <div 
                key={index} 
                className={`activity-card ${activity.type === 'oil' ? 'oil-disposal' : 'qr-code'}`}
              >
                <div className="activity-icon">
                  {activity.type === 'oil' ? <FaTint /> : <FaQrcode />}
                </div>
                <div className="activity-info">
                  <h3>{activity.title}</h3>
                  <p>{formatDate(activity.date)}</p>
                  <p className="activity-points">+{activity.points} pontos</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Você ainda não tem atividades recentes.</p>
            <Link to="/scan" className="eco-button">Iniciar atividade</Link>
          </div>
        )}
      </section>

      <section className="community-ranking">
        <h2 className="section-title">Classificação comunitária</h2>
        {topUsers.length > 0 ? (
          <div className="ranking-list">
            {topUsers.map((user, index) => (
              <div 
                key={user.id} 
                className={`ranking-item rank-${index + 1} ${user.isCurrentUser ? 'current-user' : ''}`}
              >
                <div className="rank-number">{index + 1}</div>
                <div className="rank-user-avatar">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="rank-user-name">
                  {user.nome}
                  {user.isCurrentUser && <span className="user-indicator"> (Você)</span>}
                </div>
                <div className="rank-points">{user.pontos}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum usuário no ranking ainda.</p>
          </div>
        )}
      </section>

      <section className="local-offers">
        <h2 className="section-title">Ofertas para negócios locais</h2>
        <div className="offers-list">
          <div className="offer-card">
            <div className="offer-image"></div>
            <div className="offer-content">
              <h3 className="offer-title">Desconto em Produtos Orgânicos</h3>
              <p className="offer-description">Troque 250 pontos por 15% de desconto na próxima compra</p>
              <div className="offer-action">
                <button 
                  className="offer-button"
                  disabled={userData?.pontos < 250}
                  title={userData?.pontos < 250 ? "Pontos insuficientes" : ""}
                >
                  Resgatar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="see-more-container">
          <Link to="/rewards" className="see-more-button">Ver mais</Link>
        </div>
      </section>
    </>
  );
};

export default Home;