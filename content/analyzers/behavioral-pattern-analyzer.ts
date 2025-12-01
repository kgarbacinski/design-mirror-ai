/**
 * Behavioral Pattern Analyzer
 *
 * Detects interactive patterns based on element behavior and semantics,
 * not just current DOM state. Works even when patterns are not active.
 *
 * Detects:
 * - Mode switchers (theme, view mode, etc.)
 * - Toggle buttons (show/hide, expand/collapse)
 * - Tab groups (mutually exclusive selections)
 * - Filter buttons (category filters)
 */

import type {
  BehavioralPattern,
  ModeSwitcherPattern,
  ToggleButtonPattern,
  TabGroupPattern
} from '../../shared/types/design-system.types';

export class BehavioralPatternAnalyzer {
  /**
   * Analyze behavioral patterns on the page
   */
  public analyze(): BehavioralPattern {
    console.log('[BehavioralPatternAnalyzer] Starting behavioral analysis...');

    const modeSwitchers = this.detectModeSwitchers();
    const toggleButtons = this.detectToggleButtons();
    const tabGroups = this.detectTabGroups();

    console.log('[BehavioralPatternAnalyzer] Results:', {
      modeSwitchers: modeSwitchers.length,
      toggleButtons: toggleButtons.length,
      tabGroups: tabGroups.length
    });

    return {
      modeSwitchers,
      toggleButtons,
      tabGroups
    };
  }

  /**
   * Detect mode switchers (theme, developer/founder mode, etc.)
   * Uses multiple strategies to detect even when not in active state
   */
  private detectModeSwitchers(): ModeSwitcherPattern[] {
    console.log('[BehavioralPatternAnalyzer] Detecting mode switchers...');

    const patterns: ModeSwitcherPattern[] = [];

    // Strategy 1: Find buttons with mode-related semantics
    const buttons = this.findModeSwitchButtons();

    for (const button of buttons) {
      const pattern = this.analyzeModeSwitchButton(button);
      if (pattern) {
        patterns.push(pattern);
      }
    }

    // Strategy 2: CSS inference - scan stylesheets for mode classes
    const cssInferred = this.inferModesFromCSS();
    if (cssInferred) {
      patterns.push(cssInferred);
    }

    return patterns;
  }

  /**
   * Find buttons that likely control mode switching
   */
  private findModeSwitchButtons(): Element[] {
    const allButtons = Array.from(
      document.querySelectorAll('button, [role="button"], [role="switch"], a[role="button"]')
    );

    const modeKeywords = [
      'theme', 'dark', 'light', 'mode', 'developer', 'founder',
      'dev', 'ceo', 'admin', 'user', 'view', 'appearance'
    ];

    return allButtons.filter(button => {
      const text = button.textContent?.toLowerCase().trim() || '';
      const classes = button.className.toLowerCase();
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

      // Check if button has mode-related keywords
      const hasKeyword = modeKeywords.some(keyword =>
        text.includes(keyword) ||
        classes.includes(keyword) ||
        ariaLabel.includes(keyword)
      );

      // Also check if in navigation context (higher confidence)
      const isInNav = button.closest('nav, header, [role="navigation"]') !== null;

      return hasKeyword && (isInNav || text.length < 20); // Short text = likely toggle
    });
  }

  /**
   * Analyze a button to determine if it's a mode switcher
   */
  private analyzeModeSwitchButton(button: Element): ModeSwitcherPattern | null {
    const text = button.textContent?.trim() || '';
    const classes = button.className;
    const context = this.getElementContext(button);

    // Extract semantic meaning from classes
    const semanticClues = this.extractSemanticClues(classes);

    // Determine what modes are suggested
    const inferredModes = this.inferModesFromButton(button, semanticClues);

    if (inferredModes.length < 2) return null; // Need at least 2 modes

    // Check current state
    const currentMode = this.detectCurrentMode(inferredModes);

    const evidence: string[] = [];

    if (text) {
      evidence.push(`Button text: "${text}"`);
    }

    if (semanticClues.length > 0) {
      evidence.push(`CSS classes suggest modes: ${semanticClues.join(', ')}`);
    }

    // Check if mode classes exist in stylesheets
    const cssEvidence = this.checkStylesheetsForModes(inferredModes);
    if (cssEvidence) {
      evidence.push(cssEvidence);
    }

    return {
      type: 'mode-switcher',
      toggleElement: this.getElementDescription(button),
      location: context,
      inferredModes,
      currentMode: currentMode || 'default',
      evidence,
      confidence: this.calculateConfidence(evidence, context)
    };
  }

  /**
   * Extract semantic clues from class names
   * Example: "text-developer-accent" → "developer"
   */
  private extractSemanticClues(classes: string): string[] {
    const clues: string[] = [];
    const classList = classes.split(/\s+/);

    const semanticPatterns = [
      /developer/i,
      /founder/i,
      /dark/i,
      /light/i,
      /theme-(\w+)/i,
      /mode-(\w+)/i
    ];

    for (const cls of classList) {
      for (const pattern of semanticPatterns) {
        if (pattern.test(cls)) {
          const match = cls.match(pattern);
          if (match) {
            const mode = match[1] || match[0];
            if (!clues.includes(mode.toLowerCase())) {
              clues.push(mode.toLowerCase());
            }
          }
        }
      }
    }

    return clues;
  }

