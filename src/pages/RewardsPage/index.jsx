import React, { useState, useEffect } from 'react';
import { FaChevronRight, FaLeaf, FaShoppingBag, FaCoffee, FaBus, FaStore, FaShareAlt, FaHistory } from 'react-icons/fa';
import { MdNotifications, MdClose, MdFilterList } from 'react-icons/md';
import { useAuth } from '../../auth/auth';
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import './RewardsPage.css';

const RewardsContent = () => {
  // Estados para controlar as funcionalidades de UI
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sortBy: 'newest',
    minPoints: 0,
    maxPoints: 1000,
    categories: []
  });
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [notificationCount, setNotificationCount] = useState(2);
  
  // Estados para dados do usuário
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myRewards, setMyRewards] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  
  // Autenticação
  const { currentUser, ecoToastError, ecoToastSuccess } = useAuth();
  
  // Bloquear o scroll quando um modal estiver aberto
  useEffect(() => {
    if (showFilterModal || selectedReward || showRedeemModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showFilterModal, selectedReward, showRedeemModal]);

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        return;
      }
      
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Buscar documento do usuário
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Atualizar pontos do usuário
          setUserPoints(userData.pontos || 0);
          
          // Buscar recompensas resgatadas
          const userRewards = userData.rewards || [];
          setMyRewards(userRewards);
          
          // Buscar histórico de resgates
          const userHistory = userData.redeemHistory || [];
          setRedeemHistory(userHistory);
          
          // Verificar notificações de novas recompensas
          const lastVisit = userData.lastRewardsVisit ? userData.lastRewardsVisit.toDate() : null;
          
          if (lastVisit) {
            // Contar recompensas adicionadas desde a última visita
            const newRewardsCount = allRewards.filter(reward => {
              // Aqui estamos usando uma data de exemplo para cada recompensa
              // Na implementação real, cada recompensa teria um timestamp de criação
              const rewardAddedDate = new Date(reward.id * 1000000); // Simulação
              return rewardAddedDate > lastVisit;
            }).length;
            
            setNotificationCount(newRewardsCount);
            setShowNotification(newRewardsCount > 0);
          }
          
          // Atualizar a data da última visita à página de recompensas
          await updateDoc(doc(db, "users", currentUser.uid), {
            lastRewardsVisit: Timestamp.now()
          });
        } else {
          ecoToastError("Dados do usuário não encontrados.");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        ecoToastError("Erro ao carregar seus dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, ecoToastError]);

  // Lista completa de recompensas
  const allRewards = [
    {
      id: 1,
      title: 'Desconto em Produtos Orgânicos',
      vendor: 'Mercado Verde',
      description: '15% de desconto na próxima compra',
      points: 250,
      category: 'Produtos',
      icon: <FaLeaf />,
      iconBg: '#88cc14',
      expiry: '30/05/2025',
      isNew: true,
      fullDescription: 'Apresente este cupom na próxima compra de produtos orgânicos no Mercado Verde e ganhe 15% de desconto em todos os itens da categoria orgânicos. Válido para compras acima de R$50,00.'
    },
    {
      id: 2,
      title: 'Café ou Chá Grátis',
      vendor: 'Café Sustentável',
      description: 'Bebida quente de até 300ml',
      points: 100,
      category: 'Comida',
      icon: <FaCoffee />,
      iconBg: '#cc3814',
      expiry: '15/05/2025',
      isNew: true,
      fullDescription: 'Resgate uma bebida quente de até 300ml no Café Sustentável. Você pode escolher entre café, chá ou chocolate quente. Válido de segunda a sexta, das 10h às 18h.'
    },
    {
      id: 3,
      title: 'Passe de Transporte',
      vendor: 'Transporte Público',
      description: '1 dia de passes ilimitados',
      points: 350,
      category: 'Transporte',
      icon: <FaBus />,
      iconBg: '#145acc',
      expiry: '31/05/2025',
      isNew: false,
      fullDescription: 'Resgate um passe de transporte válido por 24 horas para uso ilimitado em ônibus, metrô e trens urbanos. Apresente o código QR gerado ao motorista ou nas estações participantes.'
    },
    {
      id: 4,
      title: 'Sacola Ecológica',
      vendor: 'Eco Store',
      description: 'Sacola reutilizável de algodão',
      points: 200,
      category: 'Produtos',
      icon: <FaShoppingBag />,
      iconBg: '#9a14cc',
      expiry: '20/06/2025',
      isNew: false,
      fullDescription: 'Resgate uma sacola ecológica de algodão orgânico produzida de forma sustentável. Tamanho padrão 40x35cm, resistente e lavável. Retire na loja Eco Store mais próxima.'
    },
    {
      id: 5,
      title: 'Desconto em Restaurante Vegano',
      vendor: 'Vegan Food',
      description: '20% de desconto no prato principal',
      points: 300,
      category: 'Comida',
      icon: <FaCoffee />,
      iconBg: '#42b45d',
      expiry: '15/05/2025',
      isNew: false,
      fullDescription: 'Apresente este cupom e ganhe 20% de desconto em qualquer prato principal do cardápio do restaurante Vegan Food. Não cumulativo com outras promoções.'
    },
    {
      id: 6,
      title: 'Aluguel de Bicicleta',
      vendor: 'Eco Bikes',
      description: '2 horas grátis',
      points: 180,
      category: 'Transporte',
      icon: <FaBus />,
      iconBg: '#f5843e',
      expiry: '10/06/2025',
      isNew: false,
      fullDescription: 'Resgate 2 horas gratuitas de aluguel de bicicleta na rede Eco Bikes. Válido para qualquer estação da cidade. Use o código QR gerado para desbloquear a bicicleta.'
    }
  ];

  // Categorias disponíveis
  const categories = ['Todos', 'Comida', 'Transporte', 'Produtos'];

  // Filtrar recompensas baseado na categoria ativa
  const filteredRewards = allRewards.filter(reward => 
    activeCategory === 'Todos' || reward.category === activeCategory
  );

  // Função para lidar com o resgate de recompensas
  const handleRedeem = (reward) => {
    if (userPoints < reward.points) {
      ecoToastError("Pontos insuficientes para resgatar esta recompensa.");
      return;
    }
    
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  // Gerar código aleatório para o cupom
  const generateRewardCode = (rewardId) => {
    const prefix = 'ECO';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}-${rewardId}${random}-${date}`;
  };

  // Função para confirmar o resgate
  const confirmRedeem = async () => {
    if (!currentUser || !selectedReward) {
      return;
    }
    
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", currentUser.uid);
      
      // Data atual para registro do resgate
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 15); // Expiração em 15 dias
      
      // Gerar código do cupom
      const code = generateRewardCode(selectedReward.id);
      
      // Objeto da recompensa resgatada
      const redeemedReward = {
        id: Date.now(), // ID único
        rewardId: selectedReward.id,
        title: selectedReward.title,
        vendor: selectedReward.vendor,
        description: selectedReward.description,
        redeemedDate: now,
        expiryDate: expiryDate,
        status: 'Válido',
        code: code,
        iconBg: selectedReward.iconBg,
        icon: selectedReward.icon ? selectedReward.icon.type.name : 'FaStore',
      };
      
      // Objeto do histórico de resgate
      const historyEntry = {
        id: Date.now(),
        rewardId: selectedReward.id,
        title: selectedReward.title,
        vendor: selectedReward.vendor,
        redeemedDate: now,
        expiryDate: expiryDate,
        status: 'Válido',
        points: selectedReward.points
      };
      
      // Atualizar o documento do usuário
      await updateDoc(userRef, {
        pontos: userPoints - selectedReward.points,
        rewards: arrayUnion(redeemedReward),
        redeemHistory: arrayUnion(historyEntry)
      });
      
      // Atualizar o estado local
      setUserPoints(userPoints - selectedReward.points);
      setMyRewards([...myRewards, redeemedReward]);
      setRedeemHistory([...redeemHistory, historyEntry]);
      
      // Fechar o modal
      setShowRedeemModal(false);
      setSelectedReward(null);
      
      // Mostrar mensagem de sucesso
      ecoToastSuccess(`Recompensa "${selectedReward.title}" resgatada com sucesso!`);
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error);
      ecoToastError("Erro ao processar o resgate. Tente novamente.");
    }
  };

  // Função para aplicar os filtros
  const applyFilters = () => {
    setShowFilterModal(false);
    // A lógica completa de filtro seria implementada aqui
  };

  // Função para compartilhar uma recompensa
  const shareReward = (reward, e) => {
    // Prevenir a propagação para não abrir o modal de detalhes
    if (e) e.stopPropagation();
    
    // Aqui implementaríamos o compartilhamento
    alert(`Compartilhando: ${reward.title}`);
  };

  // Função para fechar a notificação
  const closeNotification = () => {
    setShowNotification(false);
    setNotificationCount(0);
  };

  // Função para fechar qualquer modal quando clicar fora dele
  const handleOverlayClick = (e) => {
    // Só fecha se clicar diretamente no overlay e não em um elemento dentro dele
    if (e.target.className === 'modal-overlay') {
      setShowFilterModal(false);
      setSelectedReward(null);
      setShowRedeemModal(false);
    }
  };

  // Formatar data para display
  const formatDate = (date) => {
    if (!date) return '';
    
    if (date instanceof Date) {
      return date.toLocaleDateString('pt-BR');
    }
    
    // Se for um objeto Timestamp do Firestore ou tiver propriedade toDate()
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('pt-BR');
    }
    
    // Se for uma string, retornar como está
    return date;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando suas recompensas...</p>
      </div>
    );
  }

  return (
    <main className="main-content">
      {/* Notificação de novas recompensas */}
      {showNotification && (
        <div className="notification-card">
          <div className="notification-content">
            <div className="notification-icon">
              <MdNotifications />
            </div>
            <div className="notification-text">
              <h3>Novas recompensas disponíveis!</h3>
              <p>{notificationCount} novas recompensas foram adicionadas. Confira!</p>
            </div>
          </div>
          <button className="notification-close" onClick={closeNotification}>
            <MdClose />
          </button>
        </div>
      )}

      <div className="points-card">
        <h1 className="points-value">{userPoints}</h1>
        <p className="points-label">Pontos ecológicos disponíveis</p>
      </div>

      <div className="rewards-filter">
        <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
          <MdFilterList />
          <span>Filtrar</span>
        </button>
        <div className="category-tabs">
          {categories.map(category => (
            <button 
              key={category}
              className={`category-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <section className="rewards-list">
        {filteredRewards.map(reward => (
          <div className="reward-card" key={reward.id} onClick={() => setSelectedReward(reward)}>
            <div className="reward-img" style={{backgroundColor: reward.iconBg}}>
              {reward.isNew && <span className="new-badge">Novo</span>}
              {reward.icon && React.cloneElement(reward.icon, {style: {fontSize: '24px', color: 'white'}})}
            </div>
            <div className="reward-content">
              <div className="reward-details">
                <h3 className="reward-title">{reward.title}</h3>
                <p className="reward-vendor">{reward.vendor}</p>
                <p className="reward-description">{reward.description}</p>
                <div className="reward-expiry">Válido até {reward.expiry}</div>
              </div>
              <div className="reward-actions">
                <div className="reward-action-buttons">
                  <button 
                    className="reward-info-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReward(reward);
                    }}
                  >
                    Detalhes
                  </button>
                  <button 
                    className="reward-share-btn" 
                    onClick={(e) => shareReward(reward, e)}
                  >
                    <FaShareAlt />
                  </button>
                </div>
                <div className="reward-redeem">
                  <span className="reward-points">{reward.points} pts</span>
                  <button 
                    className="reward-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedeem(reward);
                    }}
                    disabled={userPoints < reward.points}
                    style={userPoints < reward.points ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="my-rewards">
        <div className="section-header">
          <h2 className="section-title">Minhas recompensas</h2>
          <button className="view-all-btn" onClick={() => alert('Ver todas as recompensas')}>
            Ver todas
          </button>
        </div>
        
        <div className="my-rewards-list">
          {myRewards.length > 0 ? (
            myRewards.map(reward => (
              <div className="my-reward-item" key={reward.id}>
                <div className="my-reward-icon" style={{backgroundColor: reward.iconBg}}>
                  {/* Renderizar o ícone correto com base no nome armazenado */}
                  {reward.icon === 'FaStore' ? <FaStore /> : 
                   reward.icon === 'FaLeaf' ? <FaLeaf /> :
                   reward.icon === 'FaCoffee' ? <FaCoffee /> :
                   reward.icon === 'FaBus' ? <FaBus /> :
                   reward.icon === 'FaShoppingBag' ? <FaShoppingBag /> : <FaStore />}
                </div>
                <div className="my-reward-info">
                  <h3>{reward.title}</h3>
                  <p>Válido até {formatDate(reward.expiryDate)}</p>
                  <span className="reward-code">{reward.code}</span>
                </div>
                <div className="my-reward-action">
                  <FaChevronRight />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-rewards">
              <p>Você ainda não resgatou nenhuma recompensa.</p>
            </div>
          )}
        </div>
      </section>

      <section className="redeem-history">
        <div className="section-header">
          <h2 className="section-title">Histórico de resgates</h2>
          <button className="view-all-btn" onClick={() => alert('Ver todo histórico')}>
            Ver tudo
          </button>
        </div>
        
        <div className="history-list">
          {redeemHistory.length > 0 ? (
            redeemHistory.map(item => (
              <div className="history-item" key={item.id}>
                <div className={`history-status ${item.status === 'Expirado' ? 'expired' : 'used'}`}>
                  <FaHistory />
                </div>
                <div className="history-info">
                  <div className="history-details">
                    <h3>{item.title}</h3>
                    <p>{item.vendor}</p>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="history-date-points">
                    <div className="history-date">{formatDate(item.redeemedDate)}</div>
                    <div className="history-points">-{item.points} pts</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-history">
              <p>Ainda não há registros no histórico.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal para detalhes da recompensa */}
      {selectedReward && !showRedeemModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="reward-detail-modal">
            <div className="modal-header">
              <h2>Detalhes da Recompensa</h2>
              <button className="modal-close" onClick={() => setSelectedReward(null)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              <div className="reward-detail-img" style={{backgroundColor: selectedReward.iconBg}}>
                {selectedReward.icon && React.cloneElement(selectedReward.icon, {style: {fontSize: '36px', color: 'white'}})}
              </div>
              
              <h3 className="reward-detail-title">{selectedReward.title}</h3>
              <p className="reward-detail-vendor">{selectedReward.vendor}</p>
              
              <div className="reward-detail-section">
                <h4>Descrição</h4>
                <p>{selectedReward.fullDescription}</p>
              </div>
              
              <div className="reward-detail-info">
                <div className="detail-item">
                  <span className="detail-label">Pontos necessários:</span>
                  <span className="detail-value">{selectedReward.points} pts</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Válido até:</span>
                  <span className="detail-value">{selectedReward.expiry}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Categoria:</span>
                  <span className="detail-value">{selectedReward.category}</span>
                </div>
              </div>
              
              <div className="detail-actions">
                <button className="detail-share-btn" onClick={() => shareReward(selectedReward)}>
                  <FaShareAlt /> Compartilhar
                </button>
                <button 
                  className="detail-redeem-btn" 
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={userPoints < selectedReward.points}
                  style={userPoints < selectedReward.points ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  Resgatar por {selectedReward.points} pts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmação de resgate */}
      {showRedeemModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="redeem-modal">
            <div className="modal-header">
              <h2>Confirmar Resgate</h2>
              <button className="modal-close" onClick={() => setShowRedeemModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              <div className="redeem-confirmation">
                <p>Você está prestes a resgatar:</p>
                <h3>{selectedReward.title}</h3>
                <p className="redeem-vendor">{selectedReward.vendor}</p>
                
                <div className="redeem-points-summary">
                  <div className="points-row">
                    <span>Seus pontos:</span>
                    <span>{userPoints} pts</span>
                  </div>
                  <div className="points-row deduction">
                    <span>Resgate:</span>
                    <span>-{selectedReward.points} pts</span>
                  </div>
                  <div className="points-row total">
                    <span>Restante:</span>
                    <span>{userPoints - selectedReward.points} pts</span>
                  </div>
                </div>
                
                <div className="redeem-terms">
                  <p>Ao resgatar, você concorda com os termos e condições aplicáveis.</p>
                </div>
                
                <div className="redeem-actions">
                  <button className="cancel-btn" onClick={() => setShowRedeemModal(false)}>
                    Cancelar
                  </button>
                  <button className="confirm-btn" onClick={confirmRedeem}>
                    Confirmar Resgate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para filtros */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="filter-modal">
            <div className="modal-header">
              <h2>Filtrar Recompensas</h2>
              <button className="modal-close" onClick={() => setShowFilterModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              <div className="filter-section">
                <h3>Ordenar por</h3>
                <div className="radio-options">
                  <label>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      value="newest" 
                      checked={filterOptions.sortBy === 'newest'}
                      onChange={() => setFilterOptions({...filterOptions, sortBy: 'newest'})}
                    />
                    Mais recentes
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      value="points-low" 
                      checked={filterOptions.sortBy === 'points-low'}
                      onChange={() => setFilterOptions({...filterOptions, sortBy: 'points-low'})}
                    />
                    Pontos (menor para maior)
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      value="points-high" 
                      checked={filterOptions.sortBy === 'points-high'}
                      onChange={() => setFilterOptions({...filterOptions, sortBy: 'points-high'})}
                    />
                    Pontos (maior para menor)
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="sortBy" 
                      value="expiry" 
                      checked={filterOptions.sortBy === 'expiry'}
                      onChange={() => setFilterOptions({...filterOptions, sortBy: 'expiry'})}
                    />
                    Data de expiração
                  </label>
                </div>
              </div>
              
              <div className="filter-section">
                <h3>Pontos</h3>
                <div className="range-filter">
                  <div className="range-inputs">
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      value={filterOptions.minPoints}
                      onChange={(e) => setFilterOptions({...filterOptions, minPoints: parseInt(e.target.value)})}
                    />
                    <div className="range-values">
                      <span>{filterOptions.minPoints} pts</span>
                      <span>1000 pts</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="filter-section">
                <h3>Categorias</h3>
                <div className="checkbox-options">
                  {categories.filter(cat => cat !== 'Todos').map(category => (
                    <label key={category}>
                      <input 
                        type="checkbox" 
                        value={category}
                        checked={filterOptions.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterOptions({
                              ...filterOptions, 
                              categories: [...filterOptions.categories, category]
                            });
                          } else {
                            setFilterOptions({
                              ...filterOptions, 
                              categories: filterOptions.categories.filter(c => c !== category)
                            });
                          }
                        }}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-actions">
                <button 
                  className="reset-btn"
                  onClick={() => setFilterOptions({
                    sortBy: 'newest',
                    minPoints: 0,
                    maxPoints: 1000,
                    categories: []
                  })}
                >
                  Redefinir
                </button>
                <button className="apply-btn" onClick={applyFilters}>
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default RewardsContent;