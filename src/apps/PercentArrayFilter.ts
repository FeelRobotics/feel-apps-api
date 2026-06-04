import type { QueuedValue } from './MessageQueue';

/**
 * Remove intermediate values from an array, keeping only extremes (peaks and valleys).
 *
 * e.g. [0, 50, 100, 75, 50, 75, 100] → [0, 100, 50, 100]
 */
export function filterIntermediateValues(values: QueuedValue[]): QueuedValue[] {
  if (values.length <= 1) return values;

  const result: QueuedValue[] = [values[0]];

  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const current = values[i];
    const next = values[i + 1];
    const monotone =
      (prev.value <= current.value && current.value <= next.value) ||
      (prev.value >= current.value && current.value >= next.value);
    if (!monotone) result.push(current);
  }

  result.push(values[values.length - 1]);
  return result;
}
