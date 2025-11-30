/**
 * Color Analyzer - Intelligent Color Palette Extraction
 *
 * Features:
 * - Color extraction from text, background, border
 * - Normalization to hex
 * - Clustering similar colors (k-means, delta E)
 * - Role identification (primary, secondary, accent, neutrals, semantic)
 * - CSS variables extraction
 */

import type {
  ColorPalette,
  ColorInfo,
  ColorCluster,
  ColorUsage,
  RGB,
  HSL,
  LAB,
  CSSVariable
} from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';
import { analyzeFrequency } from '../utils/pattern-matcher';

export class ColorAnalyzer {
  /**
   * Analyze colors from elements
   */
  analyze(elements: Element[], styleCache: StyleCache): ColorPalette {
    const colorFrequency = new Map<string, ColorInfo>();

    // Step 1: Extract all colors
    for (const element of elements) {
      const styles = styleCache.getByCategory(element, 'colors');

      this.extractColor(styles.color, 'text', colorFrequency);
      this.extractColor(styles.backgroundColor, 'background', colorFrequency);
      this.extractColor(styles.borderColor, 'border', colorFrequency);

      // Individual border colors
      this.extractColor(styles.borderTopColor, 'border', colorFrequency);
      this.extractColor(styles.borderRightColor, 'border', colorFrequency);
      this.extractColor(styles.borderBottomColor, 'border', colorFrequency);
      this.extractColor(styles.borderLeftColor, 'border', colorFrequency);
    }

    // Step 2: Filter edge cases
    this.filterEdgeCases(colorFrequency);

    // Step 3: Cluster similar colors
    const clusters = this.clusterColors(colorFrequency);

    // Step 4: Identify roles
    const palette = this.identifyColorRoles(clusters);

    // Step 5: Extract CSS variables
    palette.cssVariables = this.extractCSSVariables();

    return palette;
  }

  /**
   * Extract color and add to frequency map
   */
  private extractColor(
    colorValue: string | undefined,
    usage: ColorUsage,
    frequency: Map<string, ColorInfo>
  ): void {
    if (!colorValue) return;

    // Skip transparent colors
    if (
      colorValue === 'transparent' ||
      colorValue === 'rgba(0, 0, 0, 0)' ||
      colorValue === 'rgba(0,0,0,0)'
    ) {
      return;
    }

    // Normalize to hex
    const normalized = this.normalizeColor(colorValue);
    if (!normalized) return;

    if (!frequency.has(normalized)) {
      const rgb = this.hexToRgb(normalized);
      if (!rgb) return;

      frequency.set(normalized, {
        hex: normalized,
        rgb: rgb,
        count: 0,
        usages: new Set()
      });
    }

    const info = frequency.get(normalized)!;
    info.count++;
    info.usages.add(usage);
  }

  /**
   * Filter out edge cases (very rare colors, pure black/white used once)
   */
  private filterEdgeCases(colorFrequency: Map<string, ColorInfo>): void {
    const toDelete: string[] = [];

    for (const [hex, info] of colorFrequency.entries()) {
      // Remove colors used only once
      if (info.count === 1) {
        toDelete.push(hex);
      }
    }

    for (const hex of toDelete) {
      colorFrequency.delete(hex);
    }
  }

  /**
   * Cluster similar colors using perceptual distance
   */
  private clusterColors(colorFrequency: Map<string, ColorInfo>): ColorCluster[] {
    const colors = Array.from(colorFrequency.values());
    const clusters: ColorCluster[] = [];

    // Sort by frequency (most common first)
    colors.sort((a, b) => b.count - a.count);

    for (const color of colors) {
      // Find nearest cluster
      let nearestCluster: ColorCluster | null = null;
      let minDistance = Infinity;

      for (const cluster of clusters) {
        const distance = this.colorDistance(color.rgb, cluster.centroid.rgb);

        // Delta E threshold: colors with deltaE < 10 are perceptually similar
        if (distance < 10 && distance < minDistance) {
          nearestCluster = cluster;
          minDistance = distance;
        }
      }

      if (nearestCluster) {
        // Add to existing cluster
        nearestCluster.colors.push(color);
        nearestCluster.totalCount += color.count;

        // Merge usages
        for (const usage of color.usages) {
          nearestCluster.centroid.usages.add(usage);
        }
      } else {
        // Create new cluster
        clusters.push({
          centroid: color,
          colors: [color],
          totalCount: color.count
        });
      }
    }

    // Sort clusters by total count
    clusters.sort((a, b) => b.totalCount - a.totalCount);

    return clusters;
  }

