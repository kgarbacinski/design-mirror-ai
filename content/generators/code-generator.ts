/**
 * Code Generator - CSS Variables & HTML/CSS Snippets
 *
 * Generates ready-to-use code from design system analysis
 */

import type {
  AnalysisResult,
  CodeSnippets,
  ComponentSnippet,
  DetectedComponent
} from '@shared/types/design-system.types';

export class CodeGenerator {
  /**
   * Generate all code snippets
   */
  generate(analysis: AnalysisResult): CodeSnippets {
    return {
      cssVariables: this.generateCSSVariables(analysis),
      componentExamples: this.generateComponentExamples(analysis.components),
      utilities: this.generateUtilityClasses(analysis)
    };
  }

  /**
   * Generate CSS custom properties (design tokens)
   */
  private generateCSSVariables(analysis: AnalysisResult): string {
    let css = `:root {\n`;

    css += `  /* ===== Colors ===== */\n`;

    if (analysis.colors.primary) {
      css += `  --color-primary: ${analysis.colors.primary.centroid.hex};\n`;
    }

    if (analysis.colors.secondary) {
      css += `  --color-secondary: ${analysis.colors.secondary.centroid.hex};\n`;
    }

    analysis.colors.accent.forEach((accent, i) => {
      css += `  --color-accent-${i + 1}: ${accent.centroid.hex};\n`;
    });

    if (analysis.colors.neutrals.length > 0) {
      css += `\n  /* Neutrals */\n`;
      analysis.colors.neutrals.forEach((neutral, i) => {
        const step = (i + 1) * 100;
        css += `  --color-neutral-${step}: ${neutral.centroid.hex};\n`;
      });
    }

    const { semantic } = analysis.colors;
    if (semantic.error || semantic.success || semantic.warning || semantic.info) {
      css += `\n  /* Semantic */\n`;
      if (semantic.error) css += `  --color-error: ${semantic.error.centroid.hex};\n`;
      if (semantic.success) css += `  --color-success: ${semantic.success.centroid.hex};\n`;
      if (semantic.warning) css += `  --color-warning: ${semantic.warning.centroid.hex};\n`;
      if (semantic.info) css += `  --color-info: ${semantic.info.centroid.hex};\n`;
    }

    css += `\n  /* ===== Typography ===== */\n`;

    if (analysis.typography.primaryFont) {
      css += `  --font-primary: ${analysis.typography.primaryFont.name};\n`;
    }

    if (analysis.typography.secondaryFont) {
      css += `  --font-secondary: ${analysis.typography.secondaryFont.name};\n`;
    }

    const scale = analysis.typography.fontScale;
    if (scale.base) {
      css += `\n  /* Font sizes */\n`;
      if (scale.xs) css += `  --font-size-xs: ${scale.xs};\n`;
      if (scale.sm) css += `  --font-size-sm: ${scale.sm};\n`;
      css += `  --font-size-base: ${scale.base};\n`;
      if (scale.lg) css += `  --font-size-lg: ${scale.lg};\n`;
      if (scale.xl) css += `  --font-size-xl: ${scale.xl};\n`;
      if (scale['2xl']) css += `  --font-size-2xl: ${scale['2xl']};\n`;
      if (scale['3xl']) css += `  --font-size-3xl: ${scale['3xl']};\n`;
      if (scale['4xl']) css += `  --font-size-4xl: ${scale['4xl']};\n`;
    }

    if (analysis.typography.weights.length > 0) {
      css += `\n  /* Font weights */\n`;
      const weights = analysis.typography.weights;
      if (weights.includes(300)) css += `  --font-weight-light: 300;\n`;
      if (weights.includes(400)) css += `  --font-weight-normal: 400;\n`;
      if (weights.includes(500)) css += `  --font-weight-medium: 500;\n`;
      if (weights.includes(600)) css += `  --font-weight-semibold: 600;\n`;
      if (weights.includes(700)) css += `  --font-weight-bold: 700;\n`;
    }

    css += `\n  /* ===== Spacing ===== */\n`;
    css += `  --spacing-unit: ${analysis.spacing.baseUnit}px;\n`;

    for (const [name, value] of Object.entries(analysis.spacing.scale)) {
      css += `  --spacing-${name}: ${value};\n`;
    }

    if (analysis.shadows.common.length > 0) {
      css += `\n  /* ===== Shadows ===== */\n`;
      analysis.shadows.common.slice(0, 5).forEach((shadow, i) => {
        css += `  --shadow-${i + 1}: ${shadow.value};\n`;
      });
    }

    if (analysis.borders.radii.length > 0) {
      css += `\n  /* ===== Border Radius ===== */\n`;
      analysis.borders.radii.slice(0, 5).forEach((radius, i) => {
        css += `  --radius-${i + 1}: ${radius.value};\n`;
      });
    }

    if (analysis.interactions.cssAnimations.transitions.length > 0) {
      css += `\n  /* ===== Transitions ===== */\n`;
      const topTransitions = analysis.interactions.cssAnimations.transitions.slice(0, 3);
      topTransitions.forEach((t, i) => {
        css += `  --transition-${i + 1}: ${t.property} ${t.duration} ${t.timingFunction};\n`;
      });
    }

    css += `}\n`;

    return css;
  }

