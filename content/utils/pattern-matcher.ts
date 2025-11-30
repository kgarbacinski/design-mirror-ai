/**
 * Pattern Matcher - Utilities for detecting design patterns
 *
 * Features:
 * - Frequency analysis
 * - Clustering similar values
 * - Pattern recognition (modular scales, spacing systems, etc.)
 */

export interface FrequencyMap<T> {
  value: T;
  count: number;
  percentage: number;
}

/**
 * Analyze frequency of values
 */
export function analyzeFrequency<T>(
  values: T[],
  minCount: number = 2
): FrequencyMap<T>[] {
  const frequencyMap = new Map<T, number>();

  // Count occurrences
  for (const value of values) {
    frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
  }

  // Convert to array and filter
  const total = values.length;
  const results: FrequencyMap<T>[] = [];

  for (const [value, count] of frequencyMap.entries()) {
    if (count >= minCount) {
      results.push({
        value,
        count,
        percentage: (count / total) * 100
      });
    }
  }

  // Sort by count (descending)
  return results.sort((a, b) => b.count - a.count);
}

/**
 * Get most frequent value
 */
export function getMostFrequent<T>(values: T[]): T | null {
  const frequencies = analyzeFrequency(values, 1);
  return frequencies.length > 0 ? frequencies[0].value : null;
}

/**
 * Get N most frequent values
 */
export function getTopN<T>(values: T[], n: number): T[] {
  const frequencies = analyzeFrequency(values, 1);
  return frequencies.slice(0, n).map(f => f.value);
}

/**
 * Detect if values follow a modular scale
 * Returns ratio if found, null otherwise
 */
export function detectModularScale(
  values: number[],
  tolerance: number = 0.05
): { ratio: number; confidence: number } | null {
  if (values.length < 3) return null;

  const sortedValues = [...values].sort((a, b) => a - b);
  const commonRatios = [
    { name: 'Minor Second', value: 1.067 },
    { name: 'Major Second', value: 1.125 },
    { name: 'Minor Third', value: 1.2 },
    { name: 'Major Third', value: 1.25 },
    { name: 'Perfect Fourth', value: 1.333 },
    { name: 'Augmented Fourth', value: 1.414 },
    { name: 'Perfect Fifth', value: 1.5 },
    { name: 'Golden Ratio', value: 1.618 }
  ];

  let bestRatio = null;
  let bestScore = 0;

  for (const { value: ratio } of commonRatios) {
    let score = 0;

    for (let i = 0; i < sortedValues.length - 1; i++) {
      const actualRatio = sortedValues[i + 1] / sortedValues[i];
      const diff = Math.abs(actualRatio - ratio);

      if (diff < tolerance) {
        score++;
      }
    }

    const confidence = score / (sortedValues.length - 1);

    if (confidence > bestScore && confidence >= 0.5) {
      bestScore = confidence;
      bestRatio = ratio;
    }
  }

  return bestRatio ? { ratio: bestRatio, confidence: bestScore } : null;
}

/**
 * Detect base unit from a set of values
 * Useful for spacing systems (e.g., 4px, 8px base)
 */
export function detectBaseUnit(
  values: number[],
  candidates: number[] = [4, 8, 10, 16]
): number | null {
  const frequencies = new Map<number, number>();

  for (const candidate of candidates) {
    let score = 0;

    for (const value of values) {
      if (value % candidate === 0) {
        score++;
      }
    }

    frequencies.set(candidate, score);
  }

  // Find candidate with highest score
  let bestCandidate = null;
  let bestScore = 0;

  for (const [candidate, score] of frequencies.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  // Require at least 50% of values to be divisible by base unit
  const threshold = values.length * 0.5;
  return bestScore >= threshold ? bestCandidate : null;
}

/**
 * Group values by similarity
 */
export function groupBySimilarity<T>(
  values: T[],
  similarityFn: (a: T, b: T) => number,
  threshold: number = 0.1
): T[][] {
  const groups: T[][] = [];

  for (const value of values) {
    let addedToGroup = false;

    for (const group of groups) {
      const representative = group[0];
      const similarity = similarityFn(value, representative);

      if (similarity <= threshold) {
        group.push(value);
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      groups.push([value]);
    }
  }

  return groups;
}

/**
 * Calculate statistical measures
 */
export interface Stats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

export function calculateStats(values: number[]): Stats | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;

  const squaredDiffs = sorted.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    stdDev
  };
}

/**
 * Remove outliers using IQR method
 */
export function removeOutliers(
  values: number[],
  factor: number = 1.5
): number[] {
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - factor * iqr;
  const upperBound = q3 + factor * iqr;

  return values.filter(val => val >= lowerBound && val <= upperBound);
}

/**
 * Round to nearest step
 */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Normalize values to a range
 */
export function normalize(
  values: number[],
  min: number = 0,
  max: number = 1
): number[] {
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const range = valueMax - valueMin;

  if (range === 0) return values.map(() => min);

  return values.map(val => {
    const normalized = (val - valueMin) / range;
    return min + normalized * (max - min);
  });
}

export default {
  analyzeFrequency,
  getMostFrequent,
  getTopN,
  detectModularScale,
  detectBaseUnit,
  groupBySimilarity,
  calculateStats,
  removeOutliers,
  roundToStep,
  normalize
};
