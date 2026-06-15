import * as DeviceWatch from '../DeviceWatch';
import * as debug from '../debug';
import { getSocket } from '../FecSocket';
import * as SubsSubs from '../subs/Subs';
import type { SubtitleEntry } from '../types';
import {
  getRoomName,
  resetApiUrl,
  setApiUrl,
  setRoomName,
  setUserId,
} from './AppsSettings';
import * as RoomConnection from './RoomConnection';
import * as Status from './Status';

type DevicesChangedCallback = (devices: string[]) => void;

export function setServerUrl(url: string): void {
  setApiUrl(url);
}

export function resetServerUrl(): void {
  resetApiUrl();
}

export function init(onDevicesChanged: DevicesChangedCallback | null): void {
  debug.log('App.init');

  const socket = getSocket();
  SubsSubs.setClientId(socket.id ?? '');
  Status.init(socket, onDevicesChanged);
  RoomConnection.connect(socket, getRoomName());
}

export function destroy(): void {
  RoomConnection.disconnect();
  Status.disconnect();
  DeviceWatch.reset();
  setUserId('');
  setRoomName('');
}

export function playSubtitle(
  percentValue: number,
  positionMsec: number,
  subtitles: SubtitleEntry[],
): void {
  RoomConnection.send(percentValue, positionMsec, subtitles);
}

export function getMobileAppLaunchUrl(requestToken: string): string {
  return 'feelapp://authorize?token=' + encodeURIComponent(requestToken);
}

export { RoomConnection as data, Status as status };
