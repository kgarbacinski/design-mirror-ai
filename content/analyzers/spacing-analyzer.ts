/**
 * Spacing Analyzer - Spacing System Detection
 *
 * Features:
 * - Extract margins, paddings, gaps
 * - Detect base unit (4px, 8px, 16px)
 * - Generate spacing scale (xs, sm, md, lg, xl, 2xl, etc.)
 * - Frequency analysis
 */

import type {
  SpacingSystem,
  SpacingInfo,
  SpacingScale
} from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';
import { detectBaseUnit, analyzeFrequency } from '../utils/pattern-matcher';

export class SpacingAnalyzer {
  /**
   * Analyze spacing from elements
   */
  analyze(elements: Element[], styleCache: StyleCache): SpacingSystem {
    const spacingValues = new Map<number, SpacingInfo>();

    for (const element of elements) {
      const styles = styleCache.getByCategory(element, 'spacing');

      this.extractSpacingValues(styles, 'margin', spacingValues);

      this.extractSpacingValues(styles, 'padding', spacingValues);

      if (styles.gap) {
        this.addSpacingValue(this.parseSpacing(styles.gap), 'gap', spacingValues);
      }
      if (styles.rowGap) {
        this.addSpacingValue(this.parseSpacing(styles.rowGap), 'gap', spacingValues);
      }
      if (styles.columnGap) {
        this.addSpacingValue(this.parseSpacing(styles.columnGap), 'gap', spacingValues);
      }
    }

    const values = Array.from(spacingValues.keys()).filter(v => v > 0);
    const baseUnit = detectBaseUnit(values, [4, 8, 10, 16]) || 8;

    const scale = this.createSpacingScale(spacingValues, baseUnit);

    const sortedValues = Array.from(spacingValues.entries())
      .sort((a, b) => b[1].count - a[1].count);

    return {
      baseUnit,
      scale,
      allValues: sortedValues
    };
  }

  /**
   * Extract spacing values from margin/padding properties
   */
  private extractSpacingValues(
    styles: Record<string, string>,
    property: 'margin' | 'padding',
    spacingValues: Map<number, SpacingInfo>
  ): void {
    if (styles[property]) {
      const values = this.parseShorthand(styles[property]);
      for (const value of values) {
        this.addSpacingValue(value, property, spacingValues);
      }
    }

    const directions = ['Top', 'Right', 'Bottom', 'Left'];
    for (const direction of directions) {
      const key = property + direction;
      if (styles[key]) {
        const value = this.parseSpacing(styles[key]);
        this.addSpacingValue(value, property, spacingValues);
      }
    }
  }

  /**
   * Add spacing value to frequency map
   */
  private addSpacingValue(
    value: number,
    usage: 'margin' | 'padding' | 'gap',
    spacingValues: Map<number, SpacingInfo>
  ): void {
    if (value <= 0) return;

    if (!spacingValues.has(value)) {
      spacingValues.set(value, {
        value,
        count: 0,
        usages: new Set()
      });
    }

    const info = spacingValues.get(value)!;
    info.count++;
    info.usages.add(usage);
  }

  /**
   * Parse spacing value to pixels
   */
  private parseSpacing(value: string): number {
    if (!value || value === 'auto' || value === '0') return 0;

    if (value.endsWith('px')) {
      return parseFloat(value);
    } else if (value.endsWith('rem')) {
      return parseFloat(value) * 16; // Assume 16px base
    } else if (value.endsWith('em')) {
      return parseFloat(value) * 16; // Simplified
    }

    return parseFloat(value) || 0;
  }

  /**
   * Parse shorthand spacing (e.g., "10px 20px")
   */
  private parseShorthand(value: string): number[] {
    return value
      .split(' ')
      .map(v => this.parseSpacing(v))
      .filter(v => v > 0);
  }

  /**
   * Create spacing scale from values
   */
  private createSpacingScale(
    spacingValues: Map<number, SpacingInfo>,
    baseUnit: number
  ): SpacingScale {
    const scale: SpacingScale = {};

    const scaleNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];

    const values = Array.from(spacingValues.entries())
      .filter(([value]) => value % baseUnit === 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([value]) => value);

    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    for (let i = 0; i < Math.min(uniqueValues.length, scaleNames.length); i++) {
      scale[scaleNames[i]] = `${uniqueValues[i]}px`;
    }

    return scale;
  }
}

export default SpacingAnalyzer;
