/**
 * CSS Animation Analyzer
 *
 * Detects CSS transitions and @keyframes animations.
 * Leverages StyleCache for performance (transition/animation already cached).
 *
 * Performance: ~150-400ms
 */

import type { StyleCache } from '../utils/style-cache';
import type {
  CSSAnimationPattern,
  CSSTransitionPattern,
  KeyframeAnimation
} from '../../shared/types/design-system.types';

export class CSSAnimationAnalyzer {
  /**
   * Analyze CSS transitions from elements
   */
  public analyzeTransitions(
    elements: Element[],
    styleCache: StyleCache
  ): CSSTransitionPattern[] {
    const transitionMap = new Map<string, CSSTransitionPattern>();

    for (const element of elements) {
      const styles = styleCache.getComputedStyles(element);
      const transition = styles.transition;

      if (!transition || transition === 'none' || transition === 'all 0s ease 0s') {
        continue;
      }

      const transitions = this.parseTransitions(transition);

      for (const t of transitions) {
        const key = `${t.property}|${t.duration}|${t.timingFunction}|${t.delay || ''}`;

        let pattern = transitionMap.get(key);
        if (!pattern) {
          pattern = {
            property: t.property,
            duration: t.duration,
            timingFunction: t.timingFunction,
            delay: t.delay,
            count: 0,
            examples: []
          };
          transitionMap.set(key, pattern);
        }

        pattern.count++;

        if (pattern.examples.length < 3) {
          const selector = this.getSimpleSelector(element);
          if (!pattern.examples.includes(selector)) {
            pattern.examples.push(selector);
          }
        }
      }
    }

    return Array.from(transitionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 transitions
  }

  /**
   * Analyze @keyframes animations from stylesheets
   */
  public analyzeKeyframes(): KeyframeAnimation[] {
    const animations: KeyframeAnimation[] = [];
    const animationUsage = new Map<string, string[]>(); // name -> selectors

    this.extractKeyframes(document.styleSheets, animations);

    this.findAnimationUsage(document.styleSheets, animationUsage);

    for (const animation of animations) {
      animation.usedBy = animationUsage.get(animation.name) || [];
    }

    return animations.slice(0, 15); // Limit to top 15
  }

  /**
   * Combine transitions and keyframes into full pattern
   */
  public analyze(elements: Element[], styleCache: StyleCache): CSSAnimationPattern {
    const transitions = this.analyzeTransitions(elements, styleCache);
    const keyframeAnimations = this.analyzeKeyframes();

    const animatedProps = new Set<string>();

    for (const t of transitions) {
      animatedProps.add(t.property);
    }

    for (const anim of keyframeAnimations) {
      const props = this.extractPropertiesFromKeyframes(anim.keyframes);
      props.forEach(p => animatedProps.add(p));
    }

    return {
      transitions,
      keyframeAnimations,
      animatedProperties: Array.from(animatedProps)
    };
  }

  /**
   * Parse CSS transition shorthand into components
   */
  private parseTransitions(
    transition: string
  ): Array<{
    property: string;
    duration: string;
    timingFunction: string;
    delay?: string;
  }> {
    const parts = transition.split(',').map(t => t.trim());
    const result = [];

    for (const part of parts) {
      let property = '';
      let duration = '';
      let timingFunction = 'ease';
      let delay = undefined;

      const basicMatch = part.match(/^([\w-]+)\s+([\d.]+m?s)/);
      if (basicMatch) {
        property = basicMatch[1];
        duration = basicMatch[2];

        const remaining = part.substring(basicMatch[0].length).trim();

        if (remaining.startsWith('cubic-bezier(')) {
          const cubicMatch = remaining.match(/cubic-bezier\([^)]+\)/);
          if (cubicMatch) {
            timingFunction = cubicMatch[0];
            const afterCubic = remaining.substring(cubicMatch[0].length).trim();
            if (afterCubic.match(/^\d+\.?\d*m?s/)) {
              delay = afterCubic.match(/^\d+\.?\d*m?s/)?.[0];
            }
          }
        } else if (remaining) {
          const tokens = remaining.split(/\s+/);
          if (tokens[0]) timingFunction = tokens[0];
          if (tokens[1]) delay = tokens[1];
        }

        result.push({
          property,
          duration,
          timingFunction,
          delay
        });
      }
    }

    return result;
  }

  /**
   * Extract @keyframes from stylesheets
   */
  private extractKeyframes(
    styleSheets: StyleSheetList,
    animations: KeyframeAnimation[]
  ): void {
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (!sheet.cssRules) continue;

        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];

          if (rule instanceof CSSKeyframesRule) {
            animations.push({
              name: rule.name,
              duration: '', // Will be filled from usage
              timingFunction: '',
              iterationCount: '',
              keyframes: rule.cssText,
              usedBy: []
            });
          }
        }
      } catch (e) {
        console.warn('[CSSAnimationAnalyzer] Cannot access stylesheet:', e);
      }
    }
  }

  /**
   * Find which selectors use which animations
   */
  private findAnimationUsage(
    styleSheets: StyleSheetList,
    usage: Map<string, string[]>
  ): void {
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (!sheet.cssRules) continue;

        this.scanRulesForAnimation(sheet.cssRules, usage);
      } catch (e) {
      }
    }
  }

  /**
   * Scan rules for animation properties
   */
  private scanRulesForAnimation(
    rules: CSSRuleList,
    usage: Map<string, string[]>
  ): void {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (rule instanceof CSSStyleRule) {
        const animationName =
          rule.style.animationName || rule.style.getPropertyValue('animation-name');

        if (animationName && animationName !== 'none') {
          const names = animationName.split(',').map(n => n.trim());

          for (const name of names) {
            if (!usage.has(name)) {
              usage.set(name, []);
            }

            const selectors = usage.get(name)!;
            if (selectors.length < 5 && !selectors.includes(rule.selectorText)) {
              selectors.push(rule.selectorText);
            }
          }
        }
      } else if (rule instanceof CSSMediaRule) {
        this.scanRulesForAnimation(rule.cssRules, usage);
      }
    }
  }

  /**
   * Extract properties from @keyframes rule text (simplified)
   */
  private extractPropertiesFromKeyframes(keyframesText: string): string[] {
    const props = new Set<string>();

    const propRegex = /([a-z-]+)\s*:/gi;
    let match;

    while ((match = propRegex.exec(keyframesText)) !== null) {
      const prop = match[1].toLowerCase();
      if (!prop.startsWith('animation-') && prop !== 'animation') {
        props.add(prop);
      }
    }

    return Array.from(props);
  }

  /**
   * Get a simple selector for an element
   */
  private getSimpleSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const tag = element.tagName.toLowerCase();
    const classes = element.className;

    if (typeof classes === 'string' && classes) {
      const firstClass = classes.split(/\s+/)[0];
      return `${tag}.${firstClass}`;
    }

    return tag;
  }
}
