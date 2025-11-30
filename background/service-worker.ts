// Background Service Worker for DesignMirror
// Handles coordination between popup and content script

import { MessageType } from '@shared/types/messages.types';

console.log('[DesignMirror] Service worker initialized');

// Handler functions
const handleStartAnalysis = async (sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('[Background] Starting analysis');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    // Send message to content script on active tab
    chrome.tabs.sendMessage(
      tab.id,
      { type: MessageType.START_ANALYSIS },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error communicating with content script:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        console.log('[Background] Analysis started successfully');
        sendResponse({ success: true });
      }
    );
  } catch (error) {
    console.error('[Background] Error starting analysis:', error);
    sendResponse({ error: String(error) });
  }
}

const handleAnalysisComplete = (result: any) => {
  console.log('[Background] Analysis complete, result:', result);

  // Could save to storage, send to popup, etc.
  chrome.storage.local.set({
    lastAnalysis: {
      timestamp: Date.now(),
      result: result
    }
  });
}

const handleCopyToClipboard = async (text: string, sendResponse: (response?: any) => void) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[Background] Copied to clipboard');
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error copying to clipboard:', error);
    sendResponse({ error: String(error) });
  }
}

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  switch (message.type) {
    case MessageType.START_ANALYSIS:
      handleStartAnalysis(sender, sendResponse);
      break;

    case MessageType.ANALYSIS_PROGRESS:
      // Forward progress to popup
      console.log(`[Background] Analysis progress: ${message.progress}% - ${message.stage}`);
      break;

    case MessageType.ANALYSIS_COMPLETE:
      handleAnalysisComplete(message.result);
      break;

    case MessageType.ANALYSIS_ERROR:
      console.error('[Background] Analysis error:', message.error);
      break;

    case MessageType.COPY_TO_CLIPBOARD:
      handleCopyToClipboard(message.text, sendResponse);
      break;

    default:
      console.warn('[Background] Unknown message type:', message.type);
  }

  return true; // Keep channel open for async response
});

// Handle extension icon click (optional)
chrome.action.onClicked.addListener((tab) => {
  console.log('[Background] Extension icon clicked');
});

// Export to make this a module (avoids global scope conflicts)
export {};
