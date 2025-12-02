/**
 * Theme Switcher Analyzer
 *
 * Detects theme switching mechanisms on websites.
 * Looks for common patterns like data-theme attributes, dark mode classes,
 * and CSS variable swapping.
 *
 * Performance: ~50-100ms
 */

import type {
  ThemeSwitcherPattern,
  ThemeSwitcherMechanism
} from '../../shared/types/design-system.types';

export class ThemeSwitcherAnalyzer {
  /**
   * Analyze theme switching patterns
   */
  public async analyze(): Promise<ThemeSwitcherPattern[]> {
    const patterns: ThemeSwitcherPattern[] = [];

    console.log('[ThemeSwitcherAnalyzer] Starting theme detection...');
    console.log('[ThemeSwitcherAnalyzer] ========================================');

    this.logDOMSnapshot();

    const dataThemePattern = this.detectDataTheme();
    if (dataThemePattern) {
      console.log('[ThemeSwitcherAnalyzer] Found data-theme pattern:', dataThemePattern);
      patterns.push(dataThemePattern);
    }

    const classThemePattern = this.detectClassBasedTheme();
    if (classThemePattern) {
      console.log('[ThemeSwitcherAnalyzer] Found class-based pattern:', classThemePattern);
      patterns.push(classThemePattern);
    }

    const cssVarPattern = this.detectCSSVariableTheme();
    if (cssVarPattern) {
      console.log('[ThemeSwitcherAnalyzer] Found CSS variable pattern:', cssVarPattern);
      patterns.push(cssVarPattern);
    }

    const mediaQueryPattern = this.detectMediaQueryTheme();
    if (mediaQueryPattern) {
      console.log('[ThemeSwitcherAnalyzer] Found media query pattern:', mediaQueryPattern);
      patterns.push(mediaQueryPattern);
    }

    console.log('[ThemeSwitcherAnalyzer] ========================================');
    console.log('[ThemeSwitcherAnalyzer] Total patterns found:', patterns.length);
    return patterns;
  }

