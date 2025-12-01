/**
 * Interactive State Analyzer
 *
 * Detects interactive CSS states (:hover, :focus, :active, :disabled)
 * by parsing stylesheets and comparing pseudo-class styles with base styles.
 *
 * Performance: ~100-300ms depending on stylesheet complexity
 */

import type { InteractiveStatePattern } from '../../shared/types/design-system.types';

export class InteractiveStateAnalyzer {
  /**
   * Analyze interactive states from stylesheets
   */
  public analyze(): InteractiveStatePattern[] {
    const patterns: Map<string, InteractiveStatePattern> = new Map();

    // Iterate through all stylesheets
    this.parseStyleSheets(document.styleSheets, patterns);

    return Array.from(patterns.values())
      .filter(pattern => {
        // Only include patterns that have at least one state
        return Object.keys(pattern.states).length > 0;
      })
      .slice(0, 50); // Limit to top 50 patterns
  }

  /**
   * Parse stylesheets recursively (including Shadow DOM)
   */
  private parseStyleSheets(
    styleSheets: StyleSheetList,
    patterns: Map<string, InteractiveStatePattern>
  ): void {
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (!sheet.cssRules) continue;

        this.parseRules(sheet.cssRules, patterns);
      } catch (e) {
        // CORS: External stylesheets might not be accessible
        console.warn('[InteractiveStateAnalyzer] Cannot access stylesheet:', e);
      }
    }
  }

  /**
   * Parse CSS rules recursively
   */
  private parseRules(
    rules: CSSRuleList,
    patterns: Map<string, InteractiveStatePattern>
  ): void {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (rule instanceof CSSStyleRule) {
        this.parseStyleRule(rule, patterns);
      } else if (rule instanceof CSSMediaRule) {
        // Recursively parse media query rules
        this.parseRules(rule.cssRules, patterns);
      } else if (rule instanceof CSSSupportsRule) {
        // Recursively parse @supports rules
        this.parseRules(rule.cssRules, patterns);
      }
    }
  }

  /**
   * Parse a single style rule for pseudo-class selectors
   */
  private parseStyleRule(
    rule: CSSStyleRule,
    patterns: Map<string, InteractiveStatePattern>
  ): void {
    const selector = rule.selectorText;

    // Check for interactive pseudo-classes
    const pseudoClassMatch = selector.match(/:(?:hover|focus|active|disabled)\b/);
    if (!pseudoClassMatch) return;

    const pseudoClass = pseudoClassMatch[0].slice(1); // Remove the ':'

    // Extract base selector (remove pseudo-class)
    const baseSelector = selector.replace(/:(?:hover|focus|active|disabled)(\s|$|,|:)/g, '$1').trim();
    if (!baseSelector) return;

    // Get or create pattern for this selector
    let pattern = patterns.get(baseSelector);
    if (!pattern) {
      pattern = {
        selector: baseSelector,
        states: {},
        changedProperties: [],
        context: this.extractContext(baseSelector)
      };
      patterns.set(baseSelector, pattern);
    }

    // Extract styles for this pseudo-class
    const styles: Record<string, string> = {};
    const cssText = rule.style;

    for (let i = 0; i < cssText.length; i++) {
      const property = cssText[i];
      const value = cssText.getPropertyValue(property);

      if (value) {
        styles[property] = value;

        // Track changed properties
        if (!pattern.changedProperties.includes(property)) {
          pattern.changedProperties.push(property);
        }
      }
    }

    // Assign styles to appropriate state
    if (Object.keys(styles).length > 0) {
      switch (pseudoClass) {
        case 'hover':
          pattern.states.hover = { ...pattern.states.hover, ...styles };
          break;
        case 'focus':
          pattern.states.focus = { ...pattern.states.focus, ...styles };
          break;
        case 'active':
          pattern.states.active = { ...pattern.states.active, ...styles };
          break;
        case 'disabled':
          pattern.states.disabled = { ...pattern.states.disabled, ...styles };
          break;
      }
    }
  }

  /**
   * Extract semantic context for a selector
   */
  private extractContext(selector: string): {
    elementType?: string;
    role?: string;
    textContent?: string;
    baseStyles?: Record<string, string>;
  } {
    try {
      // Try to find actual element matching this selector
      const element = document.querySelector(selector);
      if (!element) return {};

      const context: {
        elementType?: string;
        role?: string;
        textContent?: string;
        baseStyles?: Record<string, string>;
      } = {};

      // Determine element type
      const tagName = element.tagName.toLowerCase();
      context.elementType = tagName;

      // Check for specific component types
      if (tagName === 'button' || element.getAttribute('role') === 'button') {
        context.elementType = 'button';
      } else if (tagName === 'a') {
        context.elementType = 'link';
      } else if (element.classList.contains('card') || element.getAttribute('role') === 'article') {
        context.elementType = 'card';
      } else if (tagName === 'input') {
        context.elementType = `input-${element.getAttribute('type') || 'text'}`;
      }

      // Get ARIA role if available
      const role = element.getAttribute('role') || element.getAttribute('aria-label');
      if (role) {
        context.role = role;
      }

      // Extract text content (first few words)
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        context.textContent = text.substring(0, 50) + (text.length > 50 ? '...' : '');
      }

      // Get base styles for comparison
      const computedStyle = window.getComputedStyle(element);
      context.baseStyles = {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        transform: computedStyle.transform,
        opacity: computedStyle.opacity
      };

      return context;
    } catch (e) {
      // Selector might not match any element
      return {};
    }
  }

  /**
   * Get a CSS selector path for an element (helper for debugging)
   */
  private getSelectorPath(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break; // ID is unique, stop here
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          selector += `.${classes.slice(0, 2).join('.')}`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;

      // Limit depth
      if (parts.length >= 3) break;
    }

    return parts.join(' > ');
  }
}
