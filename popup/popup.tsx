import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/popup.css';
import { MessageType } from '@shared/types/messages.types';
import type { AnalysisResult } from '@shared/types/design-system.types';
import ProgressIndicator from './components/ProgressIndicator';
import AnalysisResults from './components/AnalysisResults';
import CopyButtons from './components/CopyButtons';

type AppState = 'idle' | 'analyzing' | 'complete' | 'error';

interface AnalysisData {
  result: AnalysisResult;
  prompt: any;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Listen for messages from background/content script
    const messageListener = (message: any) => {
      switch (message.type) {
        case MessageType.ANALYSIS_PROGRESS:
          setProgress(message.progress);
          setStage(message.stage);
          break;

        case MessageType.ANALYSIS_COMPLETE:
          setState('complete');
          setProgress(100);
          setAnalysisData(message.result);
          break;

        case MessageType.ANALYSIS_ERROR:
          setState('error');
          setError(message.error);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleAnalyze = async () => {
    setState('analyzing');
    setProgress(0);
    setStage('Starting analysis...');
    setError('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.START_ANALYSIS
      });

      if (!response?.success) {
        setState('error');
        setError(response?.error || 'Analysis failed');
      }
    } catch (err) {
      setState('error');
      setError(String(err));
    }
  };

  const handleReset = () => {
    setState('idle');
    setProgress(0);
    setStage('');
    setAnalysisData(null);
    setError('');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🪞 DesignMirror</h1>
        <p className="subtitle">Extract design systems from any website</p>
      </div>

      <div className="content">
        {state === 'idle' && (
          <>
            <div className="info-card">
              <h3>How it works</h3>
              <ol>
                <li>Click "Analyze This Page" below</li>
                <li>Wait for analysis to complete (~5-15 seconds)</li>
                <li>Copy the generated prompt and use it with AI</li>
              </ol>
            </div>

            <button className="btn-analyze" onClick={handleAnalyze}>
              Analyze This Page
            </button>
          </>
        )}

        {state === 'analyzing' && (
          <ProgressIndicator progress={progress} stage={stage} />
        )}

        {state === 'complete' && analysisData && (
          <>
            <AnalysisResults data={analysisData} />
            <CopyButtons data={analysisData} />
            <button className="btn-secondary" onClick={handleReset}>
              Analyze Another Page
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="error-card">
              <h3>❌ Error</h3>
              <p>{error}</p>
            </div>
            <button className="btn-secondary" onClick={handleReset}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
