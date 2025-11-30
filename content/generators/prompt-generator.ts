/**
 * Prompt Generator - Natural Language Descriptions
 *
 * Generates human-readable descriptions of design systems
 * for AI consumption
 */

import type {
  AnalysisResult,
  PromptDescription,
  ColorPalette,
  TypographySystem,
  SpacingSystem,
  DetectedComponent
} from '@shared/types/design-system.types';

export class PromptGenerator {
  /**
   * Generate complete prompt description
   */
  generate(analysis: AnalysisResult): PromptDescription {
    return {
      overview: this.generateOverview(analysis),
      designSystem: {
        colors: this.describeColors(analysis.colors),
        typography: this.describeTypography(analysis.typography),
        spacing: this.describeSpacing(analysis.spacing),
        components: this.describeComponents(analysis.components)
      },
      patterns: this.identifyPatterns(analysis)
    };
  }

  /**
   * Generate overview
   */
  private generateOverview(analysis: AnalysisResult): string {
    const { url, title, elementCount } = analysis;

    let overview = `Analysis of "${title}" (${url})\n\n`;
    overview += `This design system was extracted from a page with ${elementCount} visible elements. `;

    // Describe overall style
    const primaryColor = analysis.colors.primary?.centroid.hex;
    const fontFamily = analysis.typography.primaryFont?.name;

    if (primaryColor && fontFamily) {
      overview += `The site uses ${fontFamily} as its primary typeface with ${primaryColor} as the primary brand color. `;
    }

    // Spacing approach
    if (analysis.spacing.baseUnit) {
      overview += `The spacing system follows a ${analysis.spacing.baseUnit}px base unit. `;
    }

    return overview;
  }

  /**
   * Describe color system
   */
  private describeColors(colors: ColorPalette): string {
    let desc = `## Color Palette\n\n`;

    if (colors.primary) {
      desc += `**Primary Color**: ${colors.primary.centroid.hex}\n`;
      desc += `- Used ${colors.primary.totalCount} times across the site\n`;
      desc += `- Usage: ${Array.from(colors.primary.centroid.usages).join(', ')}\n\n`;
    }

    if (colors.secondary) {
      desc += `**Secondary Color**: ${colors.secondary.centroid.hex}\n`;
      desc += `- Complementary color used ${colors.secondary.totalCount} times\n\n`;
    }

    if (colors.accent.length > 0) {
      desc += `**Accent Colors**: ${colors.accent.map(c => c.centroid.hex).join(', ')}\n\n`;
    }

    if (colors.neutrals.length > 0) {
      desc += `**Neutral Palette** (${colors.neutrals.length} shades):\n`;
      const neutralHexes = colors.neutrals.map(c => c.centroid.hex).slice(0, 8);
      desc += neutralHexes.join(', ');
      if (colors.neutrals.length > 8) {
        desc += ` (and ${colors.neutrals.length - 8} more)`;
      }
      desc += `\n\n`;
    }

    // Semantic colors
    const semantic = colors.semantic;
    if (semantic.error || semantic.success || semantic.warning || semantic.info) {
      desc += `**Semantic Colors**:\n`;
      if (semantic.error) desc += `- Error: ${semantic.error.centroid.hex}\n`;
      if (semantic.success) desc += `- Success: ${semantic.success.centroid.hex}\n`;
      if (semantic.warning) desc += `- Warning: ${semantic.warning.centroid.hex}\n`;
      if (semantic.info) desc += `- Info: ${semantic.info.centroid.hex}\n`;
      desc += `\n`;
    }

    // CSS Variables
    if (colors.cssVariables.length > 0) {
      desc += `**Note**: Found ${colors.cssVariables.length} CSS custom properties (variables) for colors.\n\n`;
    }

    return desc;
  }

  /**
   * Describe typography system
   */
  private describeTypography(typography: TypographySystem): string {
    let desc = `## Typography\n\n`;

    if (typography.primaryFont) {
      desc += `**Primary Font**: ${typography.primaryFont.name}\n`;
      desc += `- Used ${typography.primaryFont.count} times\n\n`;
    }

    if (typography.secondaryFont) {
      desc += `**Secondary Font**: ${typography.secondaryFont.name}\n`;
      desc += `- Used ${typography.secondaryFont.count} times\n\n`;
    }

    // Type scale
    if (typography.fontScale) {
      const scale = typography.fontScale;

      if (scale.modularScaleRatio) {
        desc += `**Type Scale**: Follows a modular scale with ratio **${scale.modularScaleRatio}** `;
        desc += `(${this.getRatioName(scale.modularScaleRatio)})\n\n`;
      }

      desc += `**Font Sizes**:\n`;
      if (scale.xs) desc += `- XS: ${scale.xs}\n`;
      if (scale.sm) desc += `- Small: ${scale.sm}\n`;
      if (scale.base) desc += `- Base (body text): ${scale.base}\n`;
      if (scale.lg) desc += `- Large: ${scale.lg}\n`;
      if (scale.xl) desc += `- XL: ${scale.xl}\n`;
      if (scale['2xl']) desc += `- 2XL: ${scale['2xl']}\n`;
      if (scale['3xl']) desc += `- 3XL: ${scale['3xl']}\n`;
      if (scale['4xl']) desc += `- 4XL: ${scale['4xl']}\n`;
      desc += `\n`;
    }

    // Headings
    if (Object.keys(typography.headings).length > 0) {
      desc += `**Heading Styles**:\n`;
      for (const [tag, styles] of Object.entries(typography.headings)) {
        desc += `- ${tag}: ${styles.fontSize}, weight: ${styles.fontWeight}`;
        if (styles.lineHeight && styles.lineHeight !== 'normal') {
          desc += `, line-height: ${styles.lineHeight}`;
        }
        desc += `\n`;
      }
      desc += `\n`;
    }

    // Font weights
    if (typography.weights.length > 0) {
      desc += `**Font Weights Used**: ${typography.weights.join(', ')}\n\n`;
    }

    return desc;
  }

