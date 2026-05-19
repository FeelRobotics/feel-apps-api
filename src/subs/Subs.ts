import * as DeviceWatch from '../DeviceWatch';
import type { SubsSettings, SubtitleEntry } from '../types';
import * as BillingPubnub from './BillingPubnub';
import * as Loader from './Loader';
import * as Logger from './Logger';
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
let watchDogTimeout: ReturnType<typeof setTimeout> | null = null;
let buffering = false;
let playing = false;
let previousPos = 0;
const SEEK_DISTANCE = 2.0; // seconds

function emitSubtitleEvent(percentValue: number): void {
  subtitleCallbacks.forEach((cb) => {
    cb(percentValue);
  });
}

const subtitleCallback: SubtitleCallback = (
  subtitleObj,
  positionMsec,
  subtitles,
) => {
  const percentValue = subtitleObj.subtitle * 25;
  emitSubtitleEvent(percentValue);
  onSubtitle?.(percentValue, positionMsec, subtitles);
};

function resetDevice(): void {
  subtitleCallback({ time: 0, subtitle: 0 }, 0, []);
}

function handleVideoSeekEvent(currentPosSec: number): boolean {
  if (Math.abs(currentPosSec - previousPos) > SEEK_DISTANCE) {
    const wasPlaying = playing;
    stop();
    if (wasPlaying) play(currentPosSec);
    previousPos = currentPosSec;
    return true;
  }
  previousPos = currentPosSec;
  return false;
}

function checkInitialized(): void {
  if (!initialized) {
    throw new Error('Please call $feel.init before loading/playing subtitles');
  }
}

export function play(currentPosSec: number): void {
  if (DeviceWatch.wasDeviceConnected()) {
    checkInitialized();
    const posMsec = Math.floor(currentPosSec * 1000);
    PlayerLogic.play(posMsec, subtitleCallback);
    Logger.startInterval(posMsec);
    BillingPubnub.play();
  }
  playing = true;
}

export function timeupdate(currentPosSec: number): void {
  if (!DeviceWatch.wasDeviceConnected()) return;
  checkInitialized();

  if (handleVideoSeekEvent(currentPosSec)) return;

  const posMsec = Math.floor(currentPosSec * 1000);
  if (buffering) {
    buffering = false;
    PlayerLogic.play(posMsec, subtitleCallback);
  } else {
    PlayerLogic.timeupdate(posMsec, subtitleCallback);
  }

  if (watchDogTimeout) clearTimeout(watchDogTimeout);
  if (playing) {
    watchDogTimeout = setTimeout(() => {
      PlayerLogic.stop();
      buffering = true;
    }, 1_000);
  }
}

export function stop(): void {
  if (DeviceWatch.wasDeviceConnected()) {
    checkInitialized();
    PlayerLogic.stop();
    resetDevice();
    Logger.endInterval();
    if (watchDogTimeout) clearTimeout(watchDogTimeout);
  }
  playing = false;
}

export async function load(
  videoId: string,
  subtitlesId: number | string,
  externalUserId: string | null,
  channel = '',
): Promise<void> {
  const doLoad = async () => {
    checkInitialized();
    const subtitlesData = await Loader.loadSubtitlesInfo(
      videoId,
      subtitlesId,
      externalUserId,
      channel,
    );
    Logger.setSessionId(subtitlesData.session_id);
    const subtitleMap = Parser.parse(subtitlesData.text);
    PlayerLogic.setSubtitles(subtitleMap);
    if (playing) PlayerLogic.play(0, subtitleCallback);
  };

  return new Promise((resolve, reject) => {
    if (DeviceWatch.wasDeviceConnected()) {
      doLoad().then(resolve).catch(reject);
    } else {
      DeviceWatch.onDeviceConnected(() => doLoad().then(resolve).catch(reject));
    }
  });
}

export function devicesChanged(devices: string[]): void {
  const posMsec = PlayerLogic.getCurrentVideoPosition();
  Logger.devicesChanged(devices, posMsec);
}

export function init(
  settings: SubsSettings,
  onPlaySubtitle: PlaySubtitleFn,
): void {
  console.log('Subs.init');
  Loader.init(settings);
  Logger.init(settings);
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
