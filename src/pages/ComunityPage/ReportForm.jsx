import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCamera, FaTrash, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ReportForm.css';

const ReportForm = ({ currentUser, onClose, onReportSubmitted, ecoToastError, ecoToastSuccess }) => {
  const db = getFirestore();
  const storage = getStorage();
  
  // Estados para controlar o fluxo do formulário
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    fullName: currentUser?.displayName || '',
    document: '',
    contact: ''
  });
  const [serviceType, setServiceType] = useState('');
  const [reportData, setReportData] = useState({
    wasteType: '',
    description: '',
    responsible: '',
    location: {
      address: '',
      latitude: null,
      longitude: null
    },
    quantity: '',
    frequency: '',
    hasPGRCC: null,
    collectionBy: '',
    otherWasteType: ''
  });
  const [reportImage, setReportImage] = useState(null);
  const [reportImagePreview, setReportImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showPGRCCInfo, setShowPGRCCInfo] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Efeito para capturar localização atual do usuário ao abrir formulário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportData(prev => ({
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
  }, []);

  // Função para validar cada etapa
  const validateStep = (step) => {
    const errors = {};
    
    switch(step) {
      case 1: // Cadastro
        if (!userData.fullName.trim()) errors.fullName = 'Nome completo é obrigatório';
        if (!userData.document.trim()) errors.document = 'Documento é obrigatório';
        if (!userData.contact.trim()) errors.contact = 'Contato é obrigatório';
        break;
      case 2: // Escolha do serviço
        if (!serviceType) errors.serviceType = 'Selecione um tipo de serviço';
        break;
      case 3: // Tipo de resíduo e responsável
        if (!reportData.wasteType) errors.wasteType = 'Selecione um tipo de resíduo';
        if (!reportData.responsible && serviceType === 'denunciar') {
          errors.responsible = 'Selecione o responsável pelo descarte';
        }
        if (serviceType === 'coletar' && !reportData.collectionBy) {
          errors.collectionBy = 'Selecione quem deve realizar a coleta';
        }
        break;
      case 4: // PGRCC (se aplicável)
        if (reportData.wasteType === 'construction' && reportData.hasPGRCC === null) {
          errors.hasPGRCC = 'Informe se possui PGRCC';
        }
        break;
      case 5: // Detalhes adicionais
        if (!reportData.description.trim()) errors.description = 'Descrição é obrigatória';
        if (reportData.wasteType === 'construction' && !reportData.quantity.trim()) {
          errors.quantity = 'Quantidade aproximada é obrigatória';
        }
        if (serviceType === 'denunciar' && reportData.wasteType === 'construction' && !reportData.frequency.trim()) {
          errors.frequency = 'Frequência do descarte é obrigatória';
        }
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para avançar para o próximo passo
  const nextStep = () => {
    if (validateStep(currentStep)) {
      // Verificação especial para PGRCC
      if (currentStep === 3 && reportData.wasteType !== 'construction') {
        // Pular etapa PGRCC se não for entulho
        setCurrentStep(currentStep + 2);
      } else if (currentStep === 4 && reportData.wasteType === 'construction' && reportData.hasPGRCC === false) {
        // Não avança se não possui PGRCC e o resíduo é entulho
        return;
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Função para voltar para o passo anterior
  const prevStep = () => {
    if (currentStep === 5 && reportData.wasteType !== 'construction') {
      // Voltar pulando etapa PGRCC se não for entulho
      setCurrentStep(3);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função para lidar com o upload de imagem
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

  // Função para remover a imagem
  const removeReportImage = () => {
    setReportImage(null);
    setReportImagePreview(null);
  };

  // Função para usar a localização atual
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportData({
            ...reportData,
            location: {
              ...reportData.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          ecoToastError("Não foi possível obter sua localização atual. Por favor, insira manualmente.");
        }
      );
    } else {
      ecoToastError("Geolocalização não é suportada por este navegador.");
    }
  };

// Updated handleSubmitForm function with proper variable scoping
const handleSubmitForm = async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    ecoToastError("Você precisa estar logado para fazer uma denúncia ou solicitar uma coleta");
    return;
  }
  
  // Validate the form data before submitting
  if (!validateStep(6)) {
    ecoToastError("Por favor, verifique se todos os campos obrigatórios estão preenchidos");
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
    
    // Mapear tipo de resíduo para compatibilidade com o formato antigo
    const wasteTypeMapping = {
      'organic': 'organic',
      'plastic': 'plastic',
      'electronic': 'electronic',
      'construction': 'construction',
      'other': 'other'
    };
    
    // Criar nova denúncia no Firestore
    const reportDoc = {
      // Dados do usuário
      userId: currentUser.uid,
      userName: userData.fullName || currentUser.displayName || "Usuário anônimo",
      userDocument: userData.document,
      userContact: userData.contact,
      userPhotoURL: currentUser.photoURL || null,
      
      // Dados da denúncia/coleta
      serviceType: serviceType,
      description: reportData.description,
      wasteType: wasteTypeMapping[reportData.wasteType] || reportData.wasteType,
      otherWasteType: reportData.otherWasteType,
      responsible: reportData.responsible,
      collectionBy: reportData.collectionBy,
      quantity: reportData.quantity,
      frequency: reportData.frequency,
      hasPGRCC: reportData.hasPGRCC,
      
      // Localização
      location: reportData.location,
      
      // Imagem
      imageUrl,
      
      // Metadados
      status: "pending",
      deleted: false,
      contentType: serviceType === 'denunciar' ? 'report' : 'collection_request', // Tipo de conteúdo para compatibilidade com o painel admin
      createdAt: serverTimestamp()
    };
    
    const collectionRef = collection(db, "reports");
    const docRef = await addDoc(collectionRef, reportDoc);
    console.log(`${serviceType === 'denunciar' ? 'Denúncia' : 'Coleta'} criada com ID:`, docRef.id);
    
    // Limpar o formulário
    setUserData({
      fullName: currentUser?.displayName || '',
      document: '',
      contact: ''
    });
    setServiceType('');
    setReportData({
      wasteType: '',
      description: '',
      responsible: '',
      location: {
        address: '',
        latitude: null,
        longitude: null
      },
      quantity: '',
      frequency: '',
      hasPGRCC: null,
      collectionBy: '',
      otherWasteType: ''
    });
    setReportImage(null);
    setReportImagePreview(null);
    
    ecoToastSuccess(serviceType === 'denunciar' 
      ? "Denúncia enviada com sucesso! Obrigado pela sua contribuição!" 
      : "Solicitação de coleta enviada com sucesso! Acompanhe o status pelo seu perfil."
    );
    
    // Notificar o componente pai que uma nova denúncia foi enviada
    if (onReportSubmitted) {
      onReportSubmitted();
    }
    
    // Fechar o formulário
    if (onClose) {
      onClose();
    }
  } catch (error) {
    console.error(`Erro ao criar ${serviceType === 'denunciar' ? 'denúncia' : 'solicitação de coleta'}:`, error);
    ecoToastError(`Não foi possível enviar sua ${serviceType === 'denunciar' ? 'denúncia' : 'solicitação de coleta'}. Tente novamente.`);
  } finally {
    setIsSubmittingReport(false);
  }
};

  // Função para mostrar informações sobre PGRCC
  const togglePGRCCInfo = () => {
    setShowPGRCCInfo(!showPGRCCInfo);
  };

  // Renderizar a etapa atual do formulário
  const renderStep = () => {
    switch(currentStep) {
      case 1: // Cadastro/Identificação
        return (
          <div className="form-step">
            <h3>Cadastro</h3>
            <div className="form-group">
              <label htmlFor="fullName">Nome completo:</label>
              <input 
                type="text"
                id="fullName"
                value={userData.fullName}
                onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                className={formErrors.fullName ? 'error' : ''}
                required
              />
              {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="document">CPF ou documento de identificação:</label>
              <input 
                type="text"
                id="document"
                value={userData.document}
                onChange={(e) => setUserData({...userData, document: e.target.value})}
                className={formErrors.document ? 'error' : ''}
                required
              />
              {formErrors.document && <span className="error-message">{formErrors.document}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="contact">Telefone ou e-mail para contato:</label>
              <input 
                type="text"
                id="contact"
                value={userData.contact}
                onChange={(e) => setUserData({...userData, contact: e.target.value})}
                className={formErrors.contact ? 'error' : ''}
                required
              />
              {formErrors.contact && <span className="error-message">{formErrors.contact}</span>}
            </div>
          </div>
        );
      
      case 2: // Escolha do Serviço
        return (
          <div className="form-step">
            <h3>O que você gostaria de fazer?</h3>
            <div className="service-options">
              <div 
                className={`service-option ${serviceType === 'denunciar' ? 'selected' : ''}`}
                onClick={() => setServiceType('denunciar')}
              >
                <FaExclamationTriangle size={24} />
                <p>Denunciar descarte ilegal</p>
              </div>
              
              <div 
                className={`service-option ${serviceType === 'coletar' ? 'selected' : ''}`}
                onClick={() => setServiceType('coletar')}
              >
                <FaTrash size={24} />
                <p>Solicitar coleta de resíduos</p>
              </div>
            </div>
            {formErrors.serviceType && <span className="error-message">{formErrors.serviceType}</span>}
          </div>
        );
      
      case 3: // Tipo de resíduo e responsável
        return (
          <div className="form-step">
            <h3>Informações do {serviceType === 'denunciar' ? 'Descarte' : 'Material'}</h3>
            
            <div className="form-group">
              <label htmlFor="reportImage" className="image-upload-label">
                <FaCamera /> {serviceType === 'denunciar' ? 'Adicionar foto do local' : 'Adicionar foto do material'} (opcional)
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
            
            <div className="form-group">
              <label htmlFor="wasteType">Tipo de resíduo:</label>
              <select 
                id="wasteType"
                value={reportData.wasteType}
                onChange={(e) => setReportData({...reportData, wasteType: e.target.value})}
                className={formErrors.wasteType ? 'error' : ''}
                required
              >
                <option value="">Selecione</option>
                <option value="organic">Orgânico</option>
                <option value="plastic">Plástico</option>
                <option value="electronic">Eletrônico</option>
                <option value="construction">Entulho</option>
                <option value="other">Outros</option>
              </select>
              {formErrors.wasteType && <span className="error-message">{formErrors.wasteType}</span>}
            </div>
            
            {reportData.wasteType === 'other' && (
              <div className="form-group">
                <label htmlFor="otherWasteType">Especifique o tipo de resíduo:</label>
                <input 
                  type="text"
                  id="otherWasteType"
                  value={reportData.otherWasteType || ''}
                  onChange={(e) => setReportData({...reportData, otherWasteType: e.target.value})}
                  required
                />
              </div>
            )}
            
            {serviceType === 'denunciar' && (
              <div className="form-group">
                <label htmlFor="responsible">Quem são os agentes responsáveis pelo descarte?</label>
                <select 
                  id="responsible"
                  value={reportData.responsible}
                  onChange={(e) => setReportData({...reportData, responsible: e.target.value})}
                  className={formErrors.responsible ? 'error' : ''}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="pessoa_fisica">Pessoa física (Indivíduo, Grupo, Comunidade)</option>
                  <option value="pessoa_juridica">Pessoa jurídica (Empresa, Comércio, Instituição)</option>
                </select>
                {formErrors.responsible && <span className="error-message">{formErrors.responsible}</span>}
              </div>
            )}
            
            {serviceType === 'coletar' && (
              <div className="form-group">
                <label htmlFor="collectionBy">Quem deve realizar a coleta?</label>
                <select 
                  id="collectionBy"
                  value={reportData.collectionBy}
                  onChange={(e) => setReportData({...reportData, collectionBy: e.target.value})}
                  className={formErrors.collectionBy ? 'error' : ''}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="emlurb">EMLURB</option>
                  <option value="catadores">Catadores</option>
                  <option value="ong">ONG ou Instituição de Reciclagem</option>
                </select>
                {formErrors.collectionBy && <span className="error-message">{formErrors.collectionBy}</span>}
              </div>
            )}
          </div>
        );
      
      case 4: // Verificação PGRCC (se aplicável)
        return (
          <div className="form-step">
            {reportData.wasteType === 'construction' ? (
              <>
                <h3>Verificação de PGRCC</h3>
                <div className="form-group pgrcc-section">
                  <label>Este {serviceType === 'denunciar' ? 'descarte' : 'material'} possui um Plano de Gerenciamento de Resíduos da Construção Civil (PGRCC)?</label>
                  <div className="radio-options">
                    <label className="radio-option">
                      <input 
                        type="radio" 
                        name="hasPGRCC" 
                        value="true"
                        checked={reportData.hasPGRCC === true}
                        onChange={() => setReportData({...reportData, hasPGRCC: true})}
                      />
                      Sim
                    </label>
                    <label className="radio-option">
                      <input 
                        type="radio" 
                        name="hasPGRCC" 
                        value="false"
                        checked={reportData.hasPGRCC === false}
                        onChange={() => setReportData({...reportData, hasPGRCC: false})}
                      />
                      Não
                    </label>
                  </div>
                  {formErrors.hasPGRCC && <span className="error-message">{formErrors.hasPGRCC}</span>}
                  
                  {reportData.hasPGRCC === false && (
                    <div className="pgrcc-warning">
                      <p>
                        <strong>Atenção:</strong> Segundo as regras da cidade de Recife, é obrigatório possuir um PGRCC para o {serviceType === 'denunciar' ? 'descarte de entulhos' : 'solicitar a coleta de entulhos'}. Por favor, regularize antes de {serviceType === 'denunciar' ? 'registrar a denúncia' : 'prosseguir'}.
                      </p>
                      <button 
                        type="button" 
                        className="info-button"
                        onClick={togglePGRCCInfo}
                      >
                        Saiba mais sobre o PGRCC
                      </button>
                      
                      {showPGRCCInfo && (
                        <div className="pgrcc-info-modal">
                          <div className="pgrcc-info-content">
                            <h4>O que é um PGRCC?</h4>
                            <p>Um PGRCC é obrigatório para a gestão de resíduos da construção civil em Recife. Você pode consultar as orientações no site da Prefeitura de Recife.</p>
                            <a 
                              href="https://www.recife.pe.gov.br" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="pgrcc-link"
                            >
                              Saiba mais sobre o PGRCC
                            </a>
                            <button 
                              type="button" 
                              className="close-info-button"
                              onClick={togglePGRCCInfo}
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Se não for entulho, avança automaticamente para o próximo passo
              <>
                <div className="loading-step">
                  <p>Carregando próxima etapa...</p>
                </div>
                {useEffect(() => {
                  setCurrentStep(currentStep + 1);
                }, [])}
              </>
            )}
          </div>
        );
      
      case 5: // Detalhes adicionais
        return (
          <div className="form-step">
            <h3>Detalhes Adicionais</h3>
            
            <div className="form-group">
              <label htmlFor="description">Descrição {serviceType === 'denunciar' ? 'da Ocorrência' : 'do Material'}:</label>
              <textarea 
                id="description"
                value={reportData.description}
                onChange={(e) => setReportData({...reportData, description: e.target.value})}
                placeholder={`Descreva detalhadamente ${serviceType === 'denunciar' ? 'o que você encontrou' : 'o material a ser coletado'}...`}
                rows="4"
                className={formErrors.description ? 'error' : ''}
                required
              ></textarea>
              {formErrors.description && <span className="error-message">{formErrors.description}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantidade aproximada de resíduo:</label>
              <input 
                type="text"
                id="quantity"
                value={reportData.quantity}
                onChange={(e) => setReportData({...reportData, quantity: e.target.value})}
                placeholder="Ex: 2 sacos grandes, 1 caçamba, etc."
                className={formErrors.quantity ? 'error' : ''}
                required={reportData.wasteType === 'construction'}
              />
              {formErrors.quantity && <span className="error-message">{formErrors.quantity}</span>}
            </div>
            
            {serviceType === 'denunciar' && (
              <div className="form-group">
                <label htmlFor="frequency">Frequência do descarte:</label>
                <select 
                  id="frequency"
                  value={reportData.frequency}
                  onChange={(e) => setReportData({...reportData, frequency: e.target.value})}
                  className={formErrors.frequency ? 'error' : ''}
                  required={reportData.wasteType === 'construction'}
                >
                  <option value="">Selecione</option>
                  <option value="unico">Ocorrência única</option>
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="irregular">Irregular</option>
                </select>
                {formErrors.frequency && <span className="error-message">{formErrors.frequency}</span>}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="address">Endereço:</label>
              <input 
                type="text"
                id="address"
                value={reportData.location.address}
                onChange={(e) => setReportData({
                  ...reportData, 
                  location: {...reportData.location, address: e.target.value}
                })}
                placeholder="Ex: Rua exemplo, nº 123, Bairro"
              />
            </div>
            
            <div className="form-group">
              <button 
                type="button" 
                className="location-button"
                onClick={useCurrentLocation}
              >
                Usar minha localização atual
              </button>
            </div>
            
            <div className="form-group coordinates">
              <div>
                <label htmlFor="latitude">Latitude:</label>
                <input 
                  type="number" 
                  id="latitude"
                  value={reportData.location.latitude || ''}
                  onChange={(e) => setReportData({
                    ...reportData, 
                    location: {...reportData.location, latitude: parseFloat(e.target.value) || null}
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
                  value={reportData.location.longitude || ''}
                  onChange={(e) => setReportData({
                    ...reportData, 
                    location: {...reportData.location, longitude: parseFloat(e.target.value) || null}
                  })}
                  placeholder="Ex: -46.6333"
                  step="any"
                />
              </div>
            </div>
          </div>
        );
      
      case 6: // Confirmação
        return (
          <div className="form-step confirmation-step">
            <h3>Confirmação</h3>
            <div className="confirmation-details">
              <h4>Dados do Usuário</h4>
              <p><strong>Nome:</strong> {userData.fullName}</p>
              <p><strong>Documento:</strong> {userData.document}</p>
              <p><strong>Contato:</strong> {userData.contact}</p>
              
              <h4>Informações do {serviceType === 'denunciar' ? 'Descarte' : 'Material'}</h4>
              <p><strong>Tipo de serviço:</strong> {serviceType === 'denunciar' ? 'Denúncia de descarte ilegal' : 'Solicitação de coleta'}</p>
              <p><strong>Tipo de resíduo:</strong> {
                reportData.wasteType === 'organic' ? 'Orgânico' :
                reportData.wasteType === 'plastic' ? 'Plástico' :
                reportData.wasteType === 'electronic' ? 'Eletrônico' :
                reportData.wasteType === 'construction' ? 'Entulho' :
                reportData.wasteType === 'other' ? `Outro: ${reportData.otherWasteType}` : ''
              }</p>
              
              {serviceType === 'denunciar' && reportData.responsible && (
                <p><strong>Responsável pelo descarte:</strong> {
                  reportData.responsible === 'pessoa_fisica' ? 'Pessoa física' :
                  reportData.responsible === 'pessoa_juridica' ? 'Pessoa jurídica' : ''
                }</p>
              )}
              
              {serviceType === 'coletar' && reportData.collectionBy && (
                <p><strong>Coleta a ser realizada por:</strong> {
                  reportData.collectionBy === 'emlurb' ? 'EMLURB' :
                  reportData.collectionBy === 'catadores' ? 'Catadores' :
                  reportData.collectionBy === 'ong' ? 'ONG ou Instituição de Reciclagem' : ''
                }</p>
              )}
              
              {reportData.wasteType === 'construction' && reportData.hasPGRCC !== null && (
                <p><strong>Possui PGRCC:</strong> {reportData.hasPGRCC ? 'Sim' : 'Não'}</p>
              )}
              
              {reportData.description && (
                <p><strong>Descrição:</strong> {reportData.description}</p>
              )}
              
              {reportData.quantity && (
                <p><strong>Quantidade:</strong> {reportData.quantity}</p>
              )}
              
              {serviceType === 'denunciar' && reportData.frequency && (
                <p><strong>Frequência:</strong> {
                  reportData.frequency === 'unico' ? 'Ocorrência única' :
                  reportData.frequency === 'diario' ? 'Diário' :
                  reportData.frequency === 'semanal' ? 'Semanal' :
                  reportData.frequency === 'mensal' ? 'Mensal' :
                  reportData.frequency === 'irregular' ? 'Irregular' : ''
                }</p>
              )}
              
              {reportData.location.address && (
                <p><strong>Endereço:</strong> {reportData.location.address}</p>
              )}
              
              {reportData.location.latitude && reportData.location.longitude && (
                <p><strong>Coordenadas:</strong> {reportData.location.latitude}, {reportData.location.longitude}</p>
              )}

{reportImagePreview && (
                <div className="confirmation-image">
                  <p><strong>Imagem:</strong></p>
                  <img src={reportImagePreview} alt="Imagem do local/material" />
                </div>
              )}
            </div>
            
            <p className="confirmation-question">Essas informações estão corretas?</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content report-form-modal">
        <div className="modal-header">
          <h2>
            {serviceType === 'denunciar' ? 
              <><FaExclamationTriangle /> Nova Denúncia Ambiental</> : 
              serviceType === 'coletar' ? 
                <><FaTrash /> Solicitação de Coleta</> : 
                <><FaExclamationTriangle /> Novo Registro</>
            }
          </h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="steps-indicator">
            {[1, 2, 3, 4, 5, 6].map(step => (
              <div 
                key={step} 
                className={`step-indicator ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
              >
                {currentStep > step ? <FaCheck /> : step}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmitForm}>
            {renderStep()}
            
            <div className="form-navigation">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="prev-button"
                  onClick={prevStep}
                >
                  <FaArrowLeft /> Voltar
                </button>
              )}
              
              {currentStep < 6 && (
                <button 
                  type="button" 
                  className="next-button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 4 && reportData.wasteType === 'construction' && reportData.hasPGRCC === false)
                  }
                >
                  Avançar <FaArrowRight />
                </button>
              )}
              
              {currentStep === 6 && (
                <>
                  <button 
                    type="button" 
                    className="edit-button"
                    onClick={() => setCurrentStep(1)}
                  >
                    Editar Informações
                  </button>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? 'Enviando...' : 'Confirmar e Enviar'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;