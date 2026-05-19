import type { SubtitleEntry, SubtitleMap } from '../types';

export type SubtitleCallback = (
  subtitle: SubtitleEntry,
  positionMsec: number,
  allSubtitles: SubtitleEntry[],
) => void;

let videoStartTimeMillis = 0;
let nextSubtitleTimeout: ReturnType<typeof setTimeout> | null = null;
let subtitles: SubtitleEntry[] = [];

function findNextSubtitle(pos: number): SubtitleEntry | null {
  // O(N) — acceptable for typical subtitle list sizes
  for (const subtitle of subtitles) {
    if (subtitle.time > pos) return subtitle;
  }
  return null;
}

export function play(pos: number, onSubtitle: SubtitleCallback): void {
  videoStartTimeMillis = Date.now() - pos;
  if (nextSubtitleTimeout) clearTimeout(nextSubtitleTimeout);
  nextSubtitleTimeout = null;

  const next = findNextSubtitle(pos);
  if (!next) return;

  const timeout = next.time - pos;
  nextSubtitleTimeout = setTimeout(() => {
    const now = Date.now();
    const newPos = now - videoStartTimeMillis;
    onSubtitle(next, newPos, subtitles);
    play(newPos, onSubtitle);
  }, timeout);
}

export function timeupdate(pos: number, onSubtitle: SubtitleCallback): void {
  if (!nextSubtitleTimeout) return; // not playing
  play(pos, onSubtitle);
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
  return Date.now() - videoStartTimeMillis;
}
