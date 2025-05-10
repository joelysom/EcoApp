import React, { useState, useEffect } from "react";
import {
  FaExclamationTriangle,
  FaCamera,
  FaTrash,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCopy,
} from "react-icons/fa";
import "./ReportForm.css";
import { generateDescription } from "../../services/OpenAIService";
const ReportForm = ({
  currentUser,
  onClose,
  onReportSubmitted,
  ecoToastError,
  ecoToastSuccess,
}) => {
  // Estados para controlar o fluxo do formulário
  const [currentStep, setCurrentStep] = useState(
    currentUser?.isAnonymous ? 1 : 0
  );
  const [serviceType, setServiceType] = useState("");
  const [reportData, setReportData] = useState({
    photo: null,
    description: "",
    quantity: "",
    frequency: "",
    location: {
      cep: "",
      address: "",
      latitude: null,
      longitude: null,
    },
    hasPGRCC: null,
  });
  const [userData, setUserData] = useState({
    fullName: currentUser?.displayName || "",
    document: "",
    contact: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para capturar localização atual do usuário ao abrir formulário
  useEffect(() => {
    if (!currentUser?.isAnonymous && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReportData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }, [currentUser?.isAnonymous]);

  const handleNextStep = () => {
    let isValid = true;
    const errors = {};

    switch (currentStep) {
      case 0: // Escolha do serviço
        if (!serviceType) errors.serviceType = "Selecione um tipo de serviço";
        break;
      case 1: // Formulario
        if (!reportData.photo) errors.photo = "Adicione uma foto";
        if (!reportData.description.trim())
          errors.description = "A descrição é obrigatória";
        if (!reportData.location.cep.trim()) errors.cep = "O CEP é obrigatório";
        break;
      case 2: // Revisão
        break;
      default:
        break;
    }

    setFormErrors(errors);
    isValid = Object.keys(errors).length === 0;

    if (isValid) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
    setSubmissionResult(null); // Clear submission result on going back
  };

  const handleServiceTypeChange = (type) => {
    setServiceType(type);
    setCurrentStep(1); // Move to the form step after selecting service type
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith("location.")) {
      const locationKey = name.split(".")[1];
      setReportData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationKey]: value,
        },
      }));
      if (locationKey === "cep" && value.length === 8) {
        fetchAddressFromCep(value);
      }
    } else {
      setReportData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReportData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();

      reader.onloadend = async () => {
        setImagePreview(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReportData((prev) => ({ ...prev, photo: null }));
    setImagePreview(null);
  };

  const fetchAddressFromCep = async (cep) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro && data.logradouro) {
        setReportData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
          },
        }));
      } else {
        ecoToastError("CEP não encontrado ou inválido.");
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      ecoToastError("Erro ao buscar endereço. Tente novamente.");
    } finally {
      setLoadingAddress(false);
    }
  };

  const generateAIDescription = async () => {
    if (!reportData.photo) {
      ecoToastError("Por favor, adicione uma foto antes de gerar a descrição.");
      return;
    }

    try {
      // Convert the image file to base64
      const reader = new FileReader();
      reader.readAsDataURL(reportData.photo);

      reader.onload = async () => {
        try {
          // Extract base64 data from the result (remove the data:image/*;base64, prefix)
          const base64Image = reader.result.split(",")[1];
          const description = await generateDescription(base64Image);
          setReportData((prev) => ({ ...prev, description: description }));
          ecoToastSuccess("Descrição gerada com sucesso!");
        } catch (error) {
          console.error("Erro ao gerar descrição:", error);
          ecoToastError("Erro ao gerar descrição. Tente novamente.");
        }
      };

      reader.onerror = (error) => {
        console.error("Erro ao ler a imagem:", error);
        ecoToastError("Erro ao processar a imagem. Tente novamente.");
      };
    } catch (error) {
      console.error("Erro ao comunicar com o serviço de IA:", error);
      ecoToastError("Erro ao comunicar com o serviço de IA.");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.5;
      if (success) {
        setSubmissionResult({ id: Math.random().toString(36).substring(7) });
        ecoToastSuccess(
          `${
            serviceType === "denunciar" ? "Denúncia" : "Coleta"
          } registrada com sucesso!`
        );
        if (onReportSubmitted) {
          onReportSubmitted();
        }
      } else {
        ecoToastError(
          `Falha ao registrar a ${
            serviceType === "denunciar" ? "denúncia" : "coleta"
          }. Tente novamente.`
        );
      }
      setIsSubmitting(false);
      setCurrentStep(3); // Move to the result step
    }, 2000);
  };

  const copyToClipboard = () => {
    if (submissionResult?.id) {
      navigator.clipboard.writeText(submissionResult.id);
      ecoToastSuccess("ID copiado para a área de transferência!");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Escolha Denúncia ou Coleta
        return (
          <div className="form-step">
            <h3>O que você gostaria de fazer?</h3>
            <div className="service-options">
              <div
                className={`service-option ${
                  serviceType === "denunciar" ? "selected" : ""
                }`}
                onClick={() => handleServiceTypeChange("denunciar")}
              >
                <FaExclamationTriangle size={24} />
                <p>Denunciar descarte ilegal</p>
              </div>
              <div
                className={`service-option ${
                  serviceType === "coletar" ? "selected" : ""
                }`}
                onClick={() => handleServiceTypeChange("coletar")}
              >
                <FaTrash size={24} />
                <p>Solicitar coleta de resíduos</p>
              </div>
            </div>
            {formErrors.serviceType && (
              <span className="error-message">{formErrors.serviceType}</span>
            )}
          </div>
        );
      case 1: // Formulário
        return (
          <div className="form-step">
            <h3>
              Informações da{" "}
              {serviceType === "denunciar" ? "Denúncia" : "Coleta"}
            </h3>
            <div className="form-group">
              <label htmlFor="photo" className="image-upload-label">
                <FaCamera /> Adicionar Foto
              </label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                required
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={handleRemoveImage}
                  >
                    <FaTrash />
                  </button>
                </div>
              )}

              {formErrors.photo && (
                <span className="error-message">{formErrors.photo}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descrição:</label>
              <textarea
                id="description"
                name="description"
                value={reportData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
              {formErrors.description && (
                <span className="error-message">{formErrors.description}</span>
              )}
              <button
                type="button"
                className="info-button"
                onClick={generateAIDescription}
              >
                Gerar descrição por IA
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">
                Quantidade aproximada de resíduos:
              </label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={reportData.quantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Frequência do descarte:</label>
              <select
                id="frequency"
                name="frequency"
                value={reportData.frequency}
                onChange={handleInputChange}
              >
                <option value="">Selecione</option>
                <option value="unico">Única</option>
                <option value="diario">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="irregular">Irregular</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location.cep">CEP:</label>
              <input
                type="text"
                id="location.cep"
                name="location.cep"
                value={reportData.location.cep}
                onChange={handleInputChange}
                maxLength="8"
                required
              />
              {formErrors.cep && (
                <span className="error-message">{formErrors.cep}</span>
              )}
              {loadingAddress && (
                <p className="loading-message">Buscando endereço...</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location.address">Endereço:</label>
              <input
                type="text"
                id="location.address"
                name="location.address"
                value={reportData.location.address}
                onChange={handleInputChange}
                readOnly
              />
            </div>

            {serviceType === "coletar" && (
              <div className="form-group">
                <label htmlFor="hasPGRCC">Possui PGRCC?</label>
                <select
                  id="hasPGRCC"
                  name="hasPGRCC"
                  value={reportData.hasPGRCC}
                  onChange={handleInputChange}
                >
                  <option value={null}>Selecione</option>
                  <option value={true}>Sim</option>
                  <option value={false}>Não</option>
                </select>
              </div>
            )}
          </div>
        );
      case 2: // Revisão
        return (
          <div className="form-step">
            <h3>
              Revisão da {serviceType === "denunciar" ? "Denúncia" : "Coleta"}
            </h3>
            {imagePreview && (
              <div className="review-image">
                <img src={imagePreview} alt="Revisão" />
              </div>
            )}
            <p>
              <strong>Descrição:</strong> {reportData.description}
            </p>
            {reportData.quantity && (
              <p>
                <strong>Quantidade:</strong> {reportData.quantity}
              </p>
            )}
            {reportData.frequency && (
              <p>
                <strong>Frequência:</strong> {reportData.frequency}
              </p>
            )}
            <p>
              <strong>Localização:</strong> {reportData.location.address} (
              {reportData.location.cep})
            </p>
            {reportData.hasPGRCC !== null && (
              <p>
                <strong>Possui PGRCC:</strong>{" "}
                {reportData.hasPGRCC ? "Sim" : "Não"}
              </p>
            )}
            {/* Add more review details here */}
          </div>
        );
      case 3: // Resultado do Backend
        return (
          <div className="form-step">
            <h3>{isSubmitting ? "Enviando..." : "Resultado"}</h3>
            {isSubmitting ? (
              <p>
                Aguarde enquanto sua{" "}
                {serviceType === "denunciar"
                  ? "denúncia"
                  : "solicitação de coleta"}{" "}
                é processada...
              </p>
            ) : submissionResult?.id ? (
              <>
                <p>
                  Sua{" "}
                  {serviceType === "denunciar"
                    ? "denúncia"
                    : "solicitação de coleta"}
                  foi registrada com sucesso!
                </p>
                <strong>ID de Protocolo:</strong>
                <button
                  type="button"
                  className="info-button"
                  onClick={copyToClipboard}
                >
                  {submissionResult.id} <FaCopy />
                </button>
                {/* You might want to display classification from OpenAI here */}
              </>
            ) : (
              <p>Ocorreu um erro ao registrar. Por favor, tente novamente.</p>
            )}
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
            {serviceType === "denunciar" ? (
              <>
                <FaExclamationTriangle /> Nova Denúncia
              </>
            ) : serviceType === "coletar" ? (
              <>
                <FaTrash /> Solicitar Coleta
              </>
            ) : (
              "Novo Registro"
            )}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="steps-indicator">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`step-indicator ${
                  currentStep === step ? "active" : ""
                } ${currentStep > step ? "completed" : ""}`}
              >
                {currentStep > step ? <FaCheck /> : step + 1}
              </div>
            ))}
          </div>
          {renderStep()}
        </div>
        <div className="form-navigation">
          {currentStep > 0 && currentStep < 3 && (
            <button
              type="button"
              className="prev-button"
              onClick={handlePrevStep}
            >
              <FaArrowLeft /> Anterior
            </button>
          )}
          {currentStep < 2 && (
            <button
              type="button"
              className="next-button"
              onClick={handleNextStep}
            >
              Próximo <FaArrowRight />
            </button>
          )}
          {currentStep === 2 && (
            <button
              type="button"
              className="submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
              <FaCheck />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