  /**
   * Generate component examples
   */
  private generateComponentExamples(components: DetectedComponent[]): ComponentSnippet[] {
    const examples: ComponentSnippet[] = [];
    const grouped = this.groupByType(components);

    for (const [type, instances] of Object.entries(grouped)) {
      const representative = instances.sort((a, b) => b.confidence - a.confidence)[0];

      examples.push({
        type,
        html: this.generateHTMLExample(representative),
        css: this.generateCSSExample(representative)
      });
    }

    return examples;
  }

  /**
   * Generate HTML example
   */
  private generateHTMLExample(component: DetectedComponent): string {
    const tag = component.element.tagName.toLowerCase();
    const classes = this.extractCleanClasses(component.element);
    const content = this.getExampleContent(component.type);

    if (tag === 'input' || tag === 'img') {
      return `<${tag}${classes ? ` class="${classes}"` : ''} />`;
    }

    return `<${tag}${classes ? ` class="${classes}"` : ''}>${content}</${tag}>`;
  }

  /**
   * Generate CSS example
   */
  private generateCSSExample(component: DetectedComponent): string {
    const className = this.extractCleanClasses(component.element).split(' ')[0];
    if (!className) return '';

    const s = component.styles;
    let css = `.${className} {\n`;

    if (s.layout.display) css += `  display: ${s.layout.display};\n`;

    if (s.spacing.padding) css += `  padding: ${s.spacing.padding};\n`;
    if (s.spacing.margin && s.spacing.margin !== '0px') {
      css += `  margin: ${s.spacing.margin};\n`;
    }

    if (s.colors.color && s.colors.color !== 'rgb(0, 0, 0)') {
      css += `  color: ${s.colors.color};\n`;
    }
    if (s.colors.backgroundColor && s.colors.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      css += `  background-color: ${s.colors.backgroundColor};\n`;
    }

    if (s.typography.fontSize) css += `  font-size: ${s.typography.fontSize};\n`;
    if (s.typography.fontWeight && s.typography.fontWeight !== '400') {
      css += `  font-weight: ${s.typography.fontWeight};\n`;
    }

    if (s.borders.borderRadius && s.borders.borderRadius !== '0px') {
      css += `  border-radius: ${s.borders.borderRadius};\n`;
    }
    if (s.borders.borderWidth && s.borders.borderWidth !== '0px') {
      css += `  border: ${s.borders.borderWidth} ${s.borders.borderStyle} ${s.colors.borderColor};\n`;
    }

    if (s.shadows.boxShadow && s.shadows.boxShadow !== 'none') {
      css += `  box-shadow: ${s.shadows.boxShadow};\n`;
    }

    css += `}\n`;

    return css;
  }

  /**
   * Generate utility classes
   */
  private generateUtilityClasses(analysis: AnalysisResult): string {
    let css = `/* Utility Classes */\n\n`;

    css += `/* Spacing */\n`;
    for (const [name, value] of Object.entries(analysis.spacing.scale)) {
      css += `.p-${name} { padding: ${value}; }\n`;
      css += `.m-${name} { margin: ${value}; }\n`;
    }

    css += `\n/* Text sizes */\n`;
    const scale = analysis.typography.fontScale;
    if (scale.xs) css += `.text-xs { font-size: ${scale.xs}; }\n`;
    if (scale.sm) css += `.text-sm { font-size: ${scale.sm}; }\n`;
    if (scale.base) css += `.text-base { font-size: ${scale.base}; }\n`;
    if (scale.lg) css += `.text-lg { font-size: ${scale.lg}; }\n`;
    if (scale.xl) css += `.text-xl { font-size: ${scale.xl}; }\n`;

    return css;
  }

  /**
   * Group components by type
   */
  private groupByType(components: DetectedComponent[]): Record<string, DetectedComponent[]> {
    const grouped: Record<string, DetectedComponent[]> = {};

    for (const component of components) {
      if (!grouped[component.type]) {
        grouped[component.type] = [];
      }
      grouped[component.type].push(component);
    }

    return grouped;
  }

  /**
   * Extract clean class names (remove JS classes, etc.)
   */
  private extractCleanClasses(element: Element): string {
    return element.className
      .toString()
      .split(' ')
      .filter(c => c && !c.startsWith('js-') && !c.startsWith('_'))
      .slice(0, 3) // Max 3 classes
      .join(' ');
  }

  /**
   * Get example content for component type
   */
  private getExampleContent(type: string): string {
    const content: Record<string, string> = {
      button: 'Click me',
      card: 'Card content',
      badge: 'Badge',
      navigation: 'Nav item',
      form: 'Form fields',
      input: '',
      modal: 'Modal content',
      table: 'Table data',
      tooltip: 'Tooltip text'
    };

    return content[type] || 'Content';
  }
}

export default CodeGenerator;
