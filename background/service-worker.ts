
import { MessageType } from '@shared/types/messages.types';

console.log('[DesignMirror] Service worker initialized');

const handleStartAnalysis = async (sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('[Background] Starting analysis');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
      sendResponse({ success: false, error: 'Cannot analyze browser internal pages' });
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { type: MessageType.START_ANALYSIS },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log('[Background] Content script not loaded, injecting...');

          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['content/content-script.js']
          }).then(() => {
            console.log('[Background] Content script injected, sending message...');

            setTimeout(() => {
              chrome.tabs.sendMessage(
                tab.id!,
                { type: MessageType.START_ANALYSIS },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error('[Background] Error after injection:', chrome.runtime.lastError);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                  } else {
                    console.log('[Background] Analysis started successfully after injection');
                    sendResponse({ success: true });
                  }
                }
              );
            }, 100);
          }).catch((error) => {
            console.error('[Background] Error injecting content script:', error);
            sendResponse({ success: false, error: String(error) });
          });
          return;
        }

        console.log('[Background] Analysis started successfully');
        sendResponse(response || { success: true });
      }
    );
  } catch (error) {
    console.error('[Background] Error starting analysis:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

const handleAnalysisComplete = (result: any) => {
  console.log('[Background] Analysis complete, result:', result);

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  switch (message.type) {
    case MessageType.START_ANALYSIS:
      handleStartAnalysis(sender, sendResponse);
      break;

    case MessageType.ANALYSIS_PROGRESS:
      console.log(`[Background] Analysis progress: ${message.progress}% - ${message.stage}`);
      chrome.runtime.sendMessage(message); // Forward to popup
      break;

    case MessageType.ANALYSIS_COMPLETE:
      handleAnalysisComplete(message.result);
      chrome.runtime.sendMessage(message); // Forward to popup
      break;

    case MessageType.ANALYSIS_ERROR:
      console.error('[Background] Analysis error:', message.error);
      chrome.runtime.sendMessage(message); // Forward to popup
      break;

    case MessageType.COPY_TO_CLIPBOARD:
      handleCopyToClipboard(message.text, sendResponse);
      break;

    default:
      console.warn('[Background] Unknown message type:', message.type);
  }

  return true; // Keep channel open for async response
});

chrome.action.onClicked.addListener((tab) => {
  console.log('[Background] Extension icon clicked');
});

export {};
