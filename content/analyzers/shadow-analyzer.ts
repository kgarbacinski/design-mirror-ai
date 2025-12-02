/**
 * Shadow Analyzer - Box Shadow & Text Shadow Detection
 */

import type { ShadowSystem, ShadowInfo } from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';
import { analyzeFrequency } from '../utils/pattern-matcher';

export class ShadowAnalyzer {
  /**
   * Analyze shadows from elements
   */
  analyze(elements: Element[], styleCache: StyleCache): ShadowSystem {
    const boxShadows = new Map<string, number>();
    const textShadows = new Map<string, number>();

    for (const element of elements) {
      const styles = styleCache.getByCategory(element, 'shadows');

      if (styles.boxShadow && styles.boxShadow !== 'none') {
        boxShadows.set(
          styles.boxShadow,
          (boxShadows.get(styles.boxShadow) || 0) + 1
        );
      }

      if (styles.textShadow && styles.textShadow !== 'none') {
        textShadows.set(
          styles.textShadow,
          (textShadows.get(styles.textShadow) || 0) + 1
        );
      }
    }

    const boxShadowInfos = this.toShadowInfos(boxShadows, 'box');
    const textShadowInfos = this.toShadowInfos(textShadows, 'text');

    const all = [...boxShadowInfos, ...textShadowInfos].sort(
      (a, b) => b.count - a.count
    );

    return {
      common: all.slice(0, 10), // Top 10 most common
      boxShadows: boxShadowInfos,
      textShadows: textShadowInfos
    };
  }

  /**
   * Convert map to ShadowInfo array
   */
  private toShadowInfos(
    shadows: Map<string, number>,
    type: 'box' | 'text'
  ): ShadowInfo[] {
    return Array.from(shadows.entries())
      .filter(([_, count]) => count >= 2) // At least 2 occurrences
      .map(([value, count]) => ({
        value,
        count,
        type
      }))
      .sort((a, b) => b.count - a.count);
  }
}

export default ShadowAnalyzer;
