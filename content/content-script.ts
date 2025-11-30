// Content Script for DesignMirror
// Runs on web pages and performs design system analysis

import { DOMWalker } from './utils/dom-walker';
import { StyleCache } from './utils/style-cache';
import { MessageType } from '@shared/types/messages.types';
import type { AnalysisResult } from '@shared/types/design-system.types';
import { ColorAnalyzer } from './analyzers/color-analyzer';
import { TypographyAnalyzer } from './analyzers/typography-analyzer';
import { SpacingAnalyzer } from './analyzers/spacing-analyzer';
import { ShadowAnalyzer } from './analyzers/shadow-analyzer';
import { BorderAnalyzer } from './analyzers/border-analyzer';
import { ComponentDetector } from './analyzers/component-detector';
import { CombinedGenerator } from './generators/combined-generator';

console.log('[DesignMirror Content Script] Loaded on:', window.location.href);

// State
let isAnalyzing = false;

// Handler function
const handleStartAnalysis = async (sendResponse: (response?: any) => void) => {
  if (isAnalyzing) {
    sendResponse({ success: false, error: 'Analysis already in progress' });
    return;
  }

  console.log('[Content Script] Starting page analysis...');
  isAnalyzing = true;

  try {
    // Initialize infrastructure
    const domWalker = new DOMWalker({
      includeInvisible: false,
      includeShadowDOM: true
    });

    const styleCache = new StyleCache();

    // Progress tracking
    const sendProgress = (progress: number, stage: string) => {
      chrome.runtime.sendMessage({
        type: MessageType.ANALYSIS_PROGRESS,
        progress,
        stage
      });
    };

    sendProgress(10, 'Initializing DOM Walker...');

    // Count visible elements
    const elementCount = await domWalker.count(document.body);
    console.log('[Content Script] Found', elementCount, 'visible elements');

    sendProgress(20, `Analyzing ${elementCount} elements...`);

    // Collect all elements
    const allElements: Element[] = [];
    await domWalker.walk(
      document.body,
      (element) => {
        allElements.push(element);
      },
      (current, total) => {
        const progress = 20 + Math.floor((current / total) * 40);
        sendProgress(progress, `Collected ${current}/${total} elements...`);
      }
    );

    sendProgress(60, 'Running analyzers...');

    // Initialize analyzers
    const colorAnalyzer = new ColorAnalyzer();
    const typographyAnalyzer = new TypographyAnalyzer();
    const spacingAnalyzer = new SpacingAnalyzer();
    const shadowAnalyzer = new ShadowAnalyzer();
    const borderAnalyzer = new BorderAnalyzer();
    const componentDetector = new ComponentDetector();

    // Run analyzers
    sendProgress(65, 'Analyzing colors...');
    const colors = colorAnalyzer.analyze(allElements, styleCache);

    sendProgress(70, 'Analyzing typography...');
    const typography = typographyAnalyzer.analyze(allElements, styleCache);

    sendProgress(75, 'Analyzing spacing...');
    const spacing = spacingAnalyzer.analyze(allElements, styleCache);

    sendProgress(80, 'Analyzing shadows...');
    const shadows = shadowAnalyzer.analyze(allElements, styleCache);

    sendProgress(85, 'Analyzing borders...');
    const borders = borderAnalyzer.analyze(allElements, styleCache);

    sendProgress(90, 'Detecting components...');
    const components = componentDetector.detect(styleCache);

    sendProgress(95, 'Generating prompt...');

    // Build result
    const result: AnalysisResult = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      elementCount,
      colors,
      typography,
      spacing,
      shadows,
      borders,
      components
    };

    // Generate prompt
    const generator = new CombinedGenerator();
    const prompt = generator.generate(result);

    sendProgress(98, 'Finalizing...');

    // Get cache stats
    const cacheStats = styleCache.getStats();
    console.log('[Content Script] Style cache stats:', cacheStats);

    // Add debug info
    console.log('[Content Script] Analysis complete:', {
      elementCount,
      colorClusters: colors.all.length,
      primaryColor: colors.primary?.centroid.hex,
      fontFamily: typography.primaryFont?.name,
      spacingBaseUnit: spacing.baseUnit,
      componentCount: components.length,
      cacheHitRate: cacheStats.hitRate,
      promptLength: prompt.combined.length
    });

    // Log first 500 chars of prompt for debugging
    console.log('[Content Script] Generated prompt preview:', prompt.combined.substring(0, 500));

    sendProgress(100, 'Analysis complete!');

    // Send result back to background (with prompt)
    chrome.runtime.sendMessage({
      type: MessageType.ANALYSIS_COMPLETE,
      result: { ...result, prompt } // Include prompt in result
    });

    sendResponse({ success: true, result: { ...result, prompt } });

  } catch (error) {
    console.error('[Content Script] Error during analysis:', error);

    chrome.runtime.sendMessage({
      type: MessageType.ANALYSIS_ERROR,
      error: String(error)
    });

    sendResponse({ success: false, error: String(error) });
  } finally {
    isAnalyzing = false;
  }
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Received message:', message.type);

  switch (message.type) {
    case MessageType.START_ANALYSIS:
      handleStartAnalysis(sendResponse);
      break;

    default:
      console.warn('[Content Script] Unknown message type:', message.type);
  }

  return true; // Keep channel open for async response
});

console.log('[DesignMirror Content Script] Ready');

// Export to make this a module (avoids global scope conflicts)
export {};