  /**
   * Infer what modes a button controls based on its properties
   */
  private inferModesFromButton(button: Element, semanticClues: string[]): string[] {
    const modes = new Set<string>(semanticClues);

    const text = button.textContent?.toLowerCase().trim() || '';

    // Direct text matches
    const modeMap: Record<string, string[]> = {
      'dev': ['developer', 'founder'],
      'ceo': ['founder', 'developer'],
      'developer': ['developer', 'founder'],
      'founder': ['founder', 'developer'],
      'dark': ['dark', 'light'],
      'light': ['light', 'dark'],
      'theme': ['dark', 'light']
    };

    for (const [key, inferredModes] of Object.entries(modeMap)) {
      if (text.includes(key)) {
        inferredModes.forEach(mode => modes.add(mode));
      }
    }

    return Array.from(modes);
  }

  /**
   * Detect current active mode from DOM
   */
  private detectCurrentMode(possibleModes: string[]): string | null {
    const html = document.documentElement;
    const body = document.body;

    // Check data-* attributes
    const dataTheme = html.getAttribute('data-theme') || body?.getAttribute('data-theme');
    const dataMode = html.getAttribute('data-mode') || body?.getAttribute('data-mode');

    if (dataTheme || dataMode) {
      return dataTheme || dataMode;
    }

    // Check classes
    const allClasses = [
      ...Array.from(html.classList),
      ...(body ? Array.from(body.classList) : [])
    ];

    for (const mode of possibleModes) {
      const modePattern = new RegExp(`(^|-)${mode}(-|$)`, 'i');
      const foundClass = allClasses.find(cls => modePattern.test(cls));
      if (foundClass) {
        return mode;
      }
    }

    return null;
  }

