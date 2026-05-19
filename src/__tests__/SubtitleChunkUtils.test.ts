import { getNextSubtitles } from '../apps/SubtitleChunkUtils';
import type { SubtitleEntry } from '../types';

function entry(time: number, subtitle = 1): SubtitleEntry {
  return { time, subtitle };
}

describe('getNextSubtitles', () => {
  const subtitles = [
    entry(0),
    entry(1000),
    entry(5000),
    entry(10000),
    entry(15000),
  ];

  it('returns [] when no subtitle is at or before positionMsec', () => {
    // All subs start after t=0, so when positionMsec=0 firstIndex stays -1
    const subs = [entry(500), entry(1000)];
    expect(getNextSubtitles(subs, 0, 10000)).toEqual([]);
  });

  it('returns [] for empty subtitles array', () => {
    expect(getNextSubtitles([], 5000, 10000)).toEqual([]);
  });

  it('returns slice starting from last subtitle at or before position', () => {
    // positionMsec=1000: firstIndex=1 (time=1000 <= 1000)
    // positionMsec+duration=11000: lastIndex=3 (time=10000 <= 11000)
    const result = getNextSubtitles(subtitles, 1000, 10000);
    expect(result).toEqual([entry(1000), entry(5000), entry(10000)]);
  });

  it('returns single entry when window only covers one subtitle', () => {
    // positionMsec=10000, duration=1000: window [10000, 11000]
    // firstIndex=3 (time=10000), lastIndex=3 (time=10000 <= 11000)
    const result = getNextSubtitles(subtitles, 10000, 1000);
    expect(result).toEqual([entry(10000)]);
  });

  it('returns all subtitles when window covers everything', () => {
    const result = getNextSubtitles(subtitles, 0, 100000);
    expect(result).toEqual(subtitles);
  });

  it('includes subtitle exactly at positionMsec', () => {
    const subs = [entry(0), entry(5000)];
    // positionMsec=0: firstIndex=0 (time=0<=0)
    // lastIndex=0 if duration=2000 (time=5000>2000), so slice [0,1)
    const result = getNextSubtitles(subs, 0, 2000);
    expect(result).toEqual([entry(0)]);
  });

  it('includes subtitle exactly at positionMsec + durationMsec', () => {
    const subs = [entry(0), entry(5000), entry(10000)];
    // positionMsec=0, duration=10000: lastIndex=2 (time=10000<=10000)
    const result = getNextSubtitles(subs, 0, 10000);
    expect(result).toEqual([entry(0), entry(5000), entry(10000)]);
  });

  it('returns [] when positionMsec is before all subtitles', () => {
    const subs = [entry(1000), entry(2000)];
    expect(getNextSubtitles(subs, 500, 200)).toEqual([]);
  });

  it('handles subtitle exactly at position with no subtitle before it', () => {
    const subs = [entry(1000), entry(2000)];
    // positionMsec=1000: firstIndex=0, lastIndex=0 (duration=0)
    const result = getNextSubtitles(subs, 1000, 0);
    expect(result).toEqual([entry(1000)]);
  });
});
