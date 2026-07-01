import type { SubtitleCallback } from '../subs/PlayerLogic';
import {
  getCurrentVideoPosition,
  play,
  setSubtitles,
  stop,
  timeupdate,
} from '../subs/PlayerLogic';

beforeEach(() => {
  jest.useFakeTimers();
  // Reset module state by calling stop and setSubtitles with empty map
  stop();
  setSubtitles({});
});

afterEach(() => {
  stop();
  jest.useRealTimers();
});

describe('setSubtitles', () => {
  it('converts subtitle map to sorted array (multiplies time by 1000)', () => {
    setSubtitles({ '2': 3, '1': 1 });
    // After setSubtitles, play at position 0 should schedule callback for
    // the first subtitle at 1000ms
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toEqual({ time: 1000, subtitle: 1 });
  });

  it('sorts subtitles by time ascending', () => {
    setSubtitles({ '5': 2, '1': 1, '3': 3 });
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(1000);
    expect(cb.mock.calls[0][0]).toEqual({ time: 1000, subtitle: 1 });
  });
});

describe('play', () => {
  it('fires callback at the correct timeout', () => {
    setSubtitles({ '1': 1 }); // subtitle at 1000ms
    const cb = jest.fn();
    play(0, cb);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toEqual({ time: 1000, subtitle: 1 });
  });

  it('fires callback with positionMsec close to the subtitle time', () => {
    setSubtitles({ '2': 3 }); // subtitle at 2000ms
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(2000);
    const [, positionMsec] = cb.mock.calls[0];
    // positionMsec is video position (ms from video start), not wall clock
    expect(positionMsec).toBeGreaterThanOrEqual(2000);
  });

  it('fires callback with all subtitles as third argument', () => {
    setSubtitles({ '1': 1, '2': 2 });
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(1000);
    const [, , allSubs] = cb.mock.calls[0];
    expect(allSubs).toEqual([
      { time: 1000, subtitle: 1 },
      { time: 2000, subtitle: 2 },
    ]);
  });

  it('does not fire when no subtitles are set', () => {
    setSubtitles({});
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(100000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not fire when position is past all subtitles', () => {
    setSubtitles({ '1': 1 }); // subtitle at 1000ms
    const cb = jest.fn();
    play(2000, cb); // start after all subtitles
    jest.advanceTimersByTime(100000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('clears previous timeout when called again', () => {
    setSubtitles({ '5': 1 }); // subtitle at 5000ms
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    play(0, cb1);
    play(0, cb2); // replaces previous
    jest.advanceTimersByTime(5000);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('auto-schedules the next subtitle recursively', () => {
    setSubtitles({ '1': 1, '2': 2 });
    const cb = jest.fn();
    play(0, cb);
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb.mock.calls[1][0]).toEqual({ time: 2000, subtitle: 2 });
  });
});

describe('stop', () => {
  it('cancels the scheduled callback', () => {
    setSubtitles({ '1': 1 });
    const cb = jest.fn();
    play(0, cb);
    stop();
    jest.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('can be called multiple times without throwing', () => {
    expect(() => {
      stop();
      stop();
    }).not.toThrow();
  });
});

describe('timeupdate', () => {
  it('does nothing when not playing', () => {
    setSubtitles({ '5': 1 });
    const cb = jest.fn();
    stop(); // ensure not playing
    timeupdate(0, cb);
    jest.advanceTimersByTime(10000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('re-schedules when playing (seeks to new position)', () => {
    setSubtitles({ '5': 1 }); // subtitle at 5000ms
    const cb = jest.fn();
    play(0, cb);
    // Seek to 4000ms — remaining time to subtitle is 1000ms
    timeupdate(4000, cb);
    jest.advanceTimersByTime(999);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('getCurrentVideoPosition', () => {
  it('returns approximately the play position after time passes', () => {
    setSubtitles({});
    play(1000, jest.fn()); // start at 1000ms position
    jest.advanceTimersByTime(500);
    const pos = getCurrentVideoPosition();
    // pos should be approx 1500ms
    expect(pos).toBeGreaterThanOrEqual(1500);
  });
});
