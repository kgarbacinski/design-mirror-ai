import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  stage: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, stage }) => {
  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-stage">{stage}</span>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>

      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-spinner">
        <div className="spinner"></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
