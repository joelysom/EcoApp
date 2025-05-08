import React, { useState, useEffect } from 'react';
import { FaLeaf, FaComment, FaHeart, FaShare, FaExclamationTriangle, FaMapMarkerAlt, FaCalendarAlt, FaUserCircle } from 'react-icons/fa';
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
  
  // Carregar posts e denúncias ao montar o componente
  useEffect(() => {
    fetchPosts();
    fetchReports();
  }, []);
  
  // Função para buscar posts do Firestore
  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, "community_posts"), 
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const postsData = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const postData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          // Converter timestamp para data legível
          createdAt: docSnapshot.data().createdAt ? 
                    docSnapshot.data().createdAt.toDate() : 
                    new Date(),
          comments: []
        };
        
        // Buscar comentários para este post
        const commentsQuery = query(
          collection(db, "community_posts", docSnapshot.id, "comments"),
          orderBy("createdAt", "asc")
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        postData.comments = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data(),
          createdAt: commentDoc.data().createdAt ? 
                    commentDoc.data().createdAt.toDate() : 
                    new Date()
        }));
        
        postsData.push(postData);
      }
      
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
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? 
                  doc.data().createdAt.toDate() : 
                  new Date()
      }));
      
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
      
      // Criar nova postagem no Firestore
      const newPost = {
        content: newPostContent,
        imageUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Usuário anônimo",
        userPhotoURL: currentUser.photoURL || null,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "community_posts"), newPost);
      
      // Limpar o formulário
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostImagePreview(null);
      
      ecoToastSuccess("Postagem publicada com sucesso! 🌱");
      
      // Recarregar posts
      fetchPosts();
    } catch (error) {
      console.error("Erro ao criar postagem:", error);
      ecoToastError("Não foi possível publicar sua postagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com upload de imagem
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
  
  // Função para remover imagem selecionada
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
            <h2 className="reports-title">Denúncias Recentes</h2>
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Carregando denúncias...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="no-content">
                <p>Não há denúncias recentes. Isso é bom! 🌎</p>
              </div>
            ) : (
              reports.map(report => (
                <div className="report-card" key={report.id}>
                  <div className="report-header">
                    <h3>
                      <FaExclamationTriangle /> Descarte Irregular
                    </h3>
                    <span className="report-status pending">Pendente</span>
                  </div>
                  
                  {report.imageUrl && (
                    <div className="report-image">
                      <img src={report.imageUrl} alt="Imagem da denúncia" />
                    </div>
                  )}
                  
                  <div className="report-details">
                    <p className="report-type">
                      <strong>Tipo:</strong> {getWasteTypeLabel(report.wasteType)}
                    </p>
                    
                    {report.description && (
                      <p className="report-description">
                        <strong>Descrição:</strong> {report.description}
                      </p>
                    )}
                    
                    <p className="report-location">
                      <FaMapMarkerAlt /> Localização aproximada:
                      {report.location && (
                        <span>
                          {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </span>
                      )}
                    </p>
                    
                    <p className="report-date">
                      <FaCalendarAlt /> Reportado em: {formatDate(report.createdAt)}
                    </p>
                  </div>
                  
                  <div className="report-actions">
                    <button className="map-button">
                      Ver no Mapa
                    </button>
                    
                    <button className="support-button">
                      Apoiar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;