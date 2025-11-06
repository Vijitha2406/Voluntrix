import React from 'react';
import RecommendationsSection from './RecommendationsSection';

const RecommendationsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="page-icon">🎯</span>
          Recommended Events
        </h1>
        <p className="page-subtitle">
          Discover volunteer opportunities tailored to your skills, interests, and preferences
        </p>
      </div>
      
      <div className="page-content">
        <RecommendationsSection />
      </div>
    </div>
  );
};

export default RecommendationsPage;