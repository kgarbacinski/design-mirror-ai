
import { Message, MessageResponse } from '../types/messages.types';

/**
 * Send a message to the background script
 */
export function sendToBackground(message: Message): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Send a message to a specific tab's content script
 */
export function sendToTab(tabId: number, message: Message): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Send a message to the active tab's content script
 */
export async function sendToActiveTab(message: Message): Promise<MessageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) {
    throw new Error('No active tab found');
  }

  return sendToTab(tab.id, message);
}

/**
 * Broadcast a message to all tabs
 */
export async function broadcastToAllTabs(message: Message): Promise<MessageResponse[]> {
  const tabs = await chrome.tabs.query({});

  const promises = tabs
    .filter(tab => tab.id !== undefined)
    .map(tab => sendToTab(tab.id!, message).catch(err => {
      console.warn(`Failed to send to tab ${tab.id}:`, err);
      return { success: false, error: err.message } as MessageResponse;
    }));

  return Promise.all(promises);
}

/**
 * Wait for a specific message type
 */
export function waitForMessage<T extends Message>(
  type: T['type'],
  timeout: number = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      reject(new Error(`Timeout waiting for message: ${type}`));
    }, timeout);

    const listener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.type === type) {
        clearTimeout(timeoutId);
        chrome.runtime.onMessage.removeListener(listener);
        resolve(message as T);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
  });
}

/**
 * Create a message listener with type-safe handler
 */
export function createMessageListener<T extends Message>(
  type: T['type'],
  handler: (message: T, sender: chrome.runtime.MessageSender) => Promise<MessageResponse> | MessageResponse
) {
  return (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === type) {
      const result = handler(message as T, sender);

      if (result instanceof Promise) {
        result.then(sendResponse).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true; // Keep channel open for async
      } else {
        sendResponse(result);
      }
    }
  };
}

export default {
  sendToBackground,
  sendToTab,
  sendToActiveTab,
  broadcastToAllTabs,
  waitForMessage,
  createMessageListener
};