  /**
   * Describe spacing system
   */
  private describeSpacing(spacing: SpacingSystem): string {
    let desc = `## Spacing System\n\n`;

    desc += `**Base Unit**: ${spacing.baseUnit}px\n\n`;

    if (Object.keys(spacing.scale).length > 0) {
      desc += `**Spacing Scale**:\n`;
      for (const [name, value] of Object.entries(spacing.scale)) {
        const multiplier = parseInt(value) / spacing.baseUnit;
        desc += `- ${name}: ${value} (${multiplier}x base unit)\n`;
      }
      desc += `\n`;
    }

    // Most common values
    if (spacing.allValues.length > 0) {
      const top5 = spacing.allValues.slice(0, 5);
      desc += `**Most Frequently Used Spacing Values**:\n`;
      for (const [value, info] of top5) {
        desc += `- ${value}px: used ${info.count} times for ${Array.from(info.usages).join(', ')}\n`;
      }
      desc += `\n`;
    }

    return desc;
  }

  /**
   * Describe components
   */
  private describeComponents(components: DetectedComponent[]): string {
    if (components.length === 0) {
      return `## Components\n\nNo components detected.\n\n`;
    }

    let desc = `## UI Components\n\n`;
    desc += `Detected ${components.length} UI components:\n\n`;

    // Group by type
    const grouped = this.groupByType(components);

    for (const [type, instances] of Object.entries(grouped)) {
      desc += `**${this.capitalize(type)}** (${instances.length} found)\n`;

      // Variations
      const variations = this.extractVariations(instances);
      if (variations.length > 0) {
        desc += `- Variations: ${variations.join(', ')}\n`;
      }

      // Common styles
      const commonStyles = this.extractCommonStyles(instances);
      if (commonStyles) {
        desc += `- Common styles: ${commonStyles}\n`;
      }

      desc += `\n`;
    }

    return desc;
  }

  /**
   * Identify design patterns
   */
  private identifyPatterns(analysis: AnalysisResult): string[] {
    const patterns: string[] = [];

    // Check for modular scale
    if (analysis.typography.fontScale.modularScaleRatio) {
      patterns.push(
        `Uses modular typography scale (ratio: ${analysis.typography.fontScale.modularScaleRatio})`
      );
    }

    // Check for consistent spacing
    if (analysis.spacing.baseUnit) {
      patterns.push(
        `Follows ${analysis.spacing.baseUnit}px spacing system (consistent multiples)`
      );
    }

    // Check for design tokens (CSS variables)
    if (analysis.colors.cssVariables.length > 5) {
      patterns.push(
        `Uses CSS custom properties (design tokens) - ${analysis.colors.cssVariables.length} color variables`
      );
    }

    // Check for semantic colors
    const { semantic } = analysis.colors;
    if (semantic.error && semantic.success) {
      patterns.push(`Implements semantic color system (success, error, warning, info)`);
    }

    // Check for component variations
    const hasVariations = analysis.components.some(c => c.variations.length > 0);
    if (hasVariations) {
      patterns.push(`Components use size/variant variations (sm, md, lg, primary, secondary)`);
    }

    return patterns;
  }

  /**
   * Get modular scale ratio name
   */
  private getRatioName(ratio: number): string {
    const ratios: Record<number, string> = {
      1.067: 'Minor Second',
      1.125: 'Major Second',
      1.2: 'Minor Third',
      1.25: 'Major Third',
      1.333: 'Perfect Fourth',
      1.414: 'Augmented Fourth',
      1.5: 'Perfect Fifth',
      1.618: 'Golden Ratio'
    };

    // Find closest match
    let closest = 1.125;
    let minDiff = Infinity;

    for (const [r, name] of Object.entries(ratios)) {
      const diff = Math.abs(parseFloat(r) - ratio);
      if (diff < minDiff) {
        minDiff = diff;
        closest = parseFloat(r);
      }
    }

    return ratios[closest] || 'Custom';
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
   * Extract variations from components
   */
  private extractVariations(components: DetectedComponent[]): string[] {
    const variations = new Set<string>();

    for (const component of components) {
      for (const variation of component.variations) {
        variations.add(variation.value);
      }
    }

    return Array.from(variations);
  }

  /**
   * Extract common styles
   */
  private extractCommonStyles(components: DetectedComponent[]): string | null {
    if (components.length === 0) return null;

    const first = components[0].styles;
    const parts: string[] = [];

    if (first.borders.borderRadius && first.borders.borderRadius !== '0px') {
      parts.push(`border-radius: ${first.borders.borderRadius}`);
    }

    if (first.spacing.padding) {
      parts.push(`padding: ${first.spacing.padding}`);
    }

    return parts.length > 0 ? parts.join(', ') : null;
  }

  /**
   * Capitalize string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default PromptGenerator;
