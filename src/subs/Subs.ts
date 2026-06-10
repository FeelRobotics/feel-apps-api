import * as DeviceWatch from '../DeviceWatch';
import * as debug from '../debug';
import type { SubsSettings, SubtitleEntry } from '../types';
import * as BillingSession from './BillingSession';
import * as Loader from './Loader';
import * as Parser from './Parser';
import type { SubtitleCallback } from './PlayerLogic';
import * as PlayerLogic from './PlayerLogic';

type SubtitleEventCallback = (percentValue: number) => void;
type PlaySubtitleFn = (
  percentValue: number,
  positionMsec: number,
  subtitles: SubtitleEntry[],
) => void;

const subtitleCallbacks: SubtitleEventCallback[] = [];

let initialized = false;
let onSubtitle: PlaySubtitleFn | null = null;
let loadGeneration = 0;
let watchDogTimeout: ReturnType<typeof setTimeout> | null = null;
let isBuffering = false;
let isPlaying = false;
let previousPosSec = 0;
const SEEK_DISTANCE = 2.0; // seconds

function emitSubtitleEvent(percentValue: number): void {
  subtitleCallbacks.forEach((callback) => {
    callback(percentValue);
  });
}

const subtitleCallback: SubtitleCallback = (
  subtitleEntry,
  positionMsec,
  subtitles,
) => {
  const percentValue = Math.max(0, Math.min(100, subtitleEntry.subtitle * 25));
  emitSubtitleEvent(percentValue);
  onSubtitle?.(percentValue, positionMsec, subtitles);
};

function resetDevice(): void {
  subtitleCallback({ time: 0, subtitle: 0 }, 0, []);
}

function handleVideoSeekEvent(currentPosSec: number): boolean {
  if (Math.abs(currentPosSec - previousPosSec) > SEEK_DISTANCE) {
    const wasPlaying = isPlaying;
    stop();
    if (wasPlaying) play(currentPosSec);
    previousPosSec = currentPosSec;
    return true;
  }
  previousPosSec = currentPosSec;
  return false;
}

function checkInitialized(): void {
  if (!initialized) {
    throw new Error('Please call $feel.init before loading/isPlaying subtitles');
  }
}

export function play(currentPosSec: number): void {
  if (DeviceWatch.wasDeviceConnected()) {
    checkInitialized();
    const positionMsec = Math.floor(currentPosSec * 1000);
    PlayerLogic.play(positionMsec, subtitleCallback);
    BillingSession.play();
  }
  isPlaying = true;
}

export function timeupdate(currentPosSec: number): void {
  if (!DeviceWatch.wasDeviceConnected()) return;
  checkInitialized();

  if (handleVideoSeekEvent(currentPosSec)) return;

  const positionMsec = Math.floor(currentPosSec * 1000);
  if (isBuffering) {
    isBuffering = false;
    PlayerLogic.play(positionMsec, subtitleCallback);
  } else {
    PlayerLogic.timeupdate(positionMsec, subtitleCallback);
  }

  if (watchDogTimeout) clearTimeout(watchDogTimeout);
  if (isPlaying) {
    watchDogTimeout = setTimeout(() => {
      PlayerLogic.stop();
      isBuffering = true;
    }, 1_000);
  }
}

export function stop(): void {
  if (DeviceWatch.wasDeviceConnected()) {
    checkInitialized();
    PlayerLogic.stop();
    resetDevice();
    if (watchDogTimeout) clearTimeout(watchDogTimeout);
  }
  isPlaying = false;
}

export function destroy(): void {
  PlayerLogic.stop();
  if (watchDogTimeout) clearTimeout(watchDogTimeout);
  watchDogTimeout = null;
  isPlaying = false;
  isBuffering = false;
  previousPosSec = 0;
  initialized = false;
  onSubtitle = null;
  loadGeneration = 0;
  BillingSession.reset();
}

export function load(
  videoId: string,
  subtitlesId: number | string,
  externalUserId: string | null,
  channel = '',
  options?: { signal?: AbortSignal },
): Promise<void> {
  const { signal } = options ?? {};

  const doLoad = async () => {
    checkInitialized();
    const subtitlesData = await Loader.loadSubtitlesInfo(
      videoId,
      subtitlesId,
      externalUserId,
      channel,
      signal,
    );
    const subtitleMap = Parser.parse(subtitlesData.text);
    PlayerLogic.setSubtitles(subtitleMap);
    if (isPlaying) PlayerLogic.play(0, subtitleCallback);
  };

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    if (DeviceWatch.wasDeviceConnected()) {
      doLoad().then(resolve).catch(reject);
    } else {
      const generation = ++loadGeneration;
      const onAbort = () => reject(signal!.reason);
      signal?.addEventListener('abort', onAbort, { once: true });

      DeviceWatch.onDeviceConnected(() => {
        signal?.removeEventListener('abort', onAbort);
        if (loadGeneration !== generation) { reject(new Error('Superseded by newer load()')); return; }
        if (signal?.aborted) { reject(signal.reason); return; }
        doLoad().then(resolve).catch(reject);
      });
    }
  });
}

export function devicesChanged(_devices: string[]): void {}

export function init(
  settings: SubsSettings,
  onPlaySubtitle: PlaySubtitleFn,
): void {
  debug.log('Subs.init');
  Loader.init(settings);
  onSubtitle = onPlaySubtitle;
  initialized = true;
}

/**
 * Update the client ID used for subtitle API requests.
 * Called by Apps.init() once the FEC socket.id is available.
 */
export function setClientId(clientId: string): void {
  Loader.setClientId(clientId);
}

export function onSubtitleEvent(callback: SubtitleEventCallback): void {
  subtitleCallbacks.push(callback);
}

export function offSubtitleEvent(callback: SubtitleEventCallback): void {
  const idx = subtitleCallbacks.indexOf(callback);
  if (idx !== -1) subtitleCallbacks.splice(idx, 1);
}
