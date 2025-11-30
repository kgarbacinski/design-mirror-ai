import React from 'react';
import type { AnalysisResult } from '@shared/types/design-system.types';

interface AnalysisResultsProps {
  data: {
    result: AnalysisResult;
    prompt: any;
  };
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data }) => {
  const { result } = data;

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>✓ Analysis Complete</h2>
        <p className="results-subtitle">{result.title}</p>
      </div>

      <div className="results-summary">
        <div className="summary-item">
          <span className="summary-label">Elements</span>
          <span className="summary-value">{result.elementCount}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Colors</span>
          <span className="summary-value">{result.colors.all.length}</span>
        </div>

        <div className="summary-item">
          <span className="summary-label">Components</span>
          <span className="summary-value">{result.components.length}</span>
        </div>
      </div>

      <div className="design-preview">
        <h3>Design System Preview</h3>

        {/* Primary Color */}
        {result.colors.primary && (
          <div className="preview-section">
            <h4>Primary Color</h4>
            <div className="color-swatch-container">
              <div
                className="color-swatch"
                style={{ backgroundColor: result.colors.primary.centroid.hex }}
              />
              <span className="color-hex">{result.colors.primary.centroid.hex}</span>
            </div>
          </div>
        )}

        {/* Typography */}
        {result.typography.primaryFont && (
          <div className="preview-section">
            <h4>Primary Font</h4>
            <p className="font-preview" style={{ fontFamily: result.typography.primaryFont.name }}>
              {result.typography.primaryFont.name}
            </p>
          </div>
        )}

        {/* Spacing */}
        {result.spacing.baseUnit && (
          <div className="preview-section">
            <h4>Spacing System</h4>
            <p className="spacing-info">Base unit: {result.spacing.baseUnit}px</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
