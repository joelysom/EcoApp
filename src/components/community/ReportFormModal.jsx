
// src/components/community/ReportFormModal.js
import React, { useRef } from 'react';
import { FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';

const ReportFormModal = ({ 
  showReportForm, 
  setShowReportForm, 
  reportForm, 
  setReportForm, 
  handleReportFormChange,
  handleSubmitReport,
  userLocation,
  loading
}) => {
  const fileInputRef = useRef(null);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReportForm({ ...reportForm, image: file });
    }
  };
  
  if (!showReportForm) return null;
  
  return (
    <div className="modal-overlay" onClick={() => setShowReportForm(false)}>
      <div className="report-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reportar Problema</h2>
          <button 
            className="modal-close"
            onClick={() => setShowReportForm(false)}
          >
            &times;
          </button>
        </div>
        
        <form className="report-form" onSubmit={handleSubmitReport}>
          <div className="form-group">
            <label>Tipo</label>
            <select 
              name="type"
              value={reportForm.type}
              onChange={handleReportFormChange}
            >
              <option value="pollution">Poluição</option>
              <option value="waste">Descarte irregular</option>
              <option value="preservation">Área de preservação</option>
              <option value="initiative">Iniciativa ecológica</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Título *</label>
            <input 
              type="text"
              name="title"
              value={reportForm.title}
              onChange={handleReportFormChange}
              placeholder="Ex: Lixo acumulado na praça"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Descrição *</label>
            <textarea 
              name="description"
              value={reportForm.description}
              onChange={handleReportFormChange}
              placeholder="Descreva o problema em detalhes..."
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>Foto (Opcional)</label>
            <input 
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button 
              type="button"
              className="upload-image-btn"
              onClick={() => fileInputRef.current.click()}
            >
              {reportForm.image ? 'Imagem selecionada' : 'Selecionar imagem'}
            </button>
            {reportForm.image && (
              <div className="image-preview">
                <img 
                  src={URL.createObjectURL(reportForm.image)} 
                  alt="Preview" 
                />
                <button 
                  type="button"
                  className="remove-image-btn"
                  onClick={() => setReportForm({ ...reportForm, image: null })}
                >
                  Remover imagem
                </button>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Localização *</label>
            {userLocation ? (
              <div className="location-preview">
                <FaMapMarkerAlt /> Usando sua localização atual
              </div>
            ) : (
              <div className="location-error">
                <FaExclamationTriangle /> Não foi possível obter sua localização
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
              disabled={!reportForm.title || !reportForm.description || !userLocation || loading}
            >
              {loading ? 'Enviando...' : 'Enviar Denúncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportFormModal;