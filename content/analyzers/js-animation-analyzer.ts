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
    const librariesDetected = this.detectLibraries();

    const styleChanges = await this.observeStyleChanges(elements);

    const eventListeners = this.detectEventListeners();

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

      const sampleSize = Math.min(elements.length, 100);
      const sampledElements = elements.slice(0, sampleSize);

      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const element = mutation.target as Element;

            if (!styleChanges.has(element)) {
              styleChanges.set(element, { properties: new Set(), changeCount: 0 });
            }

            const data = styleChanges.get(element)!;
            data.changeCount++;

            const style = (element as HTMLElement).style;
            for (let i = 0; i < style.length; i++) {
              data.properties.add(style[i]);
            }
          }
        }
      });

      for (const element of sampledElements) {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['style']
        });
      }

      setTimeout(() => {
        observer.disconnect();

        const results = Array.from(styleChanges.entries()).map(([element, data]) => {
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

    for (const event of events) {
      const attrName = `on${event}`;
      const elementsWithAttr = document.querySelectorAll(`[${attrName}]`);

      if (elementsWithAttr.length > 0) {
        eventCounts.set(event, elementsWithAttr.length);
      }
    }

    try {
      const interactiveElements = document.querySelectorAll(
        '[data-animation], [data-animate], [data-scroll], [data-aos]'
      );

      if (interactiveElements.length > 0) {
        eventCounts.set('scroll', (eventCounts.get('scroll') || 0) + interactiveElements.length);
      }
    } catch (e) {
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