  /**
   * Check if mode-related classes exist in stylesheets
   */
  private checkStylesheetsForModes(modes: string[]): string | null {
    const foundModes: string[] = [];

    try {
      const styleSheets = document.styleSheets;

      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (!sheet.cssRules) continue;

          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];

            if (rule instanceof CSSStyleRule) {
              const selector = rule.selectorText;

              for (const mode of modes) {
                const modePattern = new RegExp(`\\.(${mode}-mode|mode-${mode}|${mode})\\b`, 'i');
                if (modePattern.test(selector) && !foundModes.includes(mode)) {
                  foundModes.push(mode);
                }
              }
            }
          }
        } catch (e) {
          // CORS - skip external stylesheets
        }
      }
    } catch (e) {
      console.warn('[BehavioralPatternAnalyzer] Error scanning stylesheets:', e);
    }

    if (foundModes.length > 0) {
      return `Found .${foundModes.join('-mode, .')}-mode classes in stylesheets`;
    }

    return null;
  }

  /**
   * Infer modes from CSS alone (when no button found)
   */
  private inferModesFromCSS(): ModeSwitcherPattern | null {
    console.log('[BehavioralPatternAnalyzer] Inferring modes from CSS...');

    const modeClasses: string[] = [];

    try {
      const styleSheets = document.styleSheets;

      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (!sheet.cssRules) continue;

          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];

            if (rule instanceof CSSStyleRule) {
              const selector = rule.selectorText;

              // Look for mode-related class selectors
              const modeMatch = selector.match(/\.(dark|light|founder-mode|developer-mode|mode-\w+)/i);
              if (modeMatch && !modeClasses.includes(modeMatch[1])) {
                modeClasses.push(modeMatch[1]);
              }
            }
          }
        } catch (e) {
          // CORS
        }
      }
    } catch (e) {
      console.warn('[BehavioralPatternAnalyzer] Error inferring from CSS:', e);
    }

    if (modeClasses.length === 0) return null;

    // Extract mode names
    const modes = modeClasses.map(cls => cls.replace(/-mode$/, '').replace(/^mode-/, ''));

    return {
      type: 'mode-switcher',
      toggleElement: 'Not found (inferred from CSS)',
      location: 'Unknown',
      inferredModes: modes,
      currentMode: this.detectCurrentMode(modes) || 'default',
      evidence: [
        `Found mode classes in CSS: ${modeClasses.join(', ')}`,
        'No toggle button found (may be loaded dynamically)'
      ],
      confidence: 'medium'
    };
  }

  /**
   * Detect general toggle buttons (show/hide, expand/collapse)
   */
  private detectToggleButtons(): ToggleButtonPattern[] {
    console.log('[BehavioralPatternAnalyzer] Detecting toggle buttons...');

    const patterns: ToggleButtonPattern[] = [];
    const allButtons = Array.from(
      document.querySelectorAll('button, [role="button"], [role="switch"]')
    );

    const toggleKeywords = [
      'toggle', 'show', 'hide', 'expand', 'collapse', 'menu',
      'open', 'close', 'more', 'less'
    ];

    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const ariaExpanded = button.getAttribute('aria-expanded');

      const hasToggleKeyword = toggleKeywords.some(
        keyword => text.includes(keyword) || ariaLabel.includes(keyword)
      );

      if (hasToggleKeyword || ariaExpanded !== null) {
        patterns.push({
          type: 'toggle-button',
          element: this.getElementDescription(button),
          text: button.textContent?.trim().substring(0, 50) || 'No text',
          ariaExpanded: ariaExpanded === 'true',
          location: this.getElementContext(button)
        });
      }
    }

    return patterns.slice(0, 10); // Limit to top 10
  }

  /**
   * Detect tab groups (mutually exclusive button sets)
   */
  private detectTabGroups(): TabGroupPattern[] {
    console.log('[BehavioralPatternAnalyzer] Detecting tab groups...');

    const patterns: TabGroupPattern[] = [];

    // Find elements with role="tablist"
    const tabLists = Array.from(document.querySelectorAll('[role="tablist"]'));

    for (const tabList of tabLists) {
      const tabs = Array.from(tabList.querySelectorAll('[role="tab"], button'));

      if (tabs.length >= 2) {
        const tabTexts = tabs.map(tab => tab.textContent?.trim() || '');
        const activeTab = tabs.find(
          tab =>
            tab.getAttribute('aria-selected') === 'true' ||
            tab.classList.contains('active') ||
            tab.classList.contains('selected')
        );

        patterns.push({
          type: 'tab-group',
          tabs: tabTexts,
          activeTab: activeTab?.textContent?.trim() || tabTexts[0] || 'Unknown',
          location: this.getElementContext(tabList)
        });
      }
    }

    // Also find button groups that look like tabs (even without role="tablist")
    const buttonGroups = this.findButtonGroups();

    for (const group of buttonGroups) {
      if (group.length >= 2 && group.length <= 10) {
        const texts = group.map(btn => btn.textContent?.trim() || '');

        // Check if they look like tabs (short text, similar styling)
        const avgLength = texts.reduce((sum, t) => sum + t.length, 0) / texts.length;

        if (avgLength < 20) {
          // Short text = likely tabs
          const activeBtn = group.find(
            btn =>
              btn.classList.contains('active') ||
              btn.classList.contains('selected') ||
              btn.getAttribute('aria-selected') === 'true'
          );

          patterns.push({
            type: 'tab-group',
            tabs: texts,
            activeTab: activeBtn?.textContent?.trim() || texts[0] || 'Unknown',
            location: this.getElementContext(group[0])
          });
        }
      }
    }

    return patterns.slice(0, 5); // Limit to top 5
  }

  /**
   * Find groups of buttons that are siblings or in same container
   */
  private findButtonGroups(): Element[][] {
    const groups: Element[][] = [];

    // Find all containers with multiple buttons
    const containers = Array.from(
      document.querySelectorAll('div, section, nav, aside, [role="group"]')
    );

    for (const container of containers) {
      const buttons = Array.from(
        container.querySelectorAll(':scope > button, :scope > [role="button"]')
      );

      if (buttons.length >= 2 && buttons.length <= 10) {
        groups.push(buttons);
      }
    }

    return groups;
  }

  /**
   * Get element context (where it's located)
   */
  private getElementContext(element: Element): string {
    const nav = element.closest('nav, header, [role="navigation"], [role="banner"]');
    if (nav) return 'Navigation';

    const main = element.closest('main, [role="main"]');
    if (main) return 'Main content';

    const aside = element.closest('aside, [role="complementary"]');
    if (aside) return 'Sidebar';

    const footer = element.closest('footer, [role="contentinfo"]');
    if (footer) return 'Footer';

    // Try to get parent section with meaningful class or id
    const section = element.closest('section, article, div[class*="section"]');
    if (section) {
      const sectionClass = section.className.split(/\s+/).find(cls => cls.length > 3);
      if (sectionClass) {
        return `Section: ${sectionClass}`;
      }
    }

    return 'Unknown location';
  }

  /**
   * Get human-readable element description
   */
  private getElementDescription(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classList = element.className
      .split(/\s+/)
      .filter(cls => cls.length > 0 && cls.length < 30)
      .slice(0, 2);
    const classes = classList.length > 0 ? `.${classList.join('.')}` : '';

    let desc = `${tag}${id}${classes}`;

    const text = element.textContent?.trim();
    if (text && text.length < 30) {
      desc += ` - "${text}"`;
    }

    return desc;
  }

  /**
   * Calculate confidence level based on evidence
   */
  private calculateConfidence(evidence: string[], context: string): 'high' | 'medium' | 'low' {
    let score = 0;

    // More evidence = higher confidence
    score += evidence.length * 20;

    // Navigation context = higher confidence
    if (context === 'Navigation') {
      score += 30;
    }

    // CSS evidence = good signal
    if (evidence.some(e => e.includes('stylesheet'))) {
      score += 20;
    }

    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
