/**
 * DOM Walker - Efficient DOM Traversal with Performance Optimizations
 *
 * Features:
 * - Batch processing (100 nodes at a time)
 * - requestIdleCallback for non-blocking iteration
 * - Filters invisible elements early
 * - Skips scripts, styles, meta tags
 * - Shadow DOM support
 */

export interface DOMWalkerOptions {
  batchSize?: number;
  includeInvisible?: boolean;
  includeShadowDOM?: boolean;
  filter?: (element: Element) => boolean;
}

export type ElementVisitor = (element: Element) => void;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD']);

export class DOMWalker {
  private readonly BATCH_SIZE: number;
  private readonly includeInvisible: boolean;
  private readonly includeShadowDOM: boolean;
  private readonly customFilter?: (element: Element) => boolean;

  constructor(options: DOMWalkerOptions = {}) {
    this.BATCH_SIZE = options.batchSize || 100;
    this.includeInvisible = options.includeInvisible || false;
    this.includeShadowDOM = options.includeShadowDOM || true;
    this.customFilter = options.filter;
  }

  /**
   * Walk through DOM and visit each element
   */
  async walk(
    rootElement: Element = document.body,
    visitor: ElementVisitor,
    onProgress?: (processed: number, total: number) => void
  ): Promise<void> {
    const queue: Element[] = [rootElement];
    let processed = 0;
    let estimatedTotal = this.estimateElementCount(rootElement);

    while (queue.length > 0) {
      await this.waitForIdle();

      const batch = queue.splice(0, this.BATCH_SIZE);

      for (const element of batch) {
        if (!this.shouldProcessElement(element)) {
          continue;
        }

        try {
          visitor(element);
          processed++;

          if (onProgress && processed % 50 === 0) {
            onProgress(processed, estimatedTotal);
          }
        } catch (error) {
          console.warn('[DOMWalker] Error visiting element:', error, element);
        }

        this.addChildrenToQueue(element, queue);
      }
    }

    if (onProgress) {
      onProgress(processed, processed);
    }
  }

  /**
   * Get all elements matching filter
   */
  async getElements(
    rootElement: Element = document.body,
    filter?: (element: Element) => boolean
  ): Promise<Element[]> {
    const elements: Element[] = [];

    await this.walk(rootElement, (element) => {
      if (!filter || filter(element)) {
        elements.push(element);
      }
    });

    return elements;
  }

  /**
   * Count elements
   */
  async count(rootElement: Element = document.body): Promise<number> {
    let count = 0;
    await this.walk(rootElement, () => count++);
    return count;
  }

  /**
   * Check if element should be processed
   */
  private shouldProcessElement(element: Element): boolean {
    if (SKIP_TAGS.has(element.tagName)) {
      return false;
    }

    if (!this.includeInvisible && !this.isElementVisible(element)) {
      return false;
    }

    if (this.customFilter && !this.customFilter(element)) {
      return false;
    }

    return true;
  }

  /**
   * Add children to processing queue
   */
  private addChildrenToQueue(element: Element, queue: Element[]): void {
    queue.push(...Array.from(element.children));

    if (this.includeShadowDOM && element.shadowRoot) {
      queue.push(...Array.from(element.shadowRoot.children));
    }
  }

  /**
   * Check if element is visible
   */
  private isElementVisible(element: Element): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Estimate total element count for progress tracking
   */
  private estimateElementCount(root: Element): number {
    try {
      return root.querySelectorAll('*').length;
    } catch {
      return 1000;
    }
  }

  /**
   * Wait for browser idle time
   */
  private waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 100 });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
}

/**
 * Utility: Create a default walker instance
 */
export function createWalker(options?: DOMWalkerOptions): DOMWalker {
  return new DOMWalker(options);
}

/**
 * Utility: Quick walk with default settings
 */
export async function walkDOM(
  visitor: ElementVisitor,
  rootElement: Element = document.body,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const walker = new DOMWalker();
  await walker.walk(rootElement, visitor, onProgress);
}

/**
 * Utility: Check if element is visible (static helper)
 */
export function isElementVisible(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  } catch {
    return false;
  }
}

export default DOMWalker;
