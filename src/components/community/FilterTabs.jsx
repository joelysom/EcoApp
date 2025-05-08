
// src/components/community/FilterTabs.js
import React from 'react';

const FilterTabs = ({ 
  activeFilter, 
  setActiveFilter, 
  setReports, 
  setLastVisible, 
  fetchReports 
}) => {
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setReports([]);
    setLastVisible(null);
    fetchReports();
  };

  return (
    <div className="feed-filters">
      <button 
        className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
        onClick={() => handleFilterChange('all')}
      >
        Todos
      </button>
      <button 
        className={`filter-pill ${activeFilter === 'pollution' ? 'active' : ''}`}
        onClick={() => handleFilterChange('pollution')}
      >
        Poluição
      </button>
      <button 
        className={`filter-pill ${activeFilter === 'waste' ? 'active' : ''}`}
        onClick={() => handleFilterChange('waste')}
      >
        Descarte
      </button>
      <button 
        className={`filter-pill ${activeFilter === 'preservation' ? 'active' : ''}`}
        onClick={() => handleFilterChange('preservation')}
      >
        Preservação
      </button>
      <button 
        className={`filter-pill ${activeFilter === 'initiative' ? 'active' : ''}`}
        onClick={() => handleFilterChange('initiative')}
      >
        Iniciativas
      </button>
    </div>
  );
};

export default FilterTabs;