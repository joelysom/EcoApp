import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, logout, updateUserProfile, ecoToastSuccess, ecoToastError } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData(data);
        } else {
          ecoToastError("Perfil de usuário não encontrado.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        ecoToastError("Erro ao carregar dados do perfil.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate, ecoToastError]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields like endereco.cep
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateUserProfile(formData);
      setUserData(formData);
      setEditMode(false);
      ecoToastSuccess("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      ecoToastError("Erro ao atualizar perfil.");
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      ecoToastError("Erro ao sair. Tente novamente.");
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };

  const handleAdminPanel = () => {
    navigate('/adminpoints');
  };
  
  // Helper function to render user level badge
  const getUserLevelBadge = (level) => {
    if (!level || level === 0 || level === 1) return null;
    
    let badgeClass = '';
    let badgeSymbol = '';
    
    switch (level) {
      case 2:
        badgeClass = 'user-badge bronze';
        badgeSymbol = '★';
        break;
      case 3:
        badgeClass = 'user-badge silver';
        badgeSymbol = '★';
        break;
      case 4:
        badgeClass = 'user-badge gold';
        badgeSymbol = '★';
        break;
      default:
        return null;
    }
    
    return <span className={badgeClass}>{badgeSymbol}</span>;
  };
  
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <button className="back-button" onClick={handleBack}>
              ← Voltar
            </button>
            <h1>Carregando perfil...</h1>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <button className="back-button" onClick={handleBack}>
            ← Voltar
          </button>
          <h1 className="profile-title">Meu Perfil</h1>
          <div className="profile-avatar">
            {currentUser?.displayName ? (
              currentUser.displayName.charAt(0).toUpperCase()
            ) : (
              currentUser?.email?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <h2 className="profile-name">
            {userData?.nome || currentUser?.displayName || currentUser?.email}
            {getUserLevelBadge(userData?.nivelPermissao)}
          </h2>
          <div className="profile-points">
            <span className="points-value">{userData?.pontos || 0}</span>
            <span className="points-label">pontos</span>
          </div>
        </div>
        
        {!editMode ? (
          <div className="profile-details">
            <div className="profile-section">
              <h3 className="section-title">Dados Pessoais</h3>
              <div className="detail-item">
                <span className="detail-label">Nome:</span>
                <span className="detail-value">{userData?.nome || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CPF:</span>
                <span className="detail-value">{userData?.cpf || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data de Nascimento:</span>
                <span className="detail-value">{userData?.dataNascimento || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">RG:</span>
                <span className="detail-value">
                  {userData?.rg ? `${userData.rg} (${userData.orgaoEmissor})` : '-'}
                </span>
              </div>
            </div>
            
            <div className="profile-section">
              <h3 className="section-title">Contato</h3>
              <div className="detail-item">
                <span className="detail-label">E-mail:</span>
                <span className="detail-value">{userData?.email || currentUser?.email || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Celular:</span>
                <span className="detail-value">{userData?.celular || '-'}</span>
              </div>
            </div>
            
            <div className="profile-section">
              <h3 className="section-title">Endereço</h3>
              {userData?.endereco && (
                <>
                  <div className="detail-item">
                    <span className="detail-label">CEP:</span>
                    <span className="detail-value">{userData.endereco.cep || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Logradouro:</span>
                    <span className="detail-value">{userData.endereco.logradouro || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Número:</span>
                    <span className="detail-value">{userData.endereco.numero || '-'}</span>
                  </div>
                  {userData.endereco.complemento && (
                    <div className="detail-item">
                      <span className="detail-label">Complemento:</span>
                      <span className="detail-value">{userData.endereco.complemento}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Bairro:</span>
                    <span className="detail-value">{userData.endereco.bairro || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cidade:</span>
                    <span className="detail-value">{userData.endereco.cidade || '-'}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="profile-actions">
              <button 
                className="edit-button"
                onClick={() => setEditMode(true)}
              >
                Editar Perfil
              </button>
              
              {/* Admin Panel button - only visible for level 4 users */}
              {userData?.nivelPermissao === 4 && (
                <button 
                  className="admin-button"
                  onClick={handleAdminPanel}
                >
                  Painel Administrador
                </button>
              )}
              
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-section">
              <h3 className="section-title">Dados Pessoais</h3>
              
              <div className="form-group">
                <label htmlFor="nome">Nome Completo</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome || ''}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cpf">CPF</label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dataNascimento">Data de Nascimento</label>
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rg">RG</label>
                  <input
                    type="text"
                    id="rg"
                    name="rg"
                    value={formData.rg || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="orgaoEmissor">Órgão Emissor</label>
                  <input
                    type="text"
                    id="orgaoEmissor"
                    name="orgaoEmissor"
                    value={formData.orgaoEmissor || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3 className="section-title">Contato</h3>
              
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || currentUser?.email || ''}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={true} // Email cannot be changed
                />
                <small className="form-help">O e-mail não pode ser alterado</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="celular">Celular</label>
                <input
                  type="text"
                  id="celular"
                  name="celular"
                  value={formData.celular || ''}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="profile-section">
              <h3 className="section-title">Endereço</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="endereco.cep">CEP</label>
                  <input
                    type="text"
                    id="endereco.cep"
                    name="endereco.cep"
                    value={formData.endereco?.cep || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endereco.cidade">Cidade</label>
                  <input
                    type="text"
                    id="endereco.cidade"
                    name="endereco.cidade"
                    value={formData.endereco?.cidade || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="endereco.logradouro">Logradouro</label>
                <input
                  type="text"
                  id="endereco.logradouro"
                  name="endereco.logradouro"
                  value={formData.endereco?.logradouro || ''}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="endereco.numero">Número</label>
                  <input
                    type="text"
                    id="endereco.numero"
                    name="endereco.numero"
                    value={formData.endereco?.numero || ''}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endereco.complemento">Complemento</label>
                  <input
                    type="text"
                    id="endereco.complemento"
                    name="endereco.complemento"
                    value={formData.endereco?.complemento || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="endereco.bairro">Bairro</label>
                <input
                  type="text"
                  id="endereco.bairro"
                  name="endereco.bairro"
                  value={formData.endereco?.bairro || ''}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setFormData(userData);
                  setEditMode(false);
                }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="save-button"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;