
// src/components/community/ReportDetailsView.js
import React from 'react';
import { FaArrowLeft, FaHeart, FaRegHeart, FaRegCommentAlt, FaShare } from 'react-icons/fa';
import CommentSection from './CommentSection';
import { formatDate, getReportTypeLabel } from '../../utils/helpers';

const ReportDetailsView = ({ 
  selectedReport, 
  setActiveTab, 
  handleToggleLike, 
  currentUser, 
  comments, 
  newComment, 
  setNewComment, 
  handleSubmitComment 
}) => {
  return (
    <div className="report-details-container">
      <div className="report-details-header">
        <button 
          className="back-button"
          onClick={() => setActiveTab('map')}
        >
          <FaArrowLeft />
        </button>
        <h2>Detalhes da Denúncia</h2>
      </div>
      
      <div className="report-details-content">
        <div className="report-user-details">
          <div className="user-avatar">
            {selectedReport.userAvatar ? (
              <img src={selectedReport.userAvatar} alt={selectedReport.userName} />
            ) : (
              selectedReport.userName?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-info">
            <h3>{selectedReport.userName}</h3>
            <p>{formatDate(selectedReport.createdAt)}</p>
          </div>
          <div className={`report-type-badge ${selectedReport.type}`}>
            {getReportTypeLabel(selectedReport.type)}
          </div>
        </div>
        
        <h2 className="detail-title">{selectedReport.title}</h2>
        <p className="detail-description">{selectedReport.description}</p>
        
        {selectedReport.imageUrl && (
          <div className="detail-image">
            <img src={selectedReport.imageUrl} alt={selectedReport.title} />
          </div>
        )}
        
        <div className="detail-actions">
          <button 
            className={`action-button like-button ${selectedReport.likedBy?.includes(currentUser.uid) ? 'liked' : ''}`}
            onClick={() => handleToggleLike(selectedReport.id)}
          >
            {selectedReport.likedBy?.includes(currentUser.uid) ? <FaHeart /> : <FaRegHeart />} 
            {selectedReport.likes || 0}
          </button>
          
          <button className="action-button comment-button">
            <FaRegCommentAlt /> {selectedReport.commentCount || 0}
          </button>
          
          <button className="action-button share-button">
            <FaShare />
          </button>
        </div>
        
        <CommentSection 
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmitComment={handleSubmitComment}
        />
      </div>
    </div>
  );
};

export default ReportDetailsView;