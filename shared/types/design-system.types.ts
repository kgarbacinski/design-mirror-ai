// Design System Analysis Types

// ===== Color System =====

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export interface LAB {
  L: number;
  a: number;
  b: number;
}

export type ColorUsage = 'text' | 'background' | 'border' | 'fill' | 'stroke';

export interface ColorInfo {
  hex: string;
  rgb: RGB;
  count: number;
  usages: Set<ColorUsage>;
}

export interface ColorCluster {
  centroid: ColorInfo;
  colors: ColorInfo[];
  totalCount: number;
}

export interface CSSVariable {
  name: string;
  value: string;
  selector: string;
}

export interface ColorPalette {
  primary: ColorCluster | null;
  secondary: ColorCluster | null;
  accent: ColorCluster[];
  neutrals: ColorCluster[];
  semantic: {
    error: ColorCluster | null;
    success: ColorCluster | null;
    warning: ColorCluster | null;
    info: ColorCluster | null;
  };
  cssVariables: CSSVariable[];
  all: ColorCluster[];
}

// ===== Typography System =====

export interface FontFamily {
  name: string;
  count: number;
}

export interface FontSizeInfo {
  value: string;
  count: number;
  contexts: Set<string>;
}

export interface TypeScale {
  xs: string | null;
  sm: string | null;
  base: string | null;
  lg: string | null;
  xl: string | null;
  '2xl': string | null;
  '3xl': string | null;
  '4xl': string | null;
  modularScaleRatio: number | null;
  allSizes: Array<{ px: number; count: number; contexts: Set<string> }>;
}

export interface ComputedTypography {
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface TypographySystem {
  primaryFont: FontFamily;
  secondaryFont?: FontFamily;
  fontScale: TypeScale;
  headings: Record<string, ComputedTypography>;
  weights: number[];
  lineHeights: string[];
}

// ===== Spacing System =====

export interface SpacingInfo {
  value: number;
  count: number;
  usages: Set<'margin' | 'padding' | 'gap'>;
}

export interface SpacingScale {
  [key: string]: string; // e.g., { xs: '4px', sm: '8px', ... }
}

export interface SpacingSystem {
  baseUnit: number;
  scale: SpacingScale;
  allValues: Array<[number, SpacingInfo]>;
}

// ===== Shadow System =====

export interface ShadowInfo {
  value: string;
  count: number;
  type: 'box' | 'text';
}

export interface ShadowSystem {
  common: ShadowInfo[];
  boxShadows: ShadowInfo[];
  textShadows: ShadowInfo[];
}

// ===== Border System =====

export interface BorderRadiusInfo {
  value: string;
  count: number;
}

export interface BorderSystem {
  radii: BorderRadiusInfo[];
  widths: Array<{ value: string; count: number }>;
  styles: Array<{ value: string; count: number }>;
}

// ===== Component Detection =====

export type ComponentType =
  | 'button'
  | 'card'
  | 'modal'
  | 'navigation'
  | 'form'
  | 'input'
  | 'badge'
  | 'table'
  | 'tooltip';

export type VariationCategory = 'size' | 'variant' | 'color' | 'state';

export interface ComponentVariation {
  category: VariationCategory;
  value: string;
}

export interface ComponentStyles {
  layout: {
    display?: string;
    position?: string;
    width?: string;
    height?: string;
  };
  spacing: {
    padding?: string;
    margin?: string;
  };
  colors: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
  typography: {
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    lineHeight?: string;
  };
  borders: {
    borderWidth?: string;
    borderStyle?: string;
    borderRadius?: string;
  };
  shadows: {
    boxShadow?: string;
    textShadow?: string;
  };
}

export interface DetectedComponent {
  type: ComponentType;
  element: Element;
  confidence: number;
  styles: ComponentStyles;
  variations: ComponentVariation[];
}

export type Heuristic = (element: Element, cache?: any) => boolean;

export interface ComponentPattern {
  type: ComponentType;
  selectors: string[];
  heuristics: Heuristic[];
}

// ===== Interactive Pattern System =====

export type ThemeSwitcherMechanism =
  | 'class-toggle'
  | 'attribute-toggle'
  | 'css-var-swap'
  | 'stylesheet-swap';

export interface ThemeSwitcherPattern {
  mechanism: ThemeSwitcherMechanism;
  themes: string[]; // e.g., ['light', 'dark']
  toggleElement: string | null; // selector or description
  cssVariables: Array<{
    name: string;
    values: Record<string, string>; // theme name -> value
  }>;
  storageKey: string | null;
  implementation: string; // code snippet or description
}

export interface CSSTransitionPattern {
  property: string;
  duration: string;
  timingFunction: string;
  delay?: string;
  count: number;
  examples: string[]; // selectors where this transition is used
}

export interface KeyframeAnimation {
  name: string;
  duration: string;
  timingFunction: string;
  iterationCount: string;
  keyframes: string; // @keyframes rule as string
  usedBy: string[]; // selectors using this animation
}

export interface CSSAnimationPattern {
  transitions: CSSTransitionPattern[];
  keyframeAnimations: KeyframeAnimation[];
  animatedProperties: string[]; // all properties being animated
}

export type TransformType = '2d' | '3d';

export interface TransformPattern {
  type: TransformType;
  functions: Array<{
    name: string; // 'translate', 'rotate', 'scale', etc.
    count: number;
    examples: Array<{
      selector: string;
      value: string;
    }>;
  }>;
  perspective: Array<{
    value: string;
    count: number;
  }>;
}

export interface InteractiveStatePattern {
  selector: string;
  states: {
    hover?: Record<string, string>; // CSS property -> value
    focus?: Record<string, string>;
    active?: Record<string, string>;
    disabled?: Record<string, string>;
  };
  changedProperties: string[]; // properties that change on interaction
  context?: {
    elementType?: string; // 'button', 'link', 'card', etc.
    role?: string; // ARIA role or inferred purpose
    textContent?: string; // First few words of text content
    baseStyles?: Record<string, string>; // Base (non-hover) styles for comparison
  };
}

export type JSAnimationLibrary =
  | 'gsap'
  | 'anime'
  | 'framer-motion'
  | 'lottie'
  | 'three'
  | 'unknown';

export interface JSAnimationPattern {
  librariesDetected: Array<{
    name: JSAnimationLibrary;
    confidence: number;
  }>;
  styleChanges: Array<{
    element: string; // selector or description
    properties: string[]; // CSS properties changed via JS
    frequency: 'continuous' | 'on-interaction' | 'on-load';
  }>;
  eventListeners: Array<{
    event: string; // 'click', 'scroll', etc.
    count: number;
  }>;
  animatedElements: number;
  hasComplexAnimations: boolean;
}

// ===== Behavioral Pattern System (NEW) =====

export interface ModeSwitcherPattern {
  type: 'mode-switcher';
  toggleElement: string; // Description of the button/control
  location: string; // Where it's located (navigation, etc.)
  inferredModes: string[]; // Possible modes (e.g., ['developer', 'founder'])
  currentMode: string; // Currently active mode
  evidence: string[]; // Evidence used to detect this pattern
  confidence: 'high' | 'medium' | 'low';
}

export interface ToggleButtonPattern {
  type: 'toggle-button';
  element: string; // Element description
  text: string; // Button text
  ariaExpanded: boolean | null; // Current expanded state
  location: string; // Context
}

export interface TabGroupPattern {
  type: 'tab-group';
  tabs: string[]; // Tab labels
  activeTab: string; // Currently active tab
  location: string; // Where this tab group is
}

export interface BehavioralPattern {
  modeSwitchers: ModeSwitcherPattern[];
  toggleButtons: ToggleButtonPattern[];
  tabGroups: TabGroupPattern[];
}

export interface InteractionPatternSystem {
  themeSwitchers: ThemeSwitcherPattern[];
  cssAnimations: CSSAnimationPattern;
  transforms: TransformPattern;
  interactiveStates: InteractiveStatePattern[];
  jsAnimations: JSAnimationPattern;
  behavioral: BehavioralPattern; // NEW!
}

// ===== Complete Analysis Result =====

export interface AnalysisResult {
  url: string;
  title: string;
  timestamp: number;
  elementCount: number;
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  shadows: ShadowSystem;
  borders: BorderSystem;
  components: DetectedComponent[];
  interactions: InteractionPatternSystem;
}

// ===== Generated Output =====

export interface ComponentSnippet {
  type: string;
  html: string;
  css: string;
}

export interface CodeSnippets {
  cssVariables: string;
  componentExamples: ComponentSnippet[];
  utilities: string;
}

export interface PromptDescription {
  overview: string;
  designSystem: {
    colors: string;
    typography: string;
    spacing: string;
    components: string;
    interactions: string;
  };
  patterns: string[];
}

export interface GeneratedPrompt {
  description: PromptDescription;
  codeSnippets: CodeSnippets;
  combined: string;
}

// ===== History =====

export interface AnalysisHistory {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  result: AnalysisResult;
}
