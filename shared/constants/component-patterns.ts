/**
 * Component Patterns - UI Component Detection Rules
 */

import type { ComponentPattern, ComponentType } from '../types/design-system.types';

/**
 * Component detection patterns
 * Each pattern consists of CSS selectors and heuristic functions
 */
export const COMPONENT_PATTERNS: ComponentPattern[] = [
  {
    type: 'button',
    selectors: [
      'button',
      'a[role="button"]',
      '[class*="btn"]',
      '[class*="button"]',
      'input[type="button"]',
      'input[type="submit"]'
    ],
    heuristics: []
  },

  {
    type: 'card',
    selectors: [
      '[class*="card"]',
      'article',
      '[class*="tile"]',
      '[class*="box"]'
    ],
    heuristics: []
  },

  {
    type: 'navigation',
    selectors: [
      'nav',
      '[role="navigation"]',
      '[class*="nav"]',
      'header nav',
      '[class*="menu"]'
    ],
    heuristics: []
  },

  {
    type: 'form',
    selectors: [
      'form',
      '[class*="form"]'
    ],
    heuristics: []
  },

  {
    type: 'input',
    selectors: [
      'input:not([type="submit"]):not([type="button"])',
      'textarea',
      'select',
      '[class*="input"]',
      '[class*="field"]'
    ],
    heuristics: []
  },

  {
    type: 'badge',
    selectors: [
      '[class*="badge"]',
      '[class*="tag"]',
      '[class*="chip"]',
      '[class*="label"]'
    ],
    heuristics: []
  },

  {
    type: 'modal',
    selectors: [
      '[role="dialog"]',
      '[class*="modal"]',
      '[class*="dialog"]',
      '[class*="popup"]'
    ],
    heuristics: []
  },

  {
    type: 'table',
    selectors: [
      'table',
      '[role="table"]',
      '[class*="table"]'
    ],
    heuristics: []
  },

  {
    type: 'tooltip',
    selectors: [
      '[role="tooltip"]',
      '[class*="tooltip"]',
      '[class*="popover"]'
    ],
    heuristics: []
  }
];

export default COMPONENT_PATTERNS;
