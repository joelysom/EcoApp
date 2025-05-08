
// src/components/community/ReportButton.js
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ReportButton = ({ setShowReportForm }) => {
  return (
    <button 
      className="report-button"
      onClick={() => setShowReportForm(true)}
    >
      <FaExclamationTriangle /> Reportar problema
    </button>
  );
};

export default ReportButton;
