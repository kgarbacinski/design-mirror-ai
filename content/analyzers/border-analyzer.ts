/**
 * Border Analyzer - Border & Border Radius Detection
 */

import type { BorderSystem, BorderRadiusInfo } from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';

export class BorderAnalyzer {
  /**
   * Analyze borders from elements
   */
  analyze(elements: Element[], styleCache: StyleCache): BorderSystem {
    const radii = new Map<string, number>();
    const widths = new Map<string, number>();
    const styles = new Map<string, number>();

    for (const element of elements) {
      const borderStyles = styleCache.getByCategory(element, 'borders');

      // Border radius
      if (borderStyles.borderRadius && borderStyles.borderRadius !== '0px') {
        radii.set(
          borderStyles.borderRadius,
          (radii.get(borderStyles.borderRadius) || 0) + 1
        );
      }

      // Individual corner radii
      this.addBorderRadius(borderStyles.borderTopLeftRadius, radii);
      this.addBorderRadius(borderStyles.borderTopRightRadius, radii);
      this.addBorderRadius(borderStyles.borderBottomRightRadius, radii);
      this.addBorderRadius(borderStyles.borderBottomLeftRadius, radii);

      // Border width
      if (borderStyles.borderWidth && borderStyles.borderWidth !== '0px') {
        widths.set(
          borderStyles.borderWidth,
          (widths.get(borderStyles.borderWidth) || 0) + 1
        );
      }

      // Border style
      if (borderStyles.borderStyle && borderStyles.borderStyle !== 'none') {
        styles.set(
          borderStyles.borderStyle,
          (styles.get(borderStyles.borderStyle) || 0) + 1
        );
      }
    }

    return {
      radii: this.toRadiusInfos(radii),
      widths: this.toArray(widths),
      styles: this.toArray(styles)
    };
  }

  /**
   * Add border radius to map
   */
  private addBorderRadius(value: string | undefined, radii: Map<string, number>): void {
    if (!value || value === '0px') return;

    radii.set(value, (radii.get(value) || 0) + 1);
  }

  /**
   * Convert map to BorderRadiusInfo array
   */
  private toRadiusInfos(radii: Map<string, number>): BorderRadiusInfo[] {
    return Array.from(radii.entries())
      .filter(([_, count]) => count >= 2)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Convert map to generic array
   */
  private toArray(map: Map<string, number>): Array<{ value: string; count: number }> {
    return Array.from(map.entries())
      .filter(([_, count]) => count >= 2)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }
}

export default BorderAnalyzer;