  /**
   * Log complete DOM snapshot for debugging
   * This helps identify what actually changes when mode is switched
   */
  private logDOMSnapshot(): void {
    console.group('[ThemeSwitcherAnalyzer] 📸 DOM SNAPSHOT');

    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    console.group('🏷️  HTML data-* attributes:');
    const htmlDataAttrs: Record<string, string> = {};
    Array.from(htmlElement.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        htmlDataAttrs[attr.name] = attr.value;
      }
    });
    console.log(Object.keys(htmlDataAttrs).length > 0 ? htmlDataAttrs : 'None found');
    console.groupEnd();

    console.group('🎨 HTML classes:');
    const htmlClasses = Array.from(htmlElement.classList);
    console.log(htmlClasses.length > 0 ? htmlClasses : 'None found');
    console.groupEnd();

    console.group('🏷️  BODY data-* attributes:');
    const bodyDataAttrs: Record<string, string> = {};
    if (bodyElement) {
      Array.from(bodyElement.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          bodyDataAttrs[attr.name] = attr.value;
        }
      });
    }
    console.log(Object.keys(bodyDataAttrs).length > 0 ? bodyDataAttrs : 'None found');
    console.groupEnd();

    console.group('🎨 BODY classes:');
    const bodyClasses = bodyElement ? Array.from(bodyElement.classList) : [];
    console.log(bodyClasses.length > 0 ? bodyClasses : 'None found');
    console.groupEnd();

    console.group('💾 localStorage:');
    try {
      const storageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storageData[key] = localStorage.getItem(key) || '';
        }
      }
      console.log(Object.keys(storageData).length > 0 ? storageData : 'Empty');
    } catch (e) {
      console.log('Cannot access localStorage:', e);
    }
    console.groupEnd();

    console.group('🔘 Potential mode/theme buttons:');
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], [role="switch"], a[role="button"]'));
    let foundCount = 0;

    buttons.forEach((btn, index) => {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const classes = btn.className;
      const id = btn.id;

      const keywords = ['theme', 'dark', 'light', 'mode', 'switch', 'toggle', 'developer', 'founder'];
      const isRelevant = keywords.some(keyword =>
        text.includes(keyword) || ariaLabel.includes(keyword) || classes.toLowerCase().includes(keyword) || id.toLowerCase().includes(keyword)
      );

      if (isRelevant) {
        foundCount++;
        console.log(`Button #${index + 1}:`, {
          tagName: btn.tagName,
          text: btn.textContent?.substring(0, 50),
          className: classes,
          id: id,
          ariaLabel: btn.getAttribute('aria-label'),
          dataAttributes: Array.from(btn.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(', ')
        });
      }
    });

    if (foundCount === 0) {
      console.log('No potential theme/mode buttons found with keywords: theme, dark, light, mode, switch, toggle, developer, founder');
    }
    console.groupEnd();

    console.group('🎨 CSS Custom Properties (--*):');
    try {
      const rootStyles = getComputedStyle(htmlElement);
      const cssVars: Record<string, string> = {};

      Array.from(rootStyles).forEach(prop => {
        if (prop.startsWith('--')) {
          const value = rootStyles.getPropertyValue(prop).trim();
          if (/color|theme|bg|background|primary|secondary|accent|dark|light|mode/i.test(prop)) {
            cssVars[prop] = value.substring(0, 50);
          }
        }
      });

      const varKeys = Object.keys(cssVars);
      if (varKeys.length > 0) {
        console.log(`Found ${varKeys.length} theme-related CSS variables:`, cssVars);
      } else {
        console.log('No theme-related CSS variables found');
      }
    } catch (e) {
      console.log('Error reading CSS variables:', e);
    }
    console.groupEnd();

    console.log('');
    console.log('💡 TIP: Run analysis TWICE:');
    console.log('   1. Before clicking mode switcher');
    console.log('   2. After clicking mode switcher');
    console.log('   3. Compare the two snapshots above to see what changed!');
    console.log('');

    console.groupEnd();
  }

  /**
   * Detect data-theme attribute pattern
   */
  private detectDataTheme(): ThemeSwitcherPattern | null {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    const htmlTheme = htmlElement.getAttribute('data-theme') || htmlElement.getAttribute('data-mode');
    const bodyTheme = bodyElement?.getAttribute('data-theme') || bodyElement?.getAttribute('data-mode');

    const currentTheme = htmlTheme || bodyTheme;

    console.log('[ThemeSwitcherAnalyzer] Data attribute check:', {
      htmlTheme,
      bodyTheme,
      currentTheme
    });

    if (!currentTheme) return null;

    const toggleElement = this.findThemeToggle();

    const cssVariables = this.extractThemeVariables();

    const storageKey = this.detectStorageKey();

    const themes = this.detectAvailableThemes(currentTheme);

    return {
      mechanism: 'attribute-toggle',
      themes,
      toggleElement: toggleElement || 'Theme toggle button detected',
      cssVariables,
      storageKey,
      implementation: `document.documentElement.setAttribute('data-theme', '${currentTheme}')`
    };
  }

  /**
   * Detect class-based theme pattern (.dark, .light, etc.)
   */
  private detectClassBasedTheme(): ThemeSwitcherPattern | null {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    const htmlClasses = Array.from(htmlElement.classList);
    const bodyClasses = bodyElement ? Array.from(bodyElement.classList) : [];

    const themeClasses = [...htmlClasses, ...bodyClasses].filter(cls =>
      /^(dark|light|theme-|mode-|developer|founder)/.test(cls.toLowerCase())
    );

    console.log('[ThemeSwitcherAnalyzer] Class-based detection - found classes:', themeClasses);

    if (themeClasses.length === 0) return null;

    const currentTheme = themeClasses[0];
    const toggleElement = this.findThemeToggle();
    const cssVariables = this.extractThemeVariables();
    const storageKey = this.detectStorageKey();

    const themes: string[] = [currentTheme];
    if (currentTheme === 'dark') {
      themes.push('light');
    } else if (currentTheme === 'light') {
      themes.push('dark');
    } else if (currentTheme.includes('developer')) {
      themes.push('founder');
    } else if (currentTheme.includes('founder')) {
      themes.push('developer');
    }

    console.log('[ThemeSwitcherAnalyzer] Class-based theme detected:', {
      currentTheme,
      themes,
      toggleElement
    });

    return {
      mechanism: 'class-toggle',
      themes,
      toggleElement: toggleElement || 'Mode toggle detected',
      cssVariables,
      storageKey,
      implementation: `document.documentElement.classList.toggle('${currentTheme}')`
    };
  }

  /**
   * Detect CSS variable-based theming
   */
  private detectCSSVariableTheme(): ThemeSwitcherPattern | null {
    const cssVariables = this.extractThemeVariables();

    if (cssVariables.length === 0) return null;

    const hasMultipleValues = cssVariables.some(
      v => Object.keys(v.values).length > 1
    );

    if (!hasMultipleValues) return null;

    const toggleElement = this.findThemeToggle();
    const storageKey = this.detectStorageKey();

    const themeNames = new Set<string>();
    for (const v of cssVariables) {
      Object.keys(v.values).forEach(theme => themeNames.add(theme));
    }

    return {
      mechanism: 'css-var-swap',
      themes: Array.from(themeNames),
      toggleElement: toggleElement || 'Theme switcher detected',
      cssVariables,
      storageKey,
      implementation: `:root { ${cssVariables[0]?.name}: ${Object.values(cssVariables[0]?.values || {})[0]} }`
    };
  }

  /**
   * Find theme toggle button or control
   */
  private findThemeToggle(): string | null {
    console.log('[ThemeSwitcherAnalyzer] Looking for theme toggle button...');

    const selectors = [
      'button[aria-label*="theme" i]',
      'button[aria-label*="dark" i]',
      'button[aria-label*="light" i]',
      'button[aria-label*="mode" i]',
      'button[aria-label*="switch" i]',
      'button[title*="theme" i]',
      'button[title*="mode" i]',
      '[data-theme-toggle]',
      '[data-toggle-theme]',
      '[data-mode-toggle]',
      '[data-mode]',
      '.theme-toggle',
      '.mode-toggle',
      '.dark-mode-toggle',
      '#theme-toggle',
      '#mode-toggle'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[ThemeSwitcherAnalyzer] Found toggle via selector:', selector);
        return this.getElementDescription(element);
      }
    }

    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], [role="switch"]'));
    console.log('[ThemeSwitcherAnalyzer] Scanning', buttons.length, 'interactive elements...');

    for (const button of buttons) {
      const text = button.textContent?.toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const dataAttrs = Array.from(button.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => attr.name + '=' + attr.value)
        .join(' ');

      if (
        text.includes('theme') ||
        text.includes('dark') ||
        text.includes('light') ||
        text.includes('mode') ||
        text.includes('developer') ||
        text.includes('founder') ||
        text.includes('switch') ||
        ariaLabel.includes('theme') ||
        ariaLabel.includes('dark') ||
        ariaLabel.includes('light') ||
        ariaLabel.includes('mode') ||
        dataAttrs.includes('mode')
      ) {
        console.log('[ThemeSwitcherAnalyzer] Found potential toggle:', {
          text: text.substring(0, 50),
          ariaLabel,
          dataAttrs
        });
        return this.getElementDescription(button);
      }
    }

    console.log('[ThemeSwitcherAnalyzer] No toggle button found');
    return null;
  }

  /**
   * Extract CSS variables that might be theme-related
   */
  private extractThemeVariables(): Array<{
    name: string;
    values: Record<string, string>;
  }> {
    const variables: Array<{ name: string; values: Record<string, string> }> = [];

    try {
      const rootStyles = getComputedStyle(document.documentElement);

      const themeVarPatterns = [
        /--(?:color|bg|background|text|primary|secondary|accent)/i,
        /--theme-/i,
        /--(?:dark|light)-/i
      ];

      const styleSheets = document.styleSheets;

      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (!sheet.cssRules) continue;

          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];

            if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
              const style = rule.style;

              for (let k = 0; k < style.length; k++) {
                const propName = style[k];

                if (propName.startsWith('--')) {
                  const isThemeVar = themeVarPatterns.some(pattern =>
                    pattern.test(propName)
                  );

                  if (isThemeVar) {
                    const value = style.getPropertyValue(propName).trim();

                    variables.push({
                      name: propName,
                      values: { current: value }
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.warn('[ThemeSwitcherAnalyzer] Error extracting CSS variables:', e);
    }

    return variables.slice(0, 10); // Limit to top 10 variables
  }

  /**
   * Detect localStorage key used for theme preference
   */
  private detectStorageKey(): string | null {
    try {
      const commonKeys = [
        'theme',
        'mode',
        'darkMode',
        'dark-mode',
        'color-scheme',
        'colorScheme',
        'themePreference',
        'theme-preference',
        'userMode',
        'viewMode'
      ];

      for (const key of commonKeys) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          console.log('[ThemeSwitcherAnalyzer] Found localStorage key:', key, '=', value);
          return key;
        }
      }
    } catch (e) {
    }

    return null;
  }

  /**
   * Try to detect available themes
   */
  private detectAvailableThemes(currentTheme: string): string[] {
    const themes = [currentTheme];

    if (currentTheme === 'dark') {
      themes.push('light');
    } else if (currentTheme === 'light') {
      themes.push('dark');
    }

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

              const match = selector.match(/\[data-theme=["']([^"']+)["']\]/);
              if (match && !themes.includes(match[1])) {
                themes.push(match[1]);
              }
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.warn('[ThemeSwitcherAnalyzer] Error detecting themes:', e);
    }

    return themes;
  }

  /**
   * Detect prefers-color-scheme media query usage (system theme preference)
   */
  private detectMediaQueryTheme(): ThemeSwitcherPattern | null {
    console.log('[ThemeSwitcherAnalyzer] Checking for prefers-color-scheme...');
    let foundDark = false;
    let foundLight = false;

    try {
      const styleSheets = document.styleSheets;

      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (!sheet.cssRules) continue;

          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];

            if (rule instanceof CSSMediaRule) {
              const mediaText = rule.media.mediaText.toLowerCase();

              if (mediaText.includes('prefers-color-scheme')) {
                if (mediaText.includes('dark')) {
                  foundDark = true;
                  console.log('[ThemeSwitcherAnalyzer] Found prefers-color-scheme: dark');
                }
                if (mediaText.includes('light')) {
                  foundLight = true;
                  console.log('[ThemeSwitcherAnalyzer] Found prefers-color-scheme: light');
                }
              }
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.warn('[ThemeSwitcherAnalyzer] Error detecting media queries:', e);
    }

    if (foundDark || foundLight) {
      const themes: string[] = [];
      if (foundLight) themes.push('light');
      if (foundDark) themes.push('dark');

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = prefersDark ? 'dark' : 'light';

      return {
        mechanism: 'css-var-swap', // Media queries typically change CSS variables
        themes,
        toggleElement: 'System preference (no manual toggle)',
        cssVariables: this.extractThemeVariables(),
        storageKey: null,
        implementation: `@media (prefers-color-scheme: ${currentTheme}) { /* theme styles */ }`
      };
    }

    return null;
  }

  /**
   * Get a description of an element
   */
  private getElementDescription(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className
      ? `.${(element.className as string).split(/\s+/).slice(0, 2).join('.')}`
      : '';

    const ariaLabel = element.getAttribute('aria-label');
    const title = element.getAttribute('title');

    let desc = `${tag}${id}${classes}`;

    if (ariaLabel) {
      desc += ` (${ariaLabel})`;
    } else if (title) {
      desc += ` (${title})`;
    }

    return desc;
  }
}
