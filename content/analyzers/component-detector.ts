/**
 * Component Detector - UI Component Detection
 *
 * Simplified version using selector-based detection
 * Can be extended with heuristics later
 */

import type {
  DetectedComponent,
  ComponentStyles,
  ComponentVariation
} from '@shared/types/design-system.types';
import { StyleCache } from '../utils/style-cache';
import { COMPONENT_PATTERNS } from '@shared/constants/component-patterns';

export class ComponentDetector {
  /**
   * Detect UI components in the DOM
   */
  detect(styleCache: StyleCache): DetectedComponent[] {
    const detected: DetectedComponent[] = [];
    const seenElements = new WeakSet<Element>();

    for (const pattern of COMPONENT_PATTERNS) {
      for (const selector of pattern.selectors) {
        try {
          const matches = document.querySelectorAll(selector);

          for (const element of Array.from(matches)) {
            if (seenElements.has(element)) continue;

            detected.push({
              type: pattern.type,
              element,
              confidence: 0.8, // High confidence for selector-based
              styles: this.extractComponentStyles(element, styleCache),
              variations: this.detectVariations(element)
            });

            seenElements.add(element);
          }
        } catch (error) {
          console.warn(`[ComponentDetector] Invalid selector: ${selector}`, error);
        }
      }
    }

    return detected;
  }

  /**
   * Extract styles for a component
   */
  private extractComponentStyles(element: Element, styleCache: StyleCache): ComponentStyles {
    const layout = styleCache.getByCategory(element, 'layout');
    const spacing = styleCache.getByCategory(element, 'spacing');
    const colors = styleCache.getByCategory(element, 'colors');
    const typography = styleCache.getByCategory(element, 'typography');
    const borders = styleCache.getByCategory(element, 'borders');
    const shadows = styleCache.getByCategory(element, 'shadows');

    return {
      layout: {
        display: layout.display,
        position: layout.position,
        width: layout.width,
        height: layout.height
      },
      spacing: {
        padding: spacing.padding,
        margin: spacing.margin
      },
      colors: {
        color: colors.color,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor
      },
      typography: {
        fontSize: typography.fontSize,
        fontWeight: typography.fontWeight,
        fontFamily: typography.fontFamily,
        lineHeight: typography.lineHeight
      },
      borders: {
        borderWidth: borders.borderWidth,
        borderStyle: borders.borderStyle,
        borderRadius: borders.borderRadius
      },
      shadows: {
        boxShadow: shadows.boxShadow,
        textShadow: shadows.textShadow
      }
    };
  }

  /**
   * Detect component variations from class names
   */
  private detectVariations(element: Element): ComponentVariation[] {
    const variations: ComponentVariation[] = [];
    const className = element.className.toString().toLowerCase();

    const sizePatterns = ['xs', 'sm', 'small', 'md', 'medium', 'lg', 'large', 'xl'];
    for (const pattern of sizePatterns) {
      if (className.includes(pattern)) {
        variations.push({
          category: 'size',
          value: pattern
        });
        break;
      }
    }

    const variantPatterns = ['primary', 'secondary', 'outline', 'ghost', 'link', 'text'];
    for (const pattern of variantPatterns) {
      if (className.includes(pattern)) {
        variations.push({
          category: 'variant',
          value: pattern
        });
        break;
      }
    }

    const colorPatterns = ['red', 'blue', 'green', 'yellow', 'success', 'error', 'warning', 'info'];
    for (const pattern of colorPatterns) {
      if (className.includes(pattern)) {
        variations.push({
          category: 'color',
          value: pattern
        });
        break;
      }
    }

    const statePatterns = ['active', 'disabled', 'loading', 'hover', 'focus'];
    for (const pattern of statePatterns) {
      if (className.includes(pattern)) {
        variations.push({
          category: 'state',
          value: pattern
        });
      }
    }

    return variations;
  }
}

export default ComponentDetector;
