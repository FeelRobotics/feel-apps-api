import * as apps from "./apps/Apps";
import * as debug from "./debug";
import * as DeviceWatch from "./DeviceWatch";
import { destroySocket, getSocket } from "./FecSocket";
import * as subs from "./subs/Subs";
export { setDebug } from "./debug";

const DEFAULT_SUBS_API_URL = "https://api.pibds.com/api/v2";
let subsApiUrl = DEFAULT_SUBS_API_URL;

interface Servers {
  apps?: string;
  subs?: string;
}

function assertHttpsUrl(url: string, param: string): void {
  if (!url.startsWith("https://"))
    throw new Error(`feel.setServers: ${param} must be an https:// URL`);
}

export function setServers(servers: Servers): void {
  if (servers.apps) {
    assertHttpsUrl(servers.apps, "apps");
    apps.setServerUrl(servers.apps);
  }
  if (servers.subs) {
    assertHttpsUrl(servers.subs, "subs");
    subsApiUrl = servers.subs;
  }
}

/**
 * Full mode — subtitles + device control.
 *
 * @param feelSubsToken - Feel Subtitles access token
 * @param fecToken      - FEC JWT with sub claim
 * @param userId        - Feel Apps user ID
 * @param roomName      - FEC room name to join
 */
export function init(
  feelSubsToken: string,
  fecToken: string,
  userId: string,
  roomName: string,
): Promise<void> {
  if (!feelSubsToken) throw new Error("feel.init: feelSubsToken is required");
  if (!fecToken) throw new Error("feel.init: fecToken is required");
  if (!userId) throw new Error("feel.init: userId is required");
  if (!roomName) throw new Error("feel.init: roomName is required");

  debug.log("feel.init");

  const connected = DeviceWatch.init(fecToken, userId, roomName);
  apps.init(onDevicesChanged);
  DeviceWatch.onDeviceConnected(() => {
    const socket = getSocket();
    const clientId = socket.id ?? "";
    subs.init(
      { apiUrl: subsApiUrl, apptoken: feelSubsToken, clientId },
      apps.playSubtitle,
    );
  });
  return connected;
}

function onDevicesChanged(devices: string[]): void {
  subs.devicesChanged(devices);
}

/**
 * Slider mode — device control only, no subtitles.
 *
 * @param fecToken - FEC JWT with sub claim
 * @param userId   - Feel Apps user ID
 * @param roomName - FEC room name to join
 */
export function initSlider(
  fecToken: string,
  userId: string,
  roomName: string,
): Promise<void> {
  if (!fecToken) throw new Error("feel.initSlider: fecToken is required");
  if (!userId) throw new Error("feel.initSlider: userId is required");
  if (!roomName) throw new Error("feel.initSlider: roomName is required");

  const connected = DeviceWatch.init(fecToken, userId, roomName);
  apps.init(null);
  return connected;
}

export function destroy(): void {
  subs.destroy();
  apps.destroy();
  apps.resetServerUrl();
  subsApiUrl = DEFAULT_SUBS_API_URL;
  destroySocket();
}

export { apps, subs };
