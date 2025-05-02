import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth';
import { getFirestore, collection, getDocs, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import './AdminPoints.css';

const AdminPoints = () => {
  const { currentUser, ecoToastSuccess, ecoToastError } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [newPermissionLevel, setNewPermissionLevel] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'ascending' });
  const [currentUserData, setCurrentUserData] = useState(null);

  // Secret password to access this admin page
  const SECRET_ACCESS_KEY = 'ecoadmin123';

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Fetch current user data to check permission level
    const fetchCurrentUserData = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserData(userData);
          
          // If user doesn't have admin permission (level 4)
          if (userData.nivelPermissao !== 4) {
            // Ask for admin access code
            const accessCode = prompt('Digite o código de acesso para administração:');
            
            if (accessCode === SECRET_ACCESS_KEY) {
              // Grant admin permission if correct code is entered
              await updateDoc(doc(db, "users", currentUser.uid), {
                nivelPermissao: 4
              });
              ecoToastSuccess("Acesso de administrador concedido!");
              // Update local state
              setCurrentUserData({
                ...userData,
                nivelPermissao: 4
              });
            } else {
              // Redirect if wrong code
              ecoToastError('Acesso não autorizado');
              navigate('/');
              return;
            }
          }
        } else {
          ecoToastError("Perfil de usuário não encontrado");
          navigate('/');
          return;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        ecoToastError("Erro ao verificar permissões");
        navigate('/');
        return;
      }
    };

    fetchCurrentUserData().then(() => {
      fetchUsers();
    });
  }, [currentUser, navigate, ecoToastError, ecoToastSuccess]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const usersSnapshot = await getDocs(collection(db, "users"));
      
      const usersData = [];
      usersSnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
          lastPointsAdded: 0,
          lastPointsDate: null
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      ecoToastError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserForPoints = (user) => {
    setSelectedUser(user);
    setPointsToAdd(0);
    setPointsModalOpen(true);
  };

  const handleSelectUserForPermission = (user) => {
    setSelectedUser(user);
    setNewPermissionLevel(user.nivelPermissao || 1);
    setPermissionModalOpen(true);
  };

  const handleAddPoints = async () => {
    if (!selectedUser || pointsToAdd <= 0) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", selectedUser.id);
      
      // Update user's points in Firestore
      await updateDoc(userRef, {
        pontos: increment(pointsToAdd)
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                pontos: (user.pontos || 0) + pointsToAdd,
                lastPointsAdded: pointsToAdd,
                lastPointsDate: new Date()
              } 
            : user
        )
      );
      
      ecoToastSuccess(`${pointsToAdd} pontos adicionados para ${selectedUser.nome}`);
      setPointsModalOpen(false);
    } catch (error) {
      console.error("Error adding points:", error);
      ecoToastError("Erro ao adicionar pontos");
    }
  };

  const handleUpdatePermission = async () => {
    if (!selectedUser) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", selectedUser.id);
      
      // Update user's permission level in Firestore
      await updateDoc(userRef, {
        nivelPermissao: newPermissionLevel
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                nivelPermissao: newPermissionLevel
              } 
            : user
        )
      );
      
      const permissionLabels = {
        1: "Usuário Normal",
        2: "Estrela Bronze",
        3: "Estrela Prata",
        4: "Administrador (Estrela Ouro)"
      };
      
      ecoToastSuccess(`Nível de acesso de ${selectedUser.nome} alterado para: ${permissionLabels[newPermissionLevel]}`);
      setPermissionModalOpen(false);
    } catch (error) {
      console.error("Error updating permission:", error);
      ecoToastError("Erro ao atualizar nível de permissão");
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    ecoToastSuccess("Lista de usuários atualizada");
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date.seconds * 1000).toLocaleString('pt-BR');
  };

  // Get permission badge/level display
  const getPermissionBadge = (level) => {
    if (!level || level === 1) return <span className="badge normal">Usuário</span>;
    
    switch (level) {
      case 2:
        return <span className="badge bronze">★ Bronze</span>;
      case 3:
        return <span className="badge silver">★ Prata</span>;
      case 4:
        return <span className="badge gold">★ Administrador</span>;
      default:
        return <span className="badge normal">Usuário</span>;
    }
  };

  // Apply search filter and sorting to users
  const filteredAndSortedUsers = [...users]
    .filter(user => 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.celular?.toString().includes(searchTerm))
    )
    .sort((a, b) => {
      // Handle undefined values
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      
      // Basic comparison
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Painel Administrador</h1>
        <div className="admin-actions">
          <button className="refresh-button" onClick={handleRefresh}>
            Atualizar Lista
          </button>
          <button className="back-button" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="search-results">
          {filteredAndSortedUsers.length} usuários encontrados
        </span>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('nome')} className="sortable">
                  Nome
                  {sortConfig.key === 'nome' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email
                  {sortConfig.key === 'email' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('nivelPermissao')} className="sortable">
                  Nível
                  {sortConfig.key === 'nivelPermissao' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('pontos')} className="sortable">
                  Pontos
                  {sortConfig.key === 'pontos' && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
                <th>Última Adição</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length > 0 ? (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nome || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{getPermissionBadge(user.nivelPermissao)}</td>
                    <td className="points-cell">{user.pontos || 0}</td>
                    <td className={user.lastPointsAdded > 0 ? 'points-added' : ''}>
                      {user.lastPointsAdded > 0 ? `+${user.lastPointsAdded}` : '-'}
                    </td>
                    <td>{user.lastPointsDate ? formatDate(user.lastPointsDate) : '-'}</td>
                    <td className="actions-cell">
                      <button 
                        className="add-points-button"
                        onClick={() => handleSelectUserForPoints(user)}
                      >
                        Adicionar Pontos
                      </button>
                      <button 
                        className="permission-button"
                        onClick={() => handleSelectUserForPermission(user)}
                      >
                        Permissões
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-users">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para adicionar pontos */}
      {pointsModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Adicionar Pontos</h2>
              <button className="close-button" onClick={() => setPointsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="user-info">
                <p><strong>Usuário:</strong> {selectedUser.nome || 'Sem nome'}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Pontos atuais:</strong> {selectedUser.pontos || 0}</p>
              </div>
              
              <div className="points-input">
                <label htmlFor="points">Quantidade de pontos a adicionar:</label>
                <input
                  id="points"
                  type="number"
                  min="0"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="quick-points">
                <button onClick={() => setPointsToAdd(5)}>+5</button>
                <button onClick={() => setPointsToAdd(10)}>+10</button>
                <button onClick={() => setPointsToAdd(20)}>+20</button>
                <button onClick={() => setPointsToAdd(50)}>+50</button>
                <button onClick={() => setPointsToAdd(100)}>+100</button>
              </div>
              
              <div className="new-total">
                <p>
                  <strong>Novo total:</strong> {(selectedUser.pontos || 0) + pointsToAdd} pontos
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={handleAddPoints}
                disabled={pointsToAdd <= 0}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPoints;