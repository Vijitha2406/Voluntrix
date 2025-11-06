import React from 'react';
import MyApplications from './MyApplications';

const MyApplicationsPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="page-icon">📝</span>
          My Applications
        </h1>
        <p className="page-subtitle">
          Track the status of your volunteer applications and see your progress
        </p>
      </div>
      
      <div className="page-content">
        <MyApplications />
      </div>
    </div>
  );
};

export default MyApplicationsPage;