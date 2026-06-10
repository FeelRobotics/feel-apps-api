import type { SubtitleMap } from '../types';

/**
 * Parse a subtitle string into a subtitle map.
 * Handles both strict JSON and "relaxed" JSON (unquoted keys).
 *
 * Input:  '{"1.2": 1, "2": 4, "5.234": 0}'  or  '{1.2: 1, 2: 4, 5.234: 0}'
 * Output: { "1.2": 1, "2": 4, "5.234": 0 }
 */
export function parse(subtitleString: string): SubtitleMap {
  const corrected = subtitleString
    .replace(/\s/g, '')
    .replace(/(['"])?([a-zA-Z0-9_.]+)(['"])?:/g, '"$2": ');
  try {
    return JSON.parse(corrected) as SubtitleMap;
  } catch {
    throw new Error(`Failed to parse subtitle data: ${corrected.slice(0, 60)}`);
  }
}
