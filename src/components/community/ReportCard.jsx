
// src/components/community/ReportCard.js
import React from 'react';
import { FaHeart, FaRegHeart, FaRegCommentAlt, FaShare } from 'react-icons/fa';
import { formatDate, getReportTypeLabel } from '../../utils/helpers';

const ReportCard = ({ 
  report, 
  handleSelectReport, 
  handleToggleLike, 
  currentUser 
}) => {
  return (
    <div className="report-card">
      <div className="report-header">
        <div className="report-user">
          <div className="user-avatar">
            {report.userAvatar ? (
              <img src={report.userAvatar} alt={report.userName} />
            ) : (
              report.userName?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-info">
            <h3>{report.userName}</h3>
            <p>{formatDate(report.createdAt)}</p>
          </div>
        </div>
        <div className={`report-type-badge ${report.type}`}>
          {getReportTypeLabel(report.type)}
        </div>
      </div>
      
      <h2 className="report-title">{report.title}</h2>
      <p className="report-description">{report.description}</p>
      
      {report.imageUrl && (
        <div className="report-image">
          <img src={report.imageUrl} alt={report.title} />
        </div>
      )}
      
      <div className="report-actions">
        <button 
          className={`action-button like-button ${report.likedBy?.includes(currentUser.uid) ? 'liked' : ''}`}
          onClick={() => handleToggleLike(report.id)}
        >
          {report.likedBy?.includes(currentUser.uid) ? <FaHeart /> : <FaRegHeart />} 
          {report.likes || 0}
        </button>
        
        <button 
          className="action-button comment-button"
          onClick={() => handleSelectReport(report)}
        >
          <FaRegCommentAlt /> {report.commentCount || 0}
        </button>
        
        <button className="action-button share-button">
          <FaShare />
        </button>
      </div>
    </div>
  );
};

export default ReportCard;