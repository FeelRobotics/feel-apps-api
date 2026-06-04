// Subs.ts has non-resettable module-level state.
// Each test gets a fresh module via jest.resetModules() + jest.doMock().

import type * as SubsType from '../subs/Subs';

const mockPlayerPlay = jest.fn();
const mockPlayerStop = jest.fn();
const mockPlayerTimeupdate = jest.fn();
const mockPlayerSetSubtitles = jest.fn();
const mockPlayerGetPos = jest.fn(() => 0);
const mockWasConnected = jest.fn(() => false);
const mockOnDeviceConnected = jest.fn();
const mockBillingPlay = jest.fn();
const mockLoggerStart = jest.fn();
const mockLoggerEnd = jest.fn();
const mockLoggerDevicesChanged = jest.fn();
const mockLoaderLoad = jest.fn();

function fresh(deviceConnected = false): typeof SubsType {
  jest.resetModules();
  mockWasConnected.mockReturnValue(deviceConnected);
  jest.doMock('../subs/PlayerLogic', () => ({
    play: mockPlayerPlay,
    stop: mockPlayerStop,
    timeupdate: mockPlayerTimeupdate,
    setSubtitles: mockPlayerSetSubtitles,
    getCurrentVideoPosition: mockPlayerGetPos,
  }));
  jest.doMock('../DeviceWatch', () => ({
    wasDeviceConnected: mockWasConnected,
    onDeviceConnected: mockOnDeviceConnected,
  }));
  jest.doMock('../subs/BillingSession', () => ({ play: mockBillingPlay }));
  jest.doMock('../subs/Logger', () => ({
    init: jest.fn(),
    startInterval: mockLoggerStart,
    endInterval: mockLoggerEnd,
    devicesChanged: mockLoggerDevicesChanged,
    setSessionId: jest.fn(),
  }));
  jest.doMock('../subs/Loader', () => ({
    init: jest.fn(),
    loadSubtitlesInfo: mockLoaderLoad,
    setClientId: jest.fn(),
  }));
  jest.doMock('../subs/Parser', () => ({ parse: jest.fn(() => ({})) }));
  return require('../subs/Subs') as typeof SubsType;
}

const settings = { apiUrl: '', apptoken: '', clientId: '' };

beforeEach(() => jest.clearAllMocks());

// ─── seek detection ────────────────────────────────────────────────────────

describe('handleVideoSeekEvent — seek detection (SEEK_DISTANCE = 2s)', () => {
  it('does not treat a small jump as a seek', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);             // previousPos = 0
    mockPlayerStop.mockClear();
    Subs.timeupdate(1.5);     // 1.5s jump — under threshold
    expect(mockPlayerStop).not.toHaveBeenCalled();
  });

  it('detects a jump > 2s as a seek and stops + restarts', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);
    mockPlayerStop.mockClear();
    mockPlayerPlay.mockClear();
    Subs.timeupdate(5.0);     // 5s jump — above threshold
    expect(mockPlayerStop).toHaveBeenCalled();
    expect(mockPlayerPlay).toHaveBeenCalled();
  });

  it('does not restart play on seek when was not playing', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    // do NOT call play() — playing stays false
    mockPlayerPlay.mockClear();
    Subs.timeupdate(5.0);     // seek detected, but wasPlaying = false
    expect(mockPlayerPlay).not.toHaveBeenCalled();
  });

  it('detects seek at exactly 2s boundary (> not >=)', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);
    mockPlayerStop.mockClear();
    Subs.timeupdate(2.0);     // exactly 2.0 — NOT a seek (> 2.0 required)
    expect(mockPlayerStop).not.toHaveBeenCalled();
  });

  it('detects seek just above 2s', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);
    mockPlayerStop.mockClear();
    Subs.timeupdate(2.001);   // just above 2s — IS a seek
    expect(mockPlayerStop).toHaveBeenCalled();
  });
});

// ─── watchdog timer ────────────────────────────────────────────────────────

describe('timeupdate — buffering watchdog', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sets a 1s watchdog on each timeupdate while playing', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);
    Subs.timeupdate(0.1);
    jest.advanceTimersByTime(1000);
    expect(mockPlayerStop).toHaveBeenCalled();
  });

  it('watchdog does not fire if timeupdate keeps arriving', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    Subs.play(0);
    mockPlayerStop.mockClear();
    Subs.timeupdate(0.1);
    jest.advanceTimersByTime(500);
    Subs.timeupdate(0.6);     // resets watchdog
    jest.advanceTimersByTime(500);
    expect(mockPlayerStop).not.toHaveBeenCalled();
  });
});

// ─── subtitle intensity scaling ────────────────────────────────────────────

describe('subtitleCallback — intensity scaling (subtitle × 25)', () => {
  it('emits 0% for subtitle value 0', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    Subs.play(0);
    // trigger the internal subtitleCallback by getting PlayerLogic.play's callback
    const cb = mockPlayerPlay.mock.calls[0][1];
    cb({ time: 0, subtitle: 0 }, 0, []);
    expect(onPlay).toHaveBeenCalledWith(0, 0, []);
  });

  it('emits 100% for subtitle value 4', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    Subs.play(0);
    const cb = mockPlayerPlay.mock.calls[0][1];
    cb({ time: 1000, subtitle: 4 }, 1000, []);
    expect(onPlay).toHaveBeenCalledWith(100, 1000, []);
  });

  it('emits 50% for subtitle value 2', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    Subs.play(0);
    const cb = mockPlayerPlay.mock.calls[0][1];
    cb({ time: 500, subtitle: 2 }, 500, []);
    expect(onPlay).toHaveBeenCalledWith(50, 500, []);
  });

  it('clamps above-range subtitle value to 100%', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    Subs.play(0);
    const cb = mockPlayerPlay.mock.calls[0][1];
    cb({ time: 0, subtitle: 5 }, 0, []);
    expect(onPlay).toHaveBeenCalledWith(100, 0, []);
  });

  it('clamps below-range subtitle value to 0%', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    Subs.play(0);
    const cb = mockPlayerPlay.mock.calls[0][1];
    cb({ time: 0, subtitle: -1 }, 0, []);
    expect(onPlay).toHaveBeenCalledWith(0, 0, []);
  });
});

// ─── guards ────────────────────────────────────────────────────────────────

describe('checkInitialized guard', () => {
  it('throws when play() called before init() with device connected', () => {
    const Subs = fresh(true);
    expect(() => Subs.play(0)).toThrow('$feel.init');
  });

  it('does not throw when device is not connected', () => {
    const Subs = fresh(false);
    expect(() => Subs.play(0)).not.toThrow();
  });
});

// ─── onSubtitleEvent ───────────────────────────────────────────────────────

describe('onSubtitleEvent / offSubtitleEvent', () => {
  it('fires registered callback with percent value', () => {
    const Subs = fresh(true);
    const onPlay = jest.fn();
    Subs.init(settings, onPlay);
    const cb = jest.fn();
    Subs.onSubtitleEvent(cb);
    Subs.play(0);
    const subtitleCb = mockPlayerPlay.mock.calls[0][1];
    subtitleCb({ time: 0, subtitle: 3 }, 0, []);
    expect(cb).toHaveBeenCalledWith(75);
  });

  it('does not fire after offSubtitleEvent', () => {
    const Subs = fresh(true);
    Subs.init(settings, jest.fn());
    const cb = jest.fn();
    Subs.onSubtitleEvent(cb);
    Subs.offSubtitleEvent(cb);
    Subs.play(0);
    const subtitleCb = mockPlayerPlay.mock.calls[0][1];
    subtitleCb({ time: 0, subtitle: 3 }, 0, []);
    expect(cb).not.toHaveBeenCalled();
  });
});
