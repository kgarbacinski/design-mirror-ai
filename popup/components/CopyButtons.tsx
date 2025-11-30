import React, { useState } from 'react';
import type { AnalysisResult } from '@shared/types/design-system.types';

interface CopyButtonsProps {
  data: AnalysisResult & {
    prompt: any;
  };
}

const CopyButtons: React.FC<CopyButtonsProps> = ({ data }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(data.prompt.combined);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleCopyJSON = async () => {
    try {
      // Don't include prompt in JSON export
      const { prompt, ...result } = data;
      const json = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(json);
      setCopiedJSON(true);
      setTimeout(() => setCopiedJSON(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleDownloadJSON = () => {
    // Don't include prompt in JSON export
    const { prompt, ...result } = data;
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-system-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="copy-buttons-container">
      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleCopyPrompt}
          disabled={copiedPrompt}
        >
          {copiedPrompt ? '✓ Copied!' : '📋 Copy AI Prompt'}
        </button>

        <button
          className="btn-secondary"
          onClick={handleCopyJSON}
          disabled={copiedJSON}
        >
          {copiedJSON ? '✓ Copied!' : '{ } Copy JSON'}
        </button>

        <button
          className="btn-secondary"
          onClick={handleDownloadJSON}
        >
          ⬇ Download JSON
        </button>
      </div>

      <div className="hint-text">
        Copy the AI prompt to use with Claude, ChatGPT, or other AI tools
      </div>
    </div>
  );
};

export default CopyButtons;
