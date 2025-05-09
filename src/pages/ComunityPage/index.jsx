import React, { useState, useEffect } from 'react';
import { FaLeaf, FaComment, FaHeart, FaShare, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt, FaUserCircle, FaCamera, FaTrash, FaPlus } from 'react-icons/fa';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, getDoc, arrayUnion, serverTimestamp, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../auth/auth';
import './CommunityPage.css';

const CommunityPage = () => {
  const { currentUser, ecoToastSuccess, ecoToastError } = useAuth();
  const db = getFirestore();
  const storage = getStorage();
  
  // Estados para controlar os dados
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Estados para o formulário de nova postagem
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para comentários
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  
  // Estados para o formulário de nova denúncia
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReport, setNewReport] = useState({
    description: '',
    wasteType: 'plastic',
    location: {
      address: '',
      latitude: null,
      longitude: null
    }
  });
  const [reportImage, setReportImage] = useState(null);
  const [reportImagePreview, setReportImagePreview] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Carregar posts e denúncias ao montar o componente
  useEffect(() => {
    fetchPosts();
    fetchReports();
  }, []);
  
  // Efeito para capturar localização atual do usuário ao abrir formulário de denúncia
  useEffect(() => {
    if (showReportForm && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewReport(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }, [showReportForm]);
  
  // Função para buscar posts do Firestore
  const fetchPosts = async () => {
    setLoading(true); // Garantir que o loading esteja ativo
    try {
      console.log("Iniciando busca de posts...");
      
      // Modificar a consulta para incluir posts ativos e não deletados
      const postsQuery = query(
        collection(db, "community_posts"),
        // Não filtrar por status inicialmente para fins de diagnóstico
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      const querySnapshot = await getDocs(postsQuery);
      console.log(`Encontrados ${querySnapshot.size} posts no Firestore`);
      
      const postsData = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const postData = docSnapshot.data();
        // Ignorar posts marcados como deletados
        if (postData.deleted === true) {
          console.log(`Post ${docSnapshot.id} ignorado: marcado como deletado`);
          continue;
        }
        
        const formattedPost = {
          id: docSnapshot.id,
          ...postData,
          // Converter timestamp para data legível com verificação de tipo
          createdAt: postData.createdAt ? 
                    (typeof postData.createdAt.toDate === 'function' ? 
                    postData.createdAt.toDate() : 
                    new Date(postData.createdAt)) : 
                    new Date(),
          comments: []
        };
        
        console.log(`Post válido encontrado: ${formattedPost.id}`, formattedPost);
        
        // Buscar comentários para este post
        try {
          const commentsQuery = query(
            collection(db, "community_posts", docSnapshot.id, "comments"),
            orderBy("createdAt", "asc")
          );
          
          const commentsSnapshot = await getDocs(commentsQuery);
          formattedPost.comments = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
              id: commentDoc.id,
              ...commentData,
              createdAt: commentData.createdAt ? 
                        (typeof commentData.createdAt.toDate === 'function' ? 
                        commentData.createdAt.toDate() : 
                        new Date(commentData.createdAt)) : 
                        new Date()
            };
          });
          
          console.log(`${formattedPost.comments.length} comentários encontrados para o post ${formattedPost.id}`);
        } catch (commentError) {
          console.error(`Erro ao buscar comentários para o post ${formattedPost.id}:`, commentError);
          // Continuar mesmo se houver erro nos comentários
        }
        
        postsData.push(formattedPost);
      }
      
      console.log(`Total de ${postsData.length} posts válidos encontrados`);
      setPosts(postsData);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      ecoToastError("Não foi possível carregar os posts da comunidade");
    } finally {
      setLoading(false);
    }
  };
  
  // Função para buscar denúncias recentes
  const fetchReports = async () => {
    try {
      const reportsQuery = query(
        collection(db, "reports"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const querySnapshot = await getDocs(reportsQuery);
      const reportsData = querySnapshot.docs.map(doc => {
        const reportData = doc.data();
        return {
          id: doc.id,
          ...reportData,
          createdAt: reportData.createdAt ? 
                    (typeof reportData.createdAt.toDate === 'function' ? 
                    reportData.createdAt.toDate() : 
                    new Date(reportData.createdAt)) : 
                    new Date()
        };
      });
      
      setReports(reportsData);
    } catch (error) {
      console.error("Erro ao buscar denúncias:", error);
      ecoToastError("Não foi possível carregar as denúncias recentes");
    }
  };
  
  // Função para lidar com o envio de nova postagem
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      ecoToastError("Você precisa estar logado para fazer uma postagem");
      return;
    }
    
    if (!newPostContent.trim()) {
      ecoToastError("O conteúdo da postagem não pode estar vazio");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Upload da imagem, se houver
      if (newPostImage) {
        const storageRef = ref(storage, `community_posts/${currentUser.uid}_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, newPostImage);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Criar nova postagem no Firestore com status explícito
      const newPost = {
        content: newPostContent,
        imageUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Usuário anônimo",
        userPhotoURL: currentUser.photoURL || null,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        status: "active", // Garantir que o status seja definido
        deleted: false,   // Garantir que não está marcado como deletado
        contentType: 'post', // Adicionar tipo de conteúdo para compatibilidade com o painel admin
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "community_posts"), newPost);
      console.log("Post criado com ID:", docRef.id);
      
      // Limpar o formulário
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostImagePreview(null);
      
      ecoToastSuccess("Postagem publicada com sucesso! 🌱");
      
      // Recarregar posts imediatamente
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao criar postagem:", error);
      ecoToastError("Não foi possível publicar sua postagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com o envio de nova denúncia
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      ecoToastError("Você precisa estar logado para fazer uma denúncia");
      return;
    }
    
    if (!newReport.description.trim()) {
      ecoToastError("A descrição da denúncia não pode estar vazia");
      return;
    }
    
    if (!newReport.wasteType) {
      ecoToastError("Você precisa selecionar um tipo de resíduo");
      return;
    }
    
    setIsSubmittingReport(true);
    
    try {
      let imageUrl = null;
      
      // Upload da imagem, se houver
      if (reportImage) {
        const storageRef = ref(storage, `reports/${currentUser.uid}_${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, reportImage);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Criar nova denúncia no Firestore
      const reportData = {
        description: newReport.description,
        wasteType: newReport.wasteType,
        location: newReport.location,
        imageUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Usuário anônimo",
        userPhotoURL: currentUser.photoURL || null,
        status: "pending",
        deleted: false,
        contentType: 'report', // Tipo de conteúdo para compatibilidade com o painel admin
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "reports"), reportData);
      console.log("Denúncia criada com ID:", docRef.id);
      
      // Limpar o formulário e fechar
      setNewReport({
        description: '',
        wasteType: 'plastic',
        location: {
          address: '',
          latitude: null,
          longitude: null
        }
      });
      setReportImage(null);
      setReportImagePreview(null);
      setShowReportForm(false);
      
      ecoToastSuccess("Denúncia enviada com sucesso! Obrigado pela sua contribuição!");
      
      // Recarregar denúncias e mudar para a aba de denúncias
      await fetchReports();
      setActiveTab('reports');
    } catch (error) {
      console.error("Erro ao criar denúncia:", error);
      ecoToastError("Não foi possível enviar sua denúncia. Tente novamente.");
    } finally {
      setIsSubmittingReport(false);
    }
  };
  
  // Função para lidar com upload de imagem para postagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para lidar com upload de imagem para denúncia
  const handleReportImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReportImage(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para remover imagem selecionada da postagem
  const removeImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview(null);
  };
  
  // Função para remover imagem selecionada da denúncia
  const removeReportImage = () => {
    setReportImage(null);
    setReportImagePreview(null);
  };
  
  // Função para curtir um post
  const handleLikePost = async (postId) => {
    if (!currentUser) {
      ecoToastError("Você precisa estar logado para curtir uma postagem");
      return;
    }
    
    try {
      const postRef = doc(db, "community_posts", postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likedBy = postData.likedBy || [];
        
        // Verificar se o usuário já curtiu
        if (likedBy.includes(currentUser.uid)) {
          // Remover curtida
          await updateDoc(postRef, {
            likes: postData.likes - 1,
            likedBy: likedBy.filter(id => id !== currentUser.uid)
          });
        } else {
          // Adicionar curtida
          await updateDoc(postRef, {
            likes: (postData.likes || 0) + 1,
            likedBy: arrayUnion(currentUser.uid)
          });
        }
        
        // Atualizar posts localmente
        fetchPosts();
      }
    } catch (error) {
      console.error("Erro ao curtir post:", error);
      ecoToastError("Não foi possível processar sua curtida");
    }
  };
  
  // Função para adicionar comentário
  const handleAddComment = async (postId) => {
    if (!currentUser) {
      ecoToastError("Você precisa estar logado para comentar");
      return;
    }
    
    const commentContent = commentText[postId]?.trim();
    if (!commentContent) {
      ecoToastError("O comentário não pode estar vazio");
      return;
    }
    
    try {
      // Adicionar comentário na subcoleção
      const commentData = {
        content: commentContent,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Usuário anônimo",
        userPhotoURL: currentUser.photoURL || null,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "community_posts", postId, "comments"), commentData);
      
      // Atualizar contador de comentários no post
      const postRef = doc(db, "community_posts", postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        await updateDoc(postRef, {
          commentsCount: (postSnap.data().commentsCount || 0) + 1
        });
      }
      
      // Limpar o campo de comentário
      setCommentText(prev => ({...prev, [postId]: ''}));
      
      ecoToastSuccess("Comentário adicionado com sucesso! 🌿");
      
      // Recarregar posts para mostrar o novo comentário
      fetchPosts();
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      ecoToastError("Não foi possível publicar seu comentário");
    }
  };
  
  // Função para alternar a visibilidade dos comentários
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  // Função auxiliar para formatar data
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return "Data inválida";
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Função auxiliar para obter rótulo do tipo de resíduo
  const getWasteTypeLabel = (wasteType) => {
    const types = {
      'plastic': 'Plástico',
      'glass': 'Vidro',
      'paper': 'Papel/Papelão',
      'electronic': 'Eletrônico',
      'construction': 'Entulho',
      'furniture': 'Móveis',
      'other': 'Outro'
    };
    
    return types[wasteType] || 'Não especificado';
  };
  
  // Componente de Debugging (só aparece em desenvolvimento)
  const DebugPanel = ({ posts, reports, loading, activeTab }) => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div style={{ 
        margin: '10px', 
        padding: '10px', 
        border: '1px solid red', 
        backgroundColor: '#fff8f8' 
      }}>
        <h3>Informações de Debug</h3>
        <p>Status de carregamento: {loading ? 'Carregando...' : 'Concluído'}</p>
        <p>Tab ativa: {activeTab}</p>
        <p>Posts encontrados: {posts.length}</p>
        <p>Denúncias encontradas: {reports.length}</p>
        <details>
          <summary>Ver detalhes dos posts</summary>
          <ul>
            {posts.map(post => (
              <li key={post.id}>
                {post.id} - {post.userName} - Status: {post.status || 'N/A'} - 
                {post.deleted ? 'Deletado' : 'Ativo'} - {formatDate(post.createdAt)}
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  };
  
  return (
    <div className="community-container">
      <header className="community-header">
        <h1><FaLeaf /> Comunidade Ecottumaran</h1>
        <p>Conecte-se com outros defensores do meio ambiente e faça a diferença juntos!</p>
      </header>
      
      <div className="community-tabs">
        <button 
          className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FaComment /> Postagens
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FaExclamationTriangle /> Denúncias Recentes
        </button>
      </div>
      
      {/* Botão de criar denúncia */}
      {currentUser && (
        <div className="create-report-button-container">
          <button 
            className="create-report-button"
            onClick={() => setShowReportForm(true)}
          >
            <FaExclamationTriangle /> Criar Nova Denúncia
          </button>
        </div>
      )}
      
      {/* Formulário de Denúncia */}
      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal-content report-form-modal">
            <div className="modal-header">
              <h2><FaExclamationTriangle /> Nova Denúncia Ambiental</h2>
              <button className="close-button" onClick={() => setShowReportForm(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleReportSubmit}>
                <div className="form-group">
                  <label htmlFor="wasteType">Tipo de Resíduo:</label>
                  <select 
                    id="wasteType"
                    value={newReport.wasteType}
                    onChange={(e) => setNewReport({...newReport, wasteType: e.target.value})}
                    required
                  >
                    <option value="plastic">Plástico</option>
                    <option value="glass">Vidro</option>
                    <option value="paper">Papel/Papelão</option>
                    <option value="electronic">Eletrônico</option>
                    <option value="construction">Entulho</option>
                    <option value="furniture">Móveis</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Descrição da Ocorrência:</label>
                  <textarea 
                    id="description"
                    value={newReport.description}
                    onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                    placeholder="Descreva detalhadamente o que você encontrou..."
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Endereço (opcional):</label>
                  <input 
                    type="text"
                    id="address"
                    value={newReport.location.address}
                    onChange={(e) => setNewReport({
                      ...newReport, 
                      location: {...newReport.location, address: e.target.value}
                    })}
                    placeholder="Ex: Rua exemplo, nº 123, Bairro"
                  />
                </div>
                
                <div className="form-group coordinates">
                  <div>
                    <label htmlFor="latitude">Latitude:</label>
                    <input 
                      type="number" 
                      id="latitude"
                      value={newReport.location.latitude || ''}
                      onChange={(e) => setNewReport({
                        ...newReport, 
                        location: {...newReport.location, latitude: parseFloat(e.target.value) || null}
                      })}
                      placeholder="Ex: -23.5505"
                      step="any"
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude">Longitude:</label>
                    <input 
                      type="number" 
                      id="longitude"
                      value={newReport.location.longitude || ''}
                      onChange={(e) => setNewReport({
                        ...newReport, 
                        location: {...newReport.location, longitude: parseFloat(e.target.value) || null}
                      })}
                      placeholder="Ex: -46.6333"
                      step="any"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="reportImage" className="image-upload-label">
                    <FaCamera /> Adicionar foto da ocorrência (opcional)
                  </label>
                  <input
                    type="file"
                    id="reportImage"
                    accept="image/*"
                    onChange={handleReportImageChange}
                    style={{ display: 'none' }}
                  />
                  
                  {reportImagePreview && (
                    <div className="image-preview">
                      <img src={reportImagePreview} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-image" 
                        onClick={removeReportImage}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowReportForm(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmittingReport || !newReport.description.trim() || !newReport.wasteType}
                  >
                    {isSubmittingReport ? 'Enviando...' : 'Enviar Denúncia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Painel de Debug */}
      <DebugPanel 
        posts={posts} 
        reports={reports} 
        loading={loading} 
        activeTab={activeTab} 
      />
      
      <div className="community-content">
        {activeTab === 'posts' && (
          <>
            {currentUser && (
              <div className="new-post-form">
                <form onSubmit={handlePostSubmit}>
                  <div className="form-header">
                    <div className="user-avatar">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" />
                      ) : (
                        <FaUserCircle size={40} />
                      )}
                    </div>
                    <textarea
                      placeholder="Compartilhe suas ideias ou iniciativas sustentáveis..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  {newPostImagePreview && (
                    <div className="image-preview">
                      <img src={newPostImagePreview} alt="Preview" />
                      <button type="button" className="remove-image" onClick={removeImage}>
                        &times;
                      </button>
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <div className="upload-image">
                      <label htmlFor="postImage">
                        <i className="fa fa-image"></i> Adicionar Imagem
                      </label>
                      <input
                        type="file"
                        id="postImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="post-button"
                      disabled={isSubmitting || !newPostContent.trim()}
                    >
                      {isSubmitting ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="posts-list">
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Carregando postagens...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="no-content">
                  <p>Ainda não há postagens na comunidade. Seja o primeiro a compartilhar!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div className="post-card" key={post.id}>
                    <div className="post-header">
                      <div className="post-author">
                        {post.userPhotoURL ? (
                          <img src={post.userPhotoURL} alt="Avatar" className="author-avatar" />
                        ) : (
                          <FaUserCircle size={30} className="author-avatar" />
                        )}
                        <div>
                          <h3>{post.userName}</h3>
                          <span className="post-date">
                            <FaCalendarAlt /> {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="post-content">
                      <p>{post.content}</p>
                      {post.imageUrl && (
                        <div className="post-image">
                          <img src={post.imageUrl} alt="Imagem da postagem" />
                        </div>
                      )}
                    </div>
                    
                    <div className="post-actions">
                      <button 
                        className={`action-button like-button ${post.likedBy?.includes(currentUser?.uid) ? 'liked' : ''}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <FaHeart /> 
                        <span>{post.likes || 0}</span>
                      </button>
                      
                      <button 
                        className="action-button comment-button"
                        onClick={() => toggleComments(post.id)}
                      >
                        <FaComment /> 
                        <span>{post.commentsCount || 0}</span>
                      </button>
                      
                      <button className="action-button share-button">
                        <FaShare />
                      </button>
                    </div>
                    
                    {/* Área de comentários */}
                    {expandedComments[post.id] && (
                      <div className="comments-section">
                        <h4>Comentários ({post.comments.length})</h4>
                        
                        {post.comments.length > 0 ? (
                          <div className="comments-list">
                            {post.comments.map(comment => (
                              <div className="comment" key={comment.id}>
                                <div className="comment-author">
                                  {comment.userPhotoURL ? (
                                    <img src={comment.userPhotoURL} alt="Avatar" className="comment-avatar" />
                                  ) : (
                                    <FaUserCircle size={24} className="comment-avatar" />
                                  )}
                                  <span className="author-name">{comment.userName}</span>
                                </div>
                                <div className="comment-content">
                                  <p>{comment.content}</p>
                                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-comments">Nenhum comentário ainda. Seja o primeiro!</p>
                        )}
                        
                        {currentUser && (
                          <div className="add-comment">
                            <input
                              type="text"
                              placeholder="Adicione um comentário..."
                              value={commentText[post.id] || ''}
                              onChange={(e) => setCommentText(prev => ({...prev, [post.id]: e.target.value}))}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentText[post.id]?.trim()}
                            >
                              Enviar
                              </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
        
        {activeTab === 'reports' && (
          <div className="reports-list">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Carregando denúncias...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="no-content">
                <p>Não há denúncias recentes para exibir. Isso é bom para o meio ambiente! 🌱</p>
              </div>
            ) : (
              reports.map(report => (
                <div className="report-card" key={report.id}>
                  <div className="report-header">
                    <div className="report-title">
                      <h3>
                        <FaExclamationTriangle className="report-icon" /> 
                        {getWasteTypeLabel(report.wasteType)}
                      </h3>
                      <span className="report-status pending">Pendente</span>
                    </div>
                    <div className="report-info">
                      <span className="report-author">
                        <FaUserCircle /> {report.userName || "Denúncia anônima"}
                      </span>
                      <span className="report-date">
                        <FaCalendarAlt /> {formatDate(report.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="report-content">
                    <p>{report.description}</p>
                    
                    {report.imageUrl && (
                      <div className="report-image">
                        <img src={report.imageUrl} alt="Imagem da denúncia" />
                      </div>
                    )}
                    
                    {report.location && (
                      <div className="report-location">
                        <p>
                          <FaMapMarkerAlt /> 
                          {report.location.address || 
                            `Lat: ${report.location.latitude.toFixed(4)}, Lng: ${report.location.longitude.toFixed(4)}`}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="report-actions">
                    <button className="action-button support-button">
                      <FaHeart /> Apoiar
                    </button>
                    
                    <button className="action-button share-button">
                      <FaShare /> Compartilhar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {!currentUser && (
        <div className="login-prompt">
          <p>Para participar da comunidade, compartilhar ideias ou fazer denúncias, faça login ou crie uma conta.</p>
          <button className="login-button" onClick={() => window.location.href = '/login'}>
            Entrar / Cadastrar
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;