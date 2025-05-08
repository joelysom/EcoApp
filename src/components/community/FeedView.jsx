
// src/components/community/FeedView.js
import React from 'react';
import ReportCard from './ReportCard';
import FilterTabs from './FilterTabs';

const FeedView = ({ 
  reports, 
  activeFilter, 
  setActiveFilter, 
  fetchReports, 
  handleSelectReport, 
  handleToggleLike, 
  currentUser, 
  loading, 
  hasMore, 
  setReports, 
  setLastVisible, 
  setShowReportForm 
}) => {
  return (
    <div className="feed-container">
      <FilterTabs 
        activeFilter={activeFilter} 
        setActiveFilter={setActiveFilter}
        setReports={setReports}
        setLastVisible={setLastVisible}
        fetchReports={fetchReports}
      />
      
      {reports.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma denúncia encontrada nesta categoria.</p>
          <button 
            className="eco-button"
            onClick={() => setShowReportForm(true)}
          >
            Fazer uma denúncia
          </button>
        </div>
      ) : (
        <>
          <div className="reports-list">
            {reports.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                handleSelectReport={handleSelectReport}
                handleToggleLike={handleToggleLike}
                currentUser={currentUser}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={() => fetchReports(true)}
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedView;