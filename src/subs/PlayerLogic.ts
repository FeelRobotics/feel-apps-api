import type { SubtitleEntry, SubtitleMap } from '../types';

export type SubtitleCallback = (
  subtitle: SubtitleEntry,
  positionMsec: number,
  allSubtitles: SubtitleEntry[],
) => void;

let videoStartedAt = 0;
let nextSubtitleTimeout: ReturnType<typeof setTimeout> | null = null;
let subtitles: SubtitleEntry[] = [];

function findNextSubtitle(positionMsec: number): SubtitleEntry | null {
  // O(N) — acceptable for typical subtitle list sizes
  for (const subtitle of subtitles) {
    if (subtitle.time > positionMsec) return subtitle;
  }
  return null;
}

export function play(positionMsec: number, onSubtitle: SubtitleCallback): void {
  videoStartedAt = Date.now() - positionMsec;
  if (nextSubtitleTimeout) clearTimeout(nextSubtitleTimeout);
  nextSubtitleTimeout = null;

  const next = findNextSubtitle(positionMsec);
  if (!next) return;

  const timeout = next.time - positionMsec;
  nextSubtitleTimeout = setTimeout(() => {
    const now = Date.now();
    const newPositionMsec = now - videoStartedAt;
    onSubtitle(next, newPositionMsec, subtitles);
    play(newPositionMsec, onSubtitle);
  }, timeout);
}

export function timeupdate(positionMsec: number, onSubtitle: SubtitleCallback): void {
  if (!nextSubtitleTimeout) return; // not playing
  play(positionMsec, onSubtitle);
}

export function stop(): void {
  if (nextSubtitleTimeout) clearTimeout(nextSubtitleTimeout);
  nextSubtitleTimeout = null;
}

/** Load subtitle map and convert to sorted array of SubtitleEntry */
export function setSubtitles(subtitleMap: SubtitleMap): void {
  subtitles = Object.entries(subtitleMap)
    .map(([time, subtitle]) => ({ time: Number(time) * 1000, subtitle }))
    .sort((a, b) => a.time - b.time);
}

export function getCurrentVideoPosition(): number {
  return Date.now() - videoStartedAt;
}
