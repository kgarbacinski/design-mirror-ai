/**
 * Component Patterns - UI Component Detection Rules
 */

import type { ComponentPattern, ComponentType } from '../types/design-system.types';

/**
 * Component detection patterns
 * Each pattern consists of CSS selectors and heuristic functions
 */
export const COMPONENT_PATTERNS: ComponentPattern[] = [
  // Buttons
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

  // Cards
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

  // Navigation
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

  // Forms
  {
    type: 'form',
    selectors: [
      'form',
      '[class*="form"]'
    ],
    heuristics: []
  },

  // Inputs
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

  // Badges
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

  // Modals
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

  // Tables
  {
    type: 'table',
    selectors: [
      'table',
      '[role="table"]',
      '[class*="table"]'
    ],
    heuristics: []
  },

  // Tooltips
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
