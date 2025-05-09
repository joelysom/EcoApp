import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { FaSearch, FaFilter, FaTrash, FaEye, FaEdit, FaCheck, FaTimes, FaExclamationTriangle, FaComment } from 'react-icons/fa';
import './AdminContent.css';

const AdminContent = () => {
  const { currentUser, ecoToastSuccess, ecoToastError } = useAuth();
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('solicitacoes');
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [filterOptions, setFilterOptions] = useState({
    dateRange: 'all',
    status: 'all',
    type: 'all',
    location: '' // Added location filter
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [showDeletedContent, setShowDeletedContent] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [responsibleEntity, setResponsibleEntity] = useState('');

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
      fetchSolicitacoes();
      fetchDenuncias();
    });
  }, [currentUser, navigate, ecoToastError, ecoToastSuccess]);

  // Fetch solicitacoes from Firestore
  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      let solicitacoesQuery;
      if (showDeletedContent) {
        solicitacoesQuery = query(
          collection(db, "community_posts"),
          orderBy("createdAt", "desc")
        );
      } else {
        solicitacoesQuery = query(
          collection(db, "community_posts"),
          where("deleted", "!=", true),
          orderBy("deleted", "asc"),
          orderBy("createdAt", "desc")
        );
      }
      
      const querySnapshot = await getDocs(solicitacoesQuery);
      const solicitacoesData = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const postData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt ? 
                    docSnapshot.data().createdAt.toDate() : 
                    new Date(),
          contentType: 'solicitacao',
          comments: []
        };
        
        // Fetch comments count
        const commentsQuery = query(
          collection(db, "community_posts", docSnapshot.id, "comments")
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        postData.commentsCount = commentsSnapshot.size;
        
        solicitacoesData.push(postData);
      }
      
      setSolicitacoes(solicitacoesData);
    } catch (error) {
      console.error("Error fetching solicitacoes:", error);
      ecoToastError("Erro ao carregar solicitações de descarte");
    } finally {
      setLoading(false);
    }
  };

  // Fetch denuncias from Firestore
  const fetchDenuncias = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      let denunciasQuery;
      if (showDeletedContent) {
        denunciasQuery = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc")
        );
      } else {
        denunciasQuery = query(
          collection(db, "reports"),
          where("deleted", "!=", true),
          orderBy("deleted", "asc"),
          orderBy("createdAt", "desc")
        );
      }
      
      const querySnapshot = await getDocs(denunciasQuery);
      const denunciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? 
                  doc.data().createdAt.toDate() : 
                  new Date(),
        contentType: 'denuncia'
      }));
      
      setDenuncias(denunciasData);
    } catch (error) {
      console.error("Error fetching denuncias:", error);
      ecoToastError("Erro ao carregar denúncias");
    } finally {
      setLoading(false);
    }
  };

  // Handle view item details
  const handleViewItem = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    
    try {
      const db = getFirestore();
      const itemRef = doc(db, selectedItem.contentType === 'solicitacao' ? "community_posts" : "reports", selectedItem.id);
      
      // Soft delete - mark as deleted instead of actually removing
      await updateDoc(itemRef, {
        deleted: true,
        deletedBy: currentUser.uid,
        deletedAt: new Date()
      });
      
      if (selectedItem.contentType === 'solicitacao') {
        setSolicitacoes(prevSolicitacoes => 
          prevSolicitacoes.map(solicitacao => 
            solicitacao.id === selectedItem.id 
              ? { ...solicitacao, deleted: true, deletedAt: new Date() } 
              : solicitacao
          )
        );
      } else {
        setDenuncias(prevDenuncias => 
          prevDenuncias.map(denuncia => 
            denuncia.id === selectedItem.id 
              ? { ...denuncia, deleted: true, deletedAt: new Date() } 
              : denuncia
          )
        );
      }
      
      ecoToastSuccess(`${selectedItem.contentType === 'solicitacao' ? 'Solicitação' : 'Denúncia'} removida com sucesso`);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      ecoToastError(`Erro ao remover ${selectedItem.contentType === 'solicitacao' ? 'solicitação' : 'denúncia'}`);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;
    
    if (!window.confirm(`ATENÇÃO: Esta ação é IRREVERSÍVEL! Tem certeza que deseja excluir permanentemente este conteúdo?`)) {
      return;
    }
    
    try {
      const db = getFirestore();
      const itemRef = doc(db, selectedItem.contentType === 'solicitacao' ? "community_posts" : "reports", selectedItem.id);
      
      // Permanently delete
      await deleteDoc(itemRef);
      
      if (selectedItem.contentType === 'solicitacao') {
        setSolicitacoes(prevSolicitacoes => prevSolicitacoes.filter(solicitacao => solicitacao.id !== selectedItem.id));
      } else {
        setDenuncias(prevDenuncias => prevDenuncias.filter(denuncia => denuncia.id !== selectedItem.id));
      }
      
      ecoToastSuccess(`${selectedItem.contentType === 'solicitacao' ? 'Solicitação' : 'Denúncia'} excluída permanentemente`);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      ecoToastError(`Erro ao excluir permanentemente ${selectedItem.contentType === 'solicitacao' ? 'solicitação' : 'denúncia'}`);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedItem || !newStatus) return;
    
    try {
      const db = getFirestore();
      const itemRef = doc(db, selectedItem.contentType === 'solicitacao' ? "community_posts" : "reports", selectedItem.id);
      
      await updateDoc(itemRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      });
      
      if (selectedItem.contentType === 'solicitacao') {
        setSolicitacoes(prevSolicitacoes => 
          prevSolicitacoes.map(solicitacao => 
            solicitacao.id === selectedItem.id 
              ? { ...solicitacao, status: newStatus, updatedAt: new Date() } 
              : solicitacao
          )
        );
      } else {
        setDenuncias(prevDenuncias => 
          prevDenuncias.map(denuncia => 
            denuncia.id === selectedItem.id 
              ? { ...denuncia, status: newStatus, updatedAt: new Date() } 
              : denuncia
          )
        );
      }
      
      ecoToastSuccess(`Status atualizado para: ${newStatus}`);
      setStatusModalOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      ecoToastError("Erro ao atualizar status");
    }
  };

  // Handle restore deleted item
  const handleRestoreItem = async (item) => {
    try {
      const db = getFirestore();
      const itemRef = doc(db, item.contentType === 'solicitacao' ? "community_posts" : "reports", item.id);
      
      await updateDoc(itemRef, {
        deleted: false,
        restoredBy: currentUser.uid,
        restoredAt: new Date()
      });
      
      if (item.contentType === 'solicitacao') {
        setSolicitacoes(prevSolicitacoes => 
          prevSolicitacoes.map(solicitacao => 
            solicitacao.id === item.id 
              ? { ...solicitacao, deleted: false, restoredAt: new Date() } 
              : solicitacao
          )
        );
      } else {
        setDenuncias(prevDenuncias => 
          prevDenuncias.map(denuncia => 
            denuncia.id === item.id 
              ? { ...denuncia, deleted: false, restoredAt: new Date() } 
              : denuncia
          )
        );
      }
      
      ecoToastSuccess(`${item.contentType === 'solicitacao' ? 'Solicitação' : 'Denúncia'} restaurada com sucesso`);
    } catch (error) {
      console.error("Error restoring item:", error);
      ecoToastError(`Erro ao restaurar ${item.contentType === 'solicitacao' ? 'solicitação' : 'denúncia'}`);
    }
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle filters change
  const handleFilterChange = (filterType, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply date filter
  const applyDateFilter = (item) => {
    if (filterOptions.dateRange === 'all') return true;
    
    const itemDate = item.createdAt;
    
    if (filterOptions.dateRange === 'custom') {
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      if (startDate && endDate) {
        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);
        return itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        return itemDate >= startDate;
      } else if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        return itemDate <= endDate;
      }
      return true;
    }
    
    const now = new Date();
    const dayStart = new Date(now.setHours(0, 0, 0, 0));
    
    switch (filterOptions.dateRange) {
      case 'today':
        return itemDate >= dayStart;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return itemDate >= weekStart;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        return itemDate >= monthStart;
      default:
        return true;
    }
  };

  // Apply status filter
  const applyStatusFilter = (item) => {
    if (filterOptions.status === 'all') return true;
    
    if (filterOptions.status === 'deleted') {
      return item.deleted === true;
    }
    
    if (filterOptions.status === 'active') {
      return !item.deleted;
    }
    
    return item.status === filterOptions.status;
  };

  // Apply waste type filter (for reports)
  const applyTypeFilter = (item) => {
    if (filterOptions.type === 'all') return true;
    if (item.contentType !== 'report') return true;
    
    return item.wasteType === filterOptions.type;
  };

  // Apply location filter
  const applyLocationFilter = (item) => {
    if (!filterOptions.location) return true;
    return item.location?.address?.toLowerCase().includes(filterOptions.location.toLowerCase());
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get waste type label
  const getWasteTypeLabel = (wasteType) => {
    const types = {
      'plastic': 'Plástico',
      'glass': 'Vidro',
      'paper': 'Papel/Papelão',
      'electronic': 'Eletrônico',
      'construction': 'Entulho',
      'furniture': 'Móveis',
      'organic': 'Orgânico',
      'other': 'Outro'
    };
    
    return types[wasteType] || 'Não especificado';
  };

  // Get status badge
  const getStatusBadge = (item) => {
    if (item.deleted) {
      return <span className="status-badge deleted">Removido</span>;
    }
    
    if (item.contentType === 'report') {
      switch (item.status) {
        case 'pending':
          return <span className="status-badge pending">Pendente</span>;
        case 'in_progress':
          return <span className="status-badge in-progress">Em andamento</span>;
        case 'resolved':
          return <span className="status-badge resolved">Resolvido</span>;
        case 'rejected':
          return <span className="status-badge rejected">Rejeitado</span>;
        default:
          return <span className="status-badge pending">Pendente</span>;
      }
    }
    
    return item.status ? 
      <span className={`status-badge ${item.status}`}>{item.status}</span> : 
      <span className="status-badge active">Ativo</span>;
  };

  // Apply search, filters and sorting
  const getFilteredContent = () => {
    const contentList = contentType === 'solicitacoes' ? solicitacoes : denuncias;
    
    return contentList
      .filter(item => 
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(applyDateFilter)
      .filter(applyStatusFilter)
      .filter(applyTypeFilter)
      .filter(applyLocationFilter) // Apply location filter
      .sort((a, b) => {
        // Handle undefined values
        const aValue = sortConfig.key === 'createdAt' ? a[sortConfig.key] : (a[sortConfig.key] ?? '');
        const bValue = sortConfig.key === 'createdAt' ? b[sortConfig.key] : (b[sortConfig.key] ?? '');
        
        // Basic comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
  };

  const filteredContent = getFilteredContent();

  // Reset filters
  const resetFilters = () => {
    setFilterOptions({
      dateRange: 'all',
      status: 'all',
      type: 'all',
      location: '' // Reset location filter
    });
    setDateRange({
      start: '',
      end: ''
    });
    setSearchTerm('');
  };

  // Handle responsible entity assignment
  const handleResponsibleEntityAssignment = async () => {
    if (!selectedItem || !responsibleEntity) return;

    try {
      const db = getFirestore();
      const itemRef = doc(db, selectedItem.contentType === 'solicitacao' ? "community_posts" : "reports", selectedItem.id);

      await updateDoc(itemRef, {
        responsibleEntity,
        status: 'in_progress',
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      });

      if (selectedItem.contentType === 'solicitacao') {
        setSolicitacoes(prevSolicitacoes => 
          prevSolicitacoes.map(solicitacao => 
            solicitacao.id === selectedItem.id 
              ? { ...solicitacao, responsibleEntity, status: 'in_progress', updatedAt: new Date() } 
              : solicitacao
          )
        );
      } else {
        setDenuncias(prevDenuncias => 
          prevDenuncias.map(denuncia => 
            denuncia.id === selectedItem.id 
              ? { ...denuncia, responsibleEntity, status: 'in_progress', updatedAt: new Date() } 
              : denuncia
          )
        );
      }

      ecoToastSuccess(`Responsável atribuído: ${responsibleEntity}`);
      setStatusModalOpen(false);
    } catch (error) {
      console.error("Error assigning responsible entity:", error);
      ecoToastError("Erro ao atribuir responsável");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Gerenciamento de Conteúdo</h1>
        <div className="admin-actions">
          <button className="refresh-button" onClick={() => {
            fetchSolicitacoes();
            fetchDenuncias();
            ecoToastSuccess("Conteúdo atualizado");
          }}>
            Atualizar
          </button>
          <button className="back-button" onClick={() => navigate('/adminpoints')}>
            Voltar para Admin
          </button>
        </div>
      </div>
      
      <div className="content-type-tabs">
        <button 
          className={`tab-button ${contentType === 'solicitacoes' ? 'active' : ''}`}
          onClick={() => setContentType('solicitacoes')}
        >
          <FaComment /> Solicitações de Descarte ({solicitacoes.length})
        </button>
        <button 
          className={`tab-button ${contentType === 'denuncias' ? 'active' : ''}`}
          onClick={() => setContentType('denuncias')}
        >
          <FaExclamationTriangle /> Denúncias ({denuncias.length})
        </button>
      </div>
      
      <div className="search-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder={`Buscar ${contentType === 'solicitacoes' ? 'solicitações' : 'denúncias'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
        
        <div className="deleted-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={showDeletedContent}
              onChange={() => setShowDeletedContent(!showDeletedContent)}
            />
            Mostrar conteúdo removido
          </label>
        </div>
      </div>
      
      {showFilters && (
        <div className="filter-container">
          <div className="filter-section">
            <label>Status:</label>
            <select
              value={filterOptions.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="deleted">Removidos</option>
              {contentType === 'denuncias' && (
                <>
                  <option value="pending">Pendentes</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="resolved">Resolvidos</option>
                  <option value="rejected">Rejeitados</option>
                </>
              )}
            </select>
          </div>
          
          <div className="filter-section">
            <label>Data:</label>
            <select
              value={filterOptions.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">Todos períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
              <option value="custom">Período personalizado</option>
            </select>
          </div>
          
          {filterOptions.dateRange === 'custom' && (
            <div className="custom-date-range">
              <div className="date-input">
                <label>De:</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div className="date-input">
                <label>Até:</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
          
          {contentType === 'denuncias' && (
            <div className="filter-section">
              <label>Tipo de resíduo:</label>
              <select
                value={filterOptions.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="plastic">Plástico</option>
                <option value="glass">Vidro</option>
                <option value="paper">Papel/Papelão</option>
                <option value="electronic">Eletrônico</option>
                <option value="construction">Entulho</option>
                <option value="furniture">Móveis</option>
                <option value="other">Outro</option>
              </select>
            </div>
          )}
          
          <div className="filter-section">
            <label>Localização:</label>
            <input
              type="text"
              placeholder="Digite a localização"
              value={filterOptions.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
          
          <button className="reset-filters" onClick={resetFilters}>
            Limpar filtros
          </button>
        </div>
      )}
      
      <div className="results-count">
        {filteredContent.length} {contentType === 'solicitacoes' ? 'solicitações' : 'denúncias'} encontradas
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando conteúdo...</p>
        </div>
      ) : (
        <div className="content-table-container">
          {contentType === 'solicitacoes' ? (
            <table className="content-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('userName')} className="sortable">
                    Autor
                    {sortConfig.key === 'userName' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Conteúdo</th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Data
                    {sortConfig.key === 'createdAt' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('likes')} className="sortable">
                    Curtidas
                    {sortConfig.key === 'likes' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('commentsCount')} className="sortable">
                    Comentários
                    {sortConfig.key === 'commentsCount' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.length > 0 ? (
                  filteredContent.map((solicitacao) => (
                    <tr key={solicitacao.id} className={solicitacao.deleted ? 'deleted-row' : ''}>
                      <td>{solicitacao.userName || 'Anônimo'}</td>
                      <td className="content-cell">
                        <div className="truncated-content">
                          {solicitacao.content?.slice(0, 70)}{solicitacao.content?.length > 70 ? '...' : ''}
                        </div>
                      </td>
                      <td>{formatDate(solicitacao.createdAt)}</td>
                      <td>{solicitacao.likes || 0}</td>
                      <td>{solicitacao.commentsCount || 0}</td>
                      <td>{getStatusBadge(solicitacao)}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-button view-button" 
                          title="Ver detalhes"
                          onClick={() => handleViewItem(solicitacao)}
                        >
                          <FaEye />
                        </button>
                        
                        {!solicitacao.deleted ? (
                          <button 
                            className="action-button delete-button" 
                            title="Remover"
                            onClick={() => {
                              setSelectedItem(solicitacao);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                        ) : (
                          <button 
                            className="action-button restore-button" 
                            title="Restaurar"
                            onClick={() => handleRestoreItem(solicitacao)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        
                        <button 
                          className="action-button status-button" 
                          title="Mudar status"
                          onClick={() => {
                            setSelectedItem(solicitacao);
                            setNewStatus(solicitacao.status || 'active');
                            setStatusModalOpen(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-content">
                      Nenhuma solicitação encontrada com os filtros atuais
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="content-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('userName')} className="sortable">
                    Denunciante
                    {sortConfig.key === 'userName' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('wasteType')} className="sortable">
                    Tipo
                    {sortConfig.key === 'wasteType' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Descrição</th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    Data
                    {sortConfig.key === 'createdAt' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.length > 0 ? (
                  filteredContent.map((denuncia) => (
                    <tr key={denuncia.id} className={denuncia.deleted ? 'deleted-row' : ''}>
                      <td>{denuncia.userName || 'Anônimo'}</td>
                      <td>{getWasteTypeLabel(denuncia.wasteType)}</td>
                      <td className="content-cell">
                        <div className="truncated-content">
                        {denuncia.description?.slice(0, 70)}{denuncia.description?.length > 70 ? '...' : ''}
                        </div>
                      </td>
                      <td>{formatDate(denuncia.createdAt)}</td>
                      <td>
                        {denuncia.location ? (
                          <span title={`${denuncia.location.latitude}, ${denuncia.location.longitude}`}>
                            {denuncia.location.address || 'Ver coordenadas'}
                          </span>
                        ) : 'Não informada'}
                      </td>
                      <td>{getStatusBadge(denuncia)}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-button view-button" 
                          title="Ver detalhes"
                          onClick={() => handleViewItem(denuncia)}
                        >
                          <FaEye />
                        </button>
                        
                        {!denuncia.deleted ? (
                          <button 
                            className="action-button delete-button" 
                            title="Remover"
                            onClick={() => {
                              setSelectedItem(denuncia);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <FaTrash />
                          </button>
                        ) : (
                          <button 
                            className="action-button restore-button" 
                            title="Restaurar"
                            onClick={() => handleRestoreItem(denuncia)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        
                        <button 
                          className="action-button status-button" 
                          title="Mudar status"
                          onClick={() => {
                            setSelectedItem(denuncia);
                            setNewStatus(denuncia.status || 'pending');
                            setStatusModalOpen(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-content">
                      Nenhuma denúncia encontrada com os filtros atuais
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* View Modal */}
      {viewModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h2>
                {selectedItem.contentType === 'solicitacao' ? 'Detalhes da Solicitação' : 'Detalhes da Denúncia'}
              </h2>
              <button className="close-button" onClick={() => setViewModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {selectedItem.contentType === 'solicitacao' ? (
                <>
                  <div className="detail-row">
                    <div className="detail-label">ID:</div>
                    <div className="detail-value">{selectedItem.id}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Autor:</div>
                    <div className="detail-value">
                      {selectedItem.userName || 'Anônimo'} 
                      {selectedItem.userId && <span className="user-id">({selectedItem.userId})</span>}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Criado em:</div>
                    <div className="detail-value">{formatDate(selectedItem.createdAt)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">{getStatusBadge(selectedItem)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Curtidas:</div>
                    <div className="detail-value">{selectedItem.likes || 0}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Comentários:</div>
                    <div className="detail-value">{selectedItem.commentsCount || 0}</div>
                  </div>
                  
                  <div className="detail-content">
                    <h3>Conteúdo da Solicitação</h3>
                    <div className="content-text">
                      {selectedItem.content || 'Sem conteúdo de texto'}
                    </div>
                    
                    {selectedItem.imageUrl && (
                      <div className="content-image">
                        <h4>Imagem anexada</h4>
                        <img src={selectedItem.imageUrl} alt="Conteúdo da solicitação" />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-row">
                    <div className="detail-label">ID:</div>
                    <div className="detail-value">{selectedItem.id}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Denunciante:</div>
                    <div className="detail-value">
                      {selectedItem.userName || 'Anônimo'} 
                      {selectedItem.userId && <span className="user-id">({selectedItem.userId})</span>}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Criado em:</div>
                    <div className="detail-value">{formatDate(selectedItem.createdAt)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value">{getStatusBadge(selectedItem)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Tipo de resíduo:</div>
                    <div className="detail-value">{getWasteTypeLabel(selectedItem.wasteType)}</div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-label">Localização:</div>
                    <div className="detail-value">
                      {selectedItem.location ? (
                        <>
                          <div>{selectedItem.location.address || 'Endereço não fornecido'}</div>
                          <div className="coordinates">
                            Lat: {selectedItem.location.latitude}, Lng: {selectedItem.location.longitude}
                          </div>
                          {/* Map could be added here */}
                        </>
                      ) : 'Não informada'}
                    </div>
                  </div>
                  
                  <div className="detail-content">
                    <h3>Descrição da Denúncia</h3>
                    <div className="content-text">
                      {selectedItem.description || 'Sem descrição'}
                    </div>
                    
                    {selectedItem.imageUrl && (
                      <div className="content-image">
                        <h4>Imagem anexada</h4>
                        <img src={selectedItem.imageUrl} alt="Foto da denúncia" />
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {selectedItem.deleted && (
                <div className="deleted-info">
                  <div className="detail-row">
                    <div className="detail-label">Removido em:</div>
                    <div className="detail-value">{formatDate(selectedItem.deletedAt)}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Removido por:</div>
                    <div className="detail-value">{selectedItem.deletedBy || 'Sistema'}</div>
                  </div>
                </div>
              )}

              {/* Display the responsible entity if available */}
              {selectedItem.contentType === 'report' && selectedItem.responsibleEntity && (
                <div className="detail-row">
                  <div className="detail-label">Responsável pela coleta:</div>
                  <div className="detail-value">{selectedItem.responsibleEntity}</div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setViewModalOpen(false)}>Fechar</button>
              
              {!selectedItem.deleted ? (
                <button 
                  className="delete-button" 
                  onClick={() => {
                    setViewModalOpen(false);
                    setDeleteModalOpen(true);
                  }}
                >
                  <FaTrash /> Remover
                </button>
              ) : (
                <button 
                  className="restore-button"
                  onClick={() => {
                    handleRestoreItem(selectedItem);
                    setViewModalOpen(false);
                  }}
                >
                  <FaCheck /> Restaurar
                </button>
              )}
              
              <button 
                className="edit-status-button"
                onClick={() => {
                  setViewModalOpen(false);
                  setNewStatus(selectedItem.status || 
                    (selectedItem.contentType === 'solicitacao' ? 'active' : 'pending'));
                  setStatusModalOpen(true);
                }}
              >
                <FaEdit /> Alterar Status
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {deleteModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Confirmar Remoção</h2>
              <button className="close-button" onClick={() => setDeleteModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="warning-icon">
                <FaExclamationTriangle />
              </div>
              
              <p>
                Tem certeza que deseja remover {selectedItem.contentType === 'solicitacao' ? 'esta solicitação' : 'esta denúncia'}?
              </p>
              
              <p className="item-details">
                <strong>{selectedItem.contentType === 'solicitacao' ? 'Solicitação' : 'Denúncia'} de:</strong> {selectedItem.userName || 'Anônimo'}<br />
                <strong>Criado em:</strong> {formatDate(selectedItem.createdAt)}
              </p>
              
              <div className="content-preview">
                {selectedItem.contentType === 'solicitacao' ? selectedItem.content?.slice(0, 100) : selectedItem.description?.slice(0, 100)}
                {(selectedItem.contentType === 'solicitacao' ? selectedItem.content?.length : selectedItem.description?.length) > 100 ? '...' : ''}
              </div>
              
              {selectedItem.deleted && (
                <div className="permanent-delete-warning">
                  <p>
                    <strong>ATENÇÃO:</strong> Este conteúdo já foi removido anteriormente. 
                    Você pode excluí-lo permanentemente ou restaurá-lo.
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setDeleteModalOpen(false)}>Cancelar</button>
              
              {selectedItem.deleted ? (
                <>
                  <button 
                    className="restore-button"
                    onClick={() => {
                      handleRestoreItem(selectedItem);
                      setDeleteModalOpen(false);
                    }}
                  >
                    <FaCheck /> Restaurar
                  </button>
                  
                  <button 
                    className="permanent-delete-button"
                    onClick={handlePermanentDelete}
                  >
                    <FaTrash /> Excluir Permanentemente
                  </button>
                </>
              ) : (
                <button 
                  className="delete-button"
                  onClick={handleDeleteConfirm}
                >
                  <FaTrash /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Status Update Modal */}
      {statusModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content status-modal">
            <div className="modal-header">
              <h2>Alterar Status</h2>
              <button className="close-button" onClick={() => setStatusModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p>
                Alterar o status {selectedItem.contentType === 'solicitacao' ? 'da solicitação' : 'da denúncia'} de <strong>{selectedItem.userName || 'Anônimo'}</strong>:
              </p>
              
              <div className="status-form">
                <label htmlFor="status-select">Novo status:</label>
                
                {selectedItem.contentType === 'solicitacao' ? (
                  <select 
                    id="status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="active">Ativo</option>
                    <option value="featured">Destacado</option>
                    <option value="restricted">Restrito</option>
                    <option value="archived">Arquivado</option>
                  </select>
                ) : (
                  <select 
                    id="status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="resolved">Resolvido</option>
                    <option value="rejected">Rejeitado</option>
                  </select>
                )}
              </div>
              
              {selectedItem.contentType === 'report' && (
                <div className="responsible-entity-form">
                  <label htmlFor="responsible-entity-select">Responsável pela coleta:</label>
                  <select 
                    id="responsible-entity-select"
                    value={responsibleEntity}
                    onChange={(e) => setResponsibleEntity(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="EMLURB">EMLURB</option>
                    <option value="Catadores">Catadores</option>
                    <option value="ONG ou Instituição de Reciclagem">ONG ou Instituição de Reciclagem</option>
                  </select>
                </div>
              )}
              
              <div className="current-status">
                <span>Status atual: </span> 
                {getStatusBadge(selectedItem)}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setStatusModalOpen(false)}>Cancelar</button>
              {selectedItem.contentType === 'report' && responsibleEntity ? (
                <button 
                  className="update-button"
                  onClick={handleResponsibleEntityAssignment}
                >
                  <FaCheck /> Atribuir Responsável e Atualizar Status
                </button>
              ) : (
                <button 
                  className="update-button"
                  onClick={handleStatusUpdate}
                >
                  <FaCheck /> Atualizar Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;