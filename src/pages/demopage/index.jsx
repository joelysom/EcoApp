import React from "react";
import { useNavigate } from "react-router-dom";
import "./DemoPage.css";
import { useAuth } from "../../auth/auth";

const DemoPage = () => {
  const navigate = useNavigate();
  const { loginAsAnonymous } = useAuth();

  const handleDemoAccess = async () => {
    try {
      await loginAsAnonymous();
      navigate("/admincontent");
    } catch (error) {
      console.error("Failed to access demo:", error);
    }
  };

  const handleFormDemo = async () => {
    try {
      await loginAsAnonymous();
      navigate("/fullform", { state: { isDemo: true } });
    } catch (error) {
      console.error("Failed to access form demo:", error);
    }
  };

  return (
    <div className="container">
      <div className="demoCard">
        <img
          src="/src/assets/icon/icon.webp"
          alt="ColetAI Logo"
          className="icon"
        />
        <h1 className="title">ColetaAi</h1>

        <div className="section">
          <button className="button" onClick={handleFormDemo}>
            Acessar (Demo)
          </button>

          <button className="button secondaryButton" onClick={handleDemoAccess}>
            Painel Administrativo (Demo)
          </button>
        </div>

        <div className="infoText">Explore as funcionalidades do ColetAI</div>
      </div>
    </div>
  );
};

export default DemoPage;
