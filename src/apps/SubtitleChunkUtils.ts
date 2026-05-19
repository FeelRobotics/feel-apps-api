import type { SubtitleEntry } from '../types';

/**
 * Return the slice of subtitles that fall within [positionMsec, positionMsec + durationMsec].
 */
export function getNextSubtitles(
  subtitles: SubtitleEntry[],
  positionMsec: number,
  durationMsec: number,
): SubtitleEntry[] {
  let firstIndex = -1;
  let lastIndex = -1;

  for (let i = 0; i < subtitles.length; i++) {
    const time = subtitles[i].time;
    if (time <= positionMsec) firstIndex = i;
    if (time <= positionMsec + durationMsec) lastIndex = i;
  }

  return firstIndex >= 0 && lastIndex >= 0
    ? subtitles.slice(firstIndex, lastIndex + 1)
    : [];
}
