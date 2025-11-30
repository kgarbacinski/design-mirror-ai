/**
 * Typography Analyzer - Type System Detection
 *
 * Features:
 * - Font family extraction
 * - Type scale detection (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
 * - Modular scale ratio detection (1.125, 1.25, 1.333, 1.618, etc.)
 * - Heading styles extraction (H1-H6)
 * - Font weight patterns
 * - Line height patterns
 */

import type {
  TypographySystem,
  FontFamily,
  FontSizeInfo,
  TypeScale,
  ComputedTypography
} from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';
import { analyzeFrequency, detectModularScale } from '../utils/pattern-matcher';

export class TypographyAnalyzer {
  private readonly HEADING_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  /**
   * Analyze typography from elements
   */
  analyze(elements: Element[], styleCache: StyleCache): TypographySystem {
    const fontFamilies = new Map<string, number>();
    const fontSizes = new Map<string, FontSizeInfo>();
    const fontWeights = new Map<number, number>();
    const lineHeights = new Map<string, number>();

    // Heading styles
    const headingStyles: Record<string, ComputedTypography> = {};

    for (const element of elements) {
      const styles = styleCache.getByCategory(element, 'typography');
      const tagName = element.tagName;

      // Track font families
      if (styles.fontFamily) {
        const family = this.normalizeFontFamily(styles.fontFamily);
        fontFamilies.set(family, (fontFamilies.get(family) || 0) + 1);
      }

      // Track font sizes with context
      if (styles.fontSize) {
        if (!fontSizes.has(styles.fontSize)) {
          fontSizes.set(styles.fontSize, {
            value: styles.fontSize,
            count: 0,
            contexts: new Set()
          });
        }

        const info = fontSizes.get(styles.fontSize)!;
        info.count++;
        info.contexts.add(this.getContext(element));
      }

      // Track font weights
      if (styles.fontWeight) {
        const weight = this.normalizeFontWeight(styles.fontWeight);
        fontWeights.set(weight, (fontWeights.get(weight) || 0) + 1);
      }

      // Track line heights
      if (styles.lineHeight && styles.lineHeight !== 'normal') {
        lineHeights.set(styles.lineHeight, (lineHeights.get(styles.lineHeight) || 0) + 1);
      }

      // Special handling for headings
      if (this.HEADING_TAGS.includes(tagName)) {
        headingStyles[tagName] = {
          fontSize: styles.fontSize || '',
          fontWeight: styles.fontWeight || '',
          fontFamily: styles.fontFamily || '',
          lineHeight: styles.lineHeight || '',
          letterSpacing: styles.letterSpacing || ''
        };
      }
    }

    // Identify patterns
    return {
      primaryFont: this.getMostFrequent(fontFamilies),
      secondaryFont: this.getSecondMostFrequent(fontFamilies),
      fontScale: this.identifyTypeScale(fontSizes),
      headings: headingStyles,
      weights: this.identifyWeightScale(fontWeights),
      lineHeights: this.identifyLineHeightPattern(lineHeights)
    };
  }

  /**
   * Get most frequent font family
   */
  private getMostFrequent(families: Map<string, number>): FontFamily {
    let maxCount = 0;
    let maxFamily = 'sans-serif';

    for (const [family, count] of families.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxFamily = family;
      }
    }

    return { name: maxFamily, count: maxCount };
  }

  /**
   * Get second most frequent font family
   */
  private getSecondMostFrequent(families: Map<string, number>): FontFamily | undefined {
    const sorted = Array.from(families.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length < 2) return undefined;

    return {
      name: sorted[1][0],
      count: sorted[1][1]
    };
  }

  /**
   * Identify type scale from font sizes
   */
  private identifyTypeScale(sizes: Map<string, FontSizeInfo>): TypeScale {
    // Convert to numeric values
    const numericSizes = Array.from(sizes.entries())
      .map(([value, info]) => ({
        px: this.parseFontSize(value),
        count: info.count,
        contexts: info.contexts,
        original: value
      }))
      .filter(s => s.px > 0)
      .sort((a, b) => a.px - b.px);

    // Detect modular scale
    const sizeValues = numericSizes.map(s => s.px);
    const modularScale = detectModularScale(sizeValues, 0.08); // 8% tolerance

    // Find base size (most common body text size)
    const baseSizeCandidate = numericSizes.find(s =>
      s.contexts.has('body') || s.contexts.has('p') || s.count > 10
    ) || numericSizes.find(s => s.px >= 14 && s.px <= 18);

    const basePx = baseSizeCandidate?.px || 16;

    // Categorize sizes relative to base
    const categories: TypeScale = {
      xs: null,
      sm: null,
      base: baseSizeCandidate?.original || null,
      lg: null,
      xl: null,
      '2xl': null,
      '3xl': null,
      '4xl': null,
      modularScaleRatio: modularScale?.ratio || null,
      allSizes: numericSizes
    };

    for (const size of numericSizes) {
      const ratio = size.px / basePx;

      if (ratio < 0.75) {
        categories.xs = size.original;
      } else if (ratio < 0.9) {
        categories.sm = size.original;
      } else if (ratio > 2.5) {
        categories['4xl'] = size.original;
      } else if (ratio > 2) {
        categories['3xl'] = size.original;
      } else if (ratio > 1.5) {
        categories['2xl'] = size.original;
      } else if (ratio > 1.25) {
        categories.xl = size.original;
      } else if (ratio > 1.1) {
        categories.lg = size.original;
      }
    }

    return categories;
  }

  /**
   * Identify common font weights
   */
  private identifyWeightScale(weights: Map<number, number>): number[] {
    return Array.from(weights.keys()).sort((a, b) => a - b);
  }

  /**
   * Identify line height patterns
   */
  private identifyLineHeightPattern(lineHeights: Map<string, number>): string[] {
    const sorted = Array.from(lineHeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lh]) => lh);

    return sorted;
  }

  /**
   * Parse font size to pixels
   */
  private parseFontSize(size: string): number {
    if (size.endsWith('px')) {
      return parseFloat(size);
    } else if (size.endsWith('rem')) {
      return parseFloat(size) * 16; // Assume 16px base
    } else if (size.endsWith('em')) {
      return parseFloat(size) * 16; // Simplified
    } else if (size.endsWith('pt')) {
      return parseFloat(size) * 1.333; // pt to px conversion
    }

    return parseFloat(size) || 0;
  }

  /**
   * Normalize font family (remove quotes, generic fallbacks)
   */
  private normalizeFontFamily(family: string): string {
    return family
      .split(',')[0] // Take first font
      .trim()
      .replace(/['"]/g, ''); // Remove quotes
  }

  /**
   * Normalize font weight (convert keywords to numbers)
   */
  private normalizeFontWeight(weight: string): number {
    const weightMap: Record<string, number> = {
      'normal': 400,
      'bold': 700,
      'lighter': 300,
      'bolder': 700
    };

    return weightMap[weight.toLowerCase()] || parseInt(weight) || 400;
  }

  /**
   * Get element context for font size categorization
   */
  private getContext(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    // Check for semantic tags
    if (['p', 'div', 'span', 'body'].includes(tagName)) return 'body';
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return tagName;
    if (['button', 'a'].includes(tagName)) return 'interactive';
    if (['small', 'caption', 'figcaption'].includes(tagName)) return 'small';

    // Check for class names
    const className = element.className.toString().toLowerCase();
    if (className.includes('heading') || className.includes('title')) return 'heading';
    if (className.includes('caption') || className.includes('label')) return 'small';
    if (className.includes('button') || className.includes('btn')) return 'button';

    return 'unknown';
  }
}

export default TypographyAnalyzer;
