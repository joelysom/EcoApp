import React, { useState, useRef } from 'react';
import { FaCamera, FaTimes, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../services/firebase';

// Componente de botão de denúncia para ser adicionado ao MapPage.jsx
const ReportButton = ({ currentLocation, leafletMap }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Tipos de resíduos para seleção
  const wasteTypes = [
    { id: 'plastic', label: 'Plástico' },
    { id: 'glass', label: 'Vidro' },
    { id: 'paper', label: 'Papel/Papelão' },
    { id: 'electronic', label: 'Eletrônico' },
    { id: 'construction', label: 'Entulho' },
    { id: 'furniture', label: 'Móveis' },
    { id: 'other', label: 'Outro' }
  ];

  // Abrir o modal de denúncia
  const openReportModal = () => {
    setIsModalOpen(true);
    // Armazenar a posição atual do mapa para não perder quando fechar o modal
    if (leafletMap) {
      leafletMap.dragging.disable();
    }
  };

  // Fechar o modal de denúncia
  const closeReportModal = () => {
    setIsModalOpen(false);
    setImage(null);
    setImagePreview(null);
    setDescription('');
    setWasteType('');
    setSubmitStatus(null);
    // Reativar o arrastar do mapa
    if (leafletMap) {
      leafletMap.dragging.enable();
    }
  };

  // Lidar com a seleção de imagem
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Abrir câmera ou seletor de arquivos
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Enviar a denúncia
  const submitReport = async () => {
    if (!currentLocation) {
      setSubmitStatus({
        success: false,
        message: 'Não foi possível obter sua localização. Tente novamente.'
      });
      return;
    }

    if (!image) {
      setSubmitStatus({
        success: false,
        message: 'É necessário anexar uma foto do descarte.'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Fazer upload da imagem para o Firebase Storage
      const storage = getStorage(app);
      const imageFileName = `reports/${Date.now()}_${image.name}`;
      const storageRef = ref(storage, imageFileName);
      
      await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Salvar os dados da denúncia no Firestore
      const db = getFirestore(app);
      await addDoc(collection(db, "reports"), {
        location: {
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        imageUrl,
        description,
        wasteType,
        status: 'pending', // pendente, em análise, resolvido
        createdAt: serverTimestamp(),
        userId: 'anonymous' // Substituir pelo ID do usuário quando tiver sistema de autenticação
      });

      setSubmitStatus({
        success: true,
        message: 'Denúncia enviada com sucesso! Obrigado por contribuir.'
      });

      // Fechar o modal após 2 segundos
      setTimeout(() => {
        closeReportModal();
      }, 2000);

    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      setSubmitStatus({
        success: false,
        message: 'Ocorreu um erro ao enviar sua denúncia. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botão flutuante de denúncia */}
      <button 
        className="report-btn"
        onClick={openReportModal}
        title="Denunciar descarte irregular"
      >
        <FaCamera />
        <span>Denunciar descarte</span>
      </button>

      {/* Modal de denúncia */}
      {isModalOpen && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <button className="close-modal-btn" onClick={closeReportModal}>
              <FaTimes />
            </button>
            
            <h2>Denunciar descarte irregular</h2>
            
            {submitStatus ? (
              <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
                {submitStatus.message}
              </div>
            ) : (
              <>
                <div className="location-info">
                  <FaMapMarkerAlt />
                  <span>
                    {currentLocation ? (
                      `Lat: ${currentLocation.lat.toFixed(6)}, Long: ${currentLocation.lng.toFixed(6)}`
                    ) : (
                      'Obtendo localização...'
                    )}
                  </span>
                </div>

                <div className="image-upload-section">
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button 
                        className="remove-image-btn"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder" onClick={triggerFileInput}>
                      <FaCamera />
                      <p>Toque para adicionar foto</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de resíduo:</label>
                  <select 
                    value={wasteType} 
                    onChange={(e) => setWasteType(e.target.value)}
                  >
                    <option value="">Selecione o tipo</option>
                    {wasteTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Descrição:</label>
                  <textarea
                    placeholder="Descreva brevemente o descarte irregular..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  ></textarea>
                </div>

                <button 
                  className="submit-report-btn"
                  onClick={submitReport}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar denúncia'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;