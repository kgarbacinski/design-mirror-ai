/**
 * Transform Analyzer
 *
 * Analyzes CSS transform properties to detect 2D/3D transformations.
 * Uses StyleCache for performance (transform already cached).
 *
 * Performance: ~50-150ms
 */

import type { StyleCache } from '../utils/style-cache';
import type { TransformPattern, TransformType } from '../../shared/types/design-system.types';

export class TransformAnalyzer {
  /**
   * Analyze transform patterns from elements
   */
  public analyze(elements: Element[], styleCache: StyleCache): TransformPattern {
    const functionMap = new Map<
      string,
      {
        name: string;
        count: number;
        examples: Array<{ selector: string; value: string }>;
      }
    >();

    const perspectiveMap = new Map<string, { value: string; count: number }>();
    let has3D = false;

    for (const element of elements) {
      const styles = styleCache.getComputedStyles(element);
      const transform = styles.transform;

      if (!transform || transform === 'none') {
        continue;
      }

      const functions = this.parseTransform(transform);

      for (const func of functions) {
        if (this.is3DFunction(func.name)) {
          has3D = true;
        }

        let funcData = functionMap.get(func.name);
        if (!funcData) {
          funcData = {
            name: func.name,
            count: 0,
            examples: []
          };
          functionMap.set(func.name, funcData);
        }

        funcData.count++;

        if (funcData.examples.length < 3) {
          const selector = this.getSimpleSelector(element);
          funcData.examples.push({
            selector,
            value: func.value
          });
        }
      }

      const perspective = styles.perspective;
      if (perspective && perspective !== 'none') {
        has3D = true;

        let perspData = perspectiveMap.get(perspective);
        if (!perspData) {
          perspData = { value: perspective, count: 0 };
          perspectiveMap.set(perspective, perspData);
        }
        perspData.count++;
      }
    }

    const type: TransformType = has3D ? '3d' : '2d';

    return {
      type,
      functions: Array.from(functionMap.values()).sort((a, b) => b.count - a.count),
      perspective: Array.from(perspectiveMap.values()).sort((a, b) => b.count - a.count)
    };
  }

  /**
   * Parse transform string into individual functions
   */
  private parseTransform(
    transform: string
  ): Array<{ name: string; value: string }> {
    const functions: Array<{ name: string; value: string }> = [];

    const funcRegex = /([a-zA-Z0-9]+)\(([^)]+)\)/g;
    let match;

    while ((match = funcRegex.exec(transform)) !== null) {
      functions.push({
        name: match[1],
        value: match[0] // Full function with args
      });
    }

    return functions;
  }

  /**
   * Check if a transform function is 3D
   */
  private is3DFunction(funcName: string): boolean {
    const threeDFunctions = [
      'translate3d',
      'translateZ',
      'scale3d',
      'scaleZ',
      'rotate3d',
      'rotateX',
      'rotateY',
      'rotateZ',
      'matrix3d',
      'perspective'
    ];

    return threeDFunctions.includes(funcName.toLowerCase());
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
