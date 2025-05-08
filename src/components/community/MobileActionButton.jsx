
// src/components/community/MobileActionButton.js
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const MobileActionButton = ({ setShowReportForm }) => {
  return (
    <button 
      className="mobile-action-button"
      onClick={() => setShowReportForm(true)}
    >
      <FaExclamationTriangle />
    </button>
  );
};

export default MobileActionButton;