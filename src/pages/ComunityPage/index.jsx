import React, { useState, useEffect } from 'react';
import { FaLeaf, FaComment, FaHeart, FaShare, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt, FaUserCircle, FaCamera, FaTrash, FaPlus } from 'react-icons/fa';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, getDoc, arrayUnion, serverTimestamp, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../auth/auth';
import ReportForm from './ReportForm_New';
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
  
  // Estado para o formulário de denúncia
  const [showReportForm, setShowReportForm] = useState(false);
  
  // Carregar posts e denúncias ao montar o componente
  useEffect(() => {
    fetchPosts();
    fetchReports();
  }, []);
  
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
        where("deleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const collectionRequestsQuery = query(
        collection(db, "collection_requests"),
        where("status", "==", "pending"),
        where("deleted", "==", false),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      
      const [reportsSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(reportsQuery),
        getDocs(collectionRequestsQuery)
      ]);
      
      // Processar denúncias
      const reportsData = reportsSnapshot.docs.map(doc => {
        const reportData = doc.data();
        return {
          id: doc.id,
          ...reportData,
          serviceType: 'denunciar',
          contentType: 'report',
          createdAt: reportData.createdAt ? 
                    (typeof reportData.createdAt.toDate === 'function' ? 
                    reportData.createdAt.toDate() : 
                    new Date(reportData.createdAt)) : 
                    new Date()
        };
      });
      
      // Processar solicitações de coleta
      const requestsData = requestsSnapshot.docs.map(doc => {
        const requestData = doc.data();
        return {
          id: doc.id,
          ...requestData,
          serviceType: 'coletar',
          contentType: 'collection_request',
          createdAt: requestData.createdAt ? 
                    (typeof requestData.createdAt.toDate === 'function' ? 
                    requestData.createdAt.toDate() : 
                    new Date(requestData.createdAt)) : 
                    new Date()
        };
      });
      
      // Combinar e ordenar por data mais recente
      const combinedData = [...reportsData, ...requestsData].sort((a, b) => 
        b.createdAt - a.createdAt
      );
      
      setReports(combinedData);
    } catch (error) {
      console.error("Erro ao buscar denúncias e solicitações:", error);
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
      
      ecoToastSuccess("Solicitação publicada com sucesso! 🌱");
      
      // Recarregar posts imediatamente
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao criar postagem:", error);
      ecoToastError("Não foi possível publicar sua postagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com sucesso na submissão de denúncia do componente ReportForm
  const handleReportSuccess = async () => {
    await fetchReports();
    setActiveTab('reports');
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
  
  // Função para remover imagem selecionada da postagem
  const removeImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview(null);
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
      'organic': 'Orgânico',
      'plastic': 'Plástico',
      'glass': 'Vidro',
      'paper': 'Papel/Papelão',
      'electronic': 'Eletrônico',
      'construction': 'Entulho',
      'furniture': 'Móveis',
      'other': 'Outro'
    };
    
    return types[wasteType] || wasteType || 'Não especificado';
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
          <FaComment /> Solicitações de Descarte
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
            <FaExclamationTriangle /> Criar Solicitação
          </button>
        </div>
      )}
      
      {/* Componente do formulário de denúncia */}
      {showReportForm && (
        <ReportForm 
          currentUser={currentUser}
          onClose={() => setShowReportForm(false)}
          onReportSubmitted={handleReportSuccess}
          ecoToastSuccess={ecoToastSuccess}
          ecoToastError={ecoToastError}
        />
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
                  <p>Carregando solicitações de descarte...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="no-content">
                  <p>Ainda não há solicitações na comunidade. Seja o primeiro a compartilhar!</p>
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
                        {report.serviceType === 'coletar' ? 'Solicitação de Coleta: ' : 'Denúncia: '}
                        {getWasteTypeLabel(report.wasteType)}
                        {report.otherWasteType && ` - ${report.otherWasteType}`}
                      </h3>
                      <span className={`report-status ${report.status || 'pending'}`}>
                        {report.status === 'resolved' ? 'Resolvido' : 
                         report.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                      </span>
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
                    <p className="report-description">{report.description}</p>
                    
                    {report.imageUrl && (
                      <div className="report-image">
                        <img src={report.imageUrl} alt="Imagem da denúncia" />
                      </div>
                    )}
                    
                    <div className="report-details">
                      {report.wasteType === 'construction' && (
                        <>
                          <p><strong>Quantidade:</strong> {report.quantity || 'Não especificada'}</p>
                          <p><strong>Frequência:</strong> {report.frequency || 'Não especificada'}</p>
                          <p><strong>Possui PGRCC:</strong> {report.hasPGRCC ? 'Sim' : 'Não'}</p>
                        </>
                      )}
                      
                      {report.serviceType === 'denunciar' && report.responsible && (
                        <p><strong>Responsável pelo descarte:</strong> {report.responsible}</p>
                      )}
                      
                      {report.serviceType === 'coletar' && report.collectionBy && (
                        <p><strong>Responsável pela coleta:</strong> {report.collectionBy}</p>
                      )}
                      
                      {report.userContact && (
                        <p><strong>Contato:</strong> {report.userContact}</p>
                      )}
                    </div>
                    
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