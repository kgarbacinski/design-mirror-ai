/**
 * JavaScript Animation Analyzer
 *
 * Multi-layer detection of JavaScript-driven animations:
 * - Layer 1: Animation library detection (GSAP, Anime.js, etc.)
 * - Layer 2: MutationObserver for style changes
 * - Layer 3: Event listener detection (Chrome only)
 * - Layer 4: Data attribute scanning
 *
 * Performance: ~500-2000ms (MutationObserver wait time)
 */

import type { JSAnimationPattern, JSAnimationLibrary } from '../../shared/types/design-system.types';

export class JSAnimationAnalyzer {
  /**
   * Analyze JavaScript animations
   */
  public async analyze(elements: Element[]): Promise<JSAnimationPattern> {
    // Layer 1: Detect animation libraries
    const librariesDetected = this.detectLibraries();

    // Layer 2: Observe style changes (with timeout)
    const styleChanges = await this.observeStyleChanges(elements);

    // Layer 3: Count event listeners (approximation)
    const eventListeners = this.detectEventListeners();

    // Determine complexity
    const hasComplexAnimations =
      librariesDetected.length > 0 ||
      styleChanges.length > 5 ||
      eventListeners.some(e => e.count > 10);

    return {
      librariesDetected,
      styleChanges,
      eventListeners,
      animatedElements: styleChanges.length,
      hasComplexAnimations
    };
  }

  /**
   * Layer 1: Detect animation libraries
   */
  private detectLibraries(): Array<{ name: JSAnimationLibrary; confidence: number }> {
    const libraries: Array<{ name: JSAnimationLibrary; confidence: number }> = [];

    // Check window object for known libraries
    const win = window as any;

    if (win.gsap || win.GreenSockGlobals || win.TweenMax || win.TweenLite) {
      libraries.push({ name: 'gsap', confidence: 1.0 });
    }

    if (win.anime) {
      libraries.push({ name: 'anime', confidence: 1.0 });
    }

    if (win.motion || (win.React && document.querySelector('[class*="framer"]'))) {
      libraries.push({ name: 'framer-motion', confidence: 0.7 });
    }

    if (win.lottie || document.querySelector('[data-lottie]')) {
      libraries.push({ name: 'lottie', confidence: 0.8 });
    }

    if (win.THREE) {
      libraries.push({ name: 'three', confidence: 1.0 });
    }

    // Check for library scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      const src = script.getAttribute('src')?.toLowerCase() || '';

      if (src.includes('gsap') || src.includes('greensock')) {
        if (!libraries.find(l => l.name === 'gsap')) {
          libraries.push({ name: 'gsap', confidence: 0.9 });
        }
      }

      if (src.includes('anime')) {
        if (!libraries.find(l => l.name === 'anime')) {
          libraries.push({ name: 'anime', confidence: 0.9 });
        }
      }

      if (src.includes('lottie')) {
        if (!libraries.find(l => l.name === 'lottie')) {
          libraries.push({ name: 'lottie', confidence: 0.9 });
        }
      }

      if (src.includes('three')) {
        if (!libraries.find(l => l.name === 'three')) {
          libraries.push({ name: 'three', confidence: 0.9 });
        }
      }
    }

    return libraries;
  }

  /**
   * Layer 2: Observe style changes with MutationObserver
   */
  private observeStyleChanges(
    elements: Element[]
  ): Promise<
    Array<{
      element: string;
      properties: string[];
      frequency: 'continuous' | 'on-interaction' | 'on-load';
    }>
  > {
    return new Promise(resolve => {
      const styleChanges = new Map<
        Element,
        { properties: Set<string>; changeCount: number }
      >();

      // Sample a subset of elements for performance
      const sampleSize = Math.min(elements.length, 100);
      const sampledElements = elements.slice(0, sampleSize);

      // Create observer
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const element = mutation.target as Element;

            if (!styleChanges.has(element)) {
              styleChanges.set(element, { properties: new Set(), changeCount: 0 });
            }

            const data = styleChanges.get(element)!;
            data.changeCount++;

            // Try to detect which properties changed
            const style = (element as HTMLElement).style;
            for (let i = 0; i < style.length; i++) {
              data.properties.add(style[i]);
            }
          }
        }
      });

      // Observe sampled elements
      for (const element of sampledElements) {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['style']
        });
      }

      // Wait for 2 seconds to collect data
      setTimeout(() => {
        observer.disconnect();

        // Process results
        const results = Array.from(styleChanges.entries()).map(([element, data]) => {
          // Determine frequency based on change count
          let frequency: 'continuous' | 'on-interaction' | 'on-load';

          if (data.changeCount > 10) {
            frequency = 'continuous';
          } else if (data.changeCount > 2) {
            frequency = 'on-interaction';
          } else {
            frequency = 'on-load';
          }

          return {
            element: this.getElementDescription(element),
            properties: Array.from(data.properties),
            frequency
          };
        });

        resolve(results.slice(0, 10)); // Limit to top 10
      }, 2000);
    });
  }

  /**
   * Layer 3: Detect event listeners (approximation)
   */
  private detectEventListeners(): Array<{ event: string; count: number }> {
    const eventCounts = new Map<string, number>();

    // Common animation-related events
    const events = [
      'click',
      'mouseenter',
      'mouseleave',
      'scroll',
      'touchstart',
      'touchmove',
      'animationstart',
      'animationend',
      'transitionend'
    ];

    // Count elements with onclick/onmouseenter/etc attributes
    for (const event of events) {
      const attrName = `on${event}`;
      const elementsWithAttr = document.querySelectorAll(`[${attrName}]`);

      if (elementsWithAttr.length > 0) {
        eventCounts.set(event, elementsWithAttr.length);
      }
    }

    // Try to detect addEventListener usage (Chrome DevTools API - might not work)
    // This is a best-effort approach
    try {
      // Check for data attributes that suggest event handling
      const interactiveElements = document.querySelectorAll(
        '[data-animation], [data-animate], [data-scroll], [data-aos]'
      );

      if (interactiveElements.length > 0) {
        eventCounts.set('scroll', (eventCounts.get('scroll') || 0) + interactiveElements.length);
      }
    } catch (e) {
      // Ignore
    }

    return Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get element description
   */
  private getElementDescription(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className;

    if (id) {
      return `${tag}${id}`;
    }

    if (typeof classes === 'string' && classes) {
      const firstClass = classes.split(/\s+/)[0];
      return `${tag}.${firstClass}`;
    }

    return tag;
  }
}
