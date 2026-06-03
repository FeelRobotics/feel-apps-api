import * as debug from "../debug";
import { getSocket } from "../FecSocket";
import * as SubsSubs from "../subs/Subs";
import type { SubtitleEntry } from "../types";
import appsSettings from "./AppsSettings";
import * as RoomConnection from "./PubnubRoomConnection";
import * as Status from "./Status";

type DevicesChangedCallback = (devices: string[]) => void;

export function setServerUrl(url: string): void {
  appsSettings.apiUrl = url;
}

export function init(onDevicesChanged: DevicesChangedCallback | null): void {
  debug.log("App.init");

  const socket = getSocket();
  SubsSubs.setClientId(socket.id ?? "");
  Status.init(socket, onDevicesChanged);
  RoomConnection.connect(socket, appsSettings.roomName);
}

export function destroy(): void {
  RoomConnection.disconnect();
  Status.disconnect();
  appsSettings.userId = "";
  appsSettings.roomName = "";
}

export function playSubtitle(
  percentValue: number,
  positionMsec: number,
  subtitles: SubtitleEntry[],
): void {
  RoomConnection.send(percentValue, null, positionMsec, subtitles);
}

export function getMobileAppLaunchUrl(requestToken: string): string {
  return "feelapp://authorize?token=" + encodeURIComponent(requestToken);
}

export { Status as status, RoomConnection as data };