  /**
   * Identify color roles (primary, secondary, accent, neutrals, semantic)
   */
  private identifyColorRoles(clusters: ColorCluster[]): ColorPalette {
    const palette: ColorPalette = {
      primary: null,
      secondary: null,
      accent: [],
      neutrals: [],
      semantic: {
        error: null,
        success: null,
        warning: null,
        info: null
      },
      cssVariables: [],
      all: clusters
    };

    for (const cluster of clusters) {
      const hsl = this.rgbToHsl(cluster.centroid.rgb);

      // Neutrals (low saturation)
      if (hsl.s < 0.15) {
        palette.neutrals.push(cluster);
        continue;
      }

      // Semantic colors (by hue)
      if (this.isRedHue(hsl.h) && !palette.semantic.error) {
        palette.semantic.error = cluster;
        continue;
      } else if (this.isGreenHue(hsl.h) && !palette.semantic.success) {
        palette.semantic.success = cluster;
        continue;
      } else if (this.isYellowHue(hsl.h) && !palette.semantic.warning) {
        palette.semantic.warning = cluster;
        continue;
      } else if (this.isBlueHue(hsl.h) && !palette.semantic.info) {
        palette.semantic.info = cluster;
        continue;
      }

      // Primary/Secondary/Accent (saturated colors)
      if (!palette.primary && hsl.s > 0.3 && cluster.totalCount > 10) {
        palette.primary = cluster;
      } else if (!palette.secondary && hsl.s > 0.3 && cluster.totalCount > 5) {
        palette.secondary = cluster;
      } else if (hsl.s > 0.5) {
        palette.accent.push(cluster);
      }
    }

    return palette;
  }

  /**
   * Calculate perceptual color distance (CIE76 delta E)
   */
  private colorDistance(rgb1: RGB, rgb2: RGB): number {
    const lab1 = this.rgbToLab(rgb1);
    const lab2 = this.rgbToLab(rgb2);

    return Math.sqrt(
      Math.pow(lab1.L - lab2.L, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
    );
  }

  /**
   * Normalize color to hex format
   */
  private normalizeColor(color: string): string | null {
    // Already hex
    if (color.startsWith('#')) {
      return color.length === 4
        ? this.expandShortHex(color)
        : color.toUpperCase();
    }

    // RGB/RGBA
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return this.rgbToHex({ r, g, b });
      }
    }

    // Named colors (simplified - would need full lookup table)
    const namedColors: Record<string, string> = {
      'white': '#FFFFFF',
      'black': '#000000',
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF'
      // ... more named colors could be added
    };

    return namedColors[color.toLowerCase()] || null;
  }

  /**
   * Expand short hex (#fff -> #ffffff)
   */
  private expandShortHex(hex: string): string {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
  }

  /**
   * Convert RGB to HSL
   */
  private rgbToHsl(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s, l };
  }

  /**
   * Convert RGB to LAB color space (simplified)
   */
  private rgbToLab(rgb: RGB): LAB {
    // Convert RGB to XYZ
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x + 16 / 116);
    const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y + 16 / 116);
    const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z + 16 / 116);

    return {
      L: 116 * fy - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz)
    };
  }

  /**
   * Hue detection helpers
   */
  private isRedHue(h: number): boolean {
    return (h >= 0 && h < 30) || (h >= 330 && h <= 360);
  }

  private isGreenHue(h: number): boolean {
    return h >= 90 && h < 150;
  }

  private isYellowHue(h: number): boolean {
    return h >= 30 && h < 90;
  }

  private isBlueHue(h: number): boolean {
    return h >= 180 && h < 270;
  }

  /**
   * Extract CSS custom properties (variables)
   */
  private extractCSSVariables(): CSSVariable[] {
    const variables: CSSVariable[] = [];

    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSStyleRule) {
              const style = rule.style;

              for (let i = 0; i < style.length; i++) {
                const prop = style[i];

                if (prop.startsWith('--')) {
                  const value = style.getPropertyValue(prop);

                  // Only include color-related variables
                  if (this.looksLikeColor(value)) {
                    variables.push({
                      name: prop,
                      value: value,
                      selector: rule.selectorText
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          // CORS - external stylesheets may throw
          console.warn('[ColorAnalyzer] Could not access stylesheet:', e);
        }
      }
    } catch (e) {
      console.warn('[ColorAnalyzer] Error extracting CSS variables:', e);
    }

    return variables;
  }

  /**
   * Check if value looks like a color
   */
  private looksLikeColor(value: string): boolean {
    return (
      value.startsWith('#') ||
      value.startsWith('rgb') ||
      value.startsWith('hsl') ||
      ['red', 'green', 'blue', 'white', 'black'].includes(value.toLowerCase())
    );
  }
}

export default ColorAnalyzer;
