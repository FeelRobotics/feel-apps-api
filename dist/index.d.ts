import { Socket } from 'socket.io-client';

interface AppsSettingsData {
    apiUrl: string;
    subtitlesUrl: string;
    partnerToken: string;
    userId: string;
    fecUrl: string;
}
interface SubsSettings {
    apiUrl: string;
    apptoken: string;
    /** Socket.IO socket.id used to identify this client session */
    clientId: string;
}
/** A single haptic event: time in ms from video start, intensity 0–4 */
interface SubtitleEntry {
    time: number;
    subtitle: number;
}
interface DeviceStatusEvent {
    online: boolean;
    devices?: string[];
    deviceDescriptions?: unknown[];
}

/**
 * Status tracks whether the mobile app (device) is online.
 *
 * Instead of PubNub presence events, it listens to FEC Socket.IO messages:
 *  - `sharing:device_connected`   → mobile app came online
 *  - `sharing:device_disconnected` → mobile app went offline
 *
 * These messages are sent by the mobile app to the user's personal FEC room
 * (auto-joined on connection) and relayed here.
 */

type StatusCallback = (status: DeviceStatusEvent) => void;
type DevicesChangedCallback$1 = (devices: string[]) => void;
declare function subscribe$1(callback: StatusCallback): void;
declare function unsubscribe$1(callback: StatusCallback): void;
declare function disconnect$1(): void;
declare function init$3(socket: Socket, newSettings: AppsSettingsData, onDevicesChanged: DevicesChangedCallback$1 | null): void;

declare namespace Status {
  export { disconnect$1 as disconnect, init$3 as init, subscribe$1 as subscribe, unsubscribe$1 as unsubscribe };
}

/**
 * RoomConnection manages the DRS (Device Room Session) Socket.IO room on FEC.
 *
 * Replaces PubNub channel subscribe/publish with:
 *  - `room:join`       to join the DRS room
 *  - `room:leave`      to leave it on disconnect
 *  - emit `message`    with message_type `room:device_data` (v2) to broadcast device values
 *  - emit `message`    with message_type `room:play` / `room:stop` (v3) for subtitle chunks
 *  - listen `message`  for incoming `room:device_data` from remote peers
 *  - listen `message`  with message_type `webshare:presence` for room join/leave events
 */

type DataCallback = (percent: number, deviceName?: string) => void;
declare function connect(socket: Socket, drsRoomName: string): void;
declare function disconnect(): void;
declare function send(percentValue: number, deviceId: string | null, positionMsec: number, subtitles: SubtitleEntry[]): void;
declare function subscribe(callback: DataCallback): void;
declare function unsubscribe(callback: DataCallback): void;

declare const PubnubRoomConnection_connect: typeof connect;
declare const PubnubRoomConnection_disconnect: typeof disconnect;
declare const PubnubRoomConnection_send: typeof send;
declare const PubnubRoomConnection_subscribe: typeof subscribe;
declare const PubnubRoomConnection_unsubscribe: typeof unsubscribe;
declare namespace PubnubRoomConnection {
  export { PubnubRoomConnection_connect as connect, PubnubRoomConnection_disconnect as disconnect, PubnubRoomConnection_send as send, PubnubRoomConnection_subscribe as subscribe, PubnubRoomConnection_unsubscribe as unsubscribe };
}

type DevicesChangedCallback = (devices: string[]) => void;
declare function setServerUrl(url: string): void;
declare function init$2(onDevicesChanged: DevicesChangedCallback | null): void;
declare function destroy$1(): void;
declare function playSubtitle(percentValue: number, positionMsec: number, subtitles: SubtitleEntry[]): void;
declare function getMobileAppLaunchUrl(requestToken: string): string;

declare const Apps_getMobileAppLaunchUrl: typeof getMobileAppLaunchUrl;
declare const Apps_playSubtitle: typeof playSubtitle;
declare const Apps_setServerUrl: typeof setServerUrl;
declare namespace Apps {
  export { PubnubRoomConnection as data, destroy$1 as destroy, Apps_getMobileAppLaunchUrl as getMobileAppLaunchUrl, init$2 as init, Apps_playSubtitle as playSubtitle, Apps_setServerUrl as setServerUrl, Status as status };
}

type SubtitleEventCallback = (percentValue: number) => void;
type PlaySubtitleFn = (percentValue: number, positionMsec: number, subtitles: SubtitleEntry[]) => void;
declare function play(currentPosSec: number): void;
declare function timeupdate(currentPosSec: number): void;
declare function stop(): void;
declare function load(videoId: string, subtitlesId: number | string, externalUserId: string | null, channel?: string): Promise<void>;
declare function devicesChanged(devices: string[]): void;
declare function init$1(settings: SubsSettings, onPlaySubtitle: PlaySubtitleFn): void;
/**
 * Update the client ID used for subtitle API requests.
 * Called by Apps.init() once the FEC socket.id is available.
 */
declare function setClientId(clientId: string): void;
declare function onSubtitleEvent(callback: SubtitleEventCallback): void;
declare function offSubtitleEvent(callback: SubtitleEventCallback): void;

declare const Subs_devicesChanged: typeof devicesChanged;
declare const Subs_load: typeof load;
declare const Subs_offSubtitleEvent: typeof offSubtitleEvent;
declare const Subs_onSubtitleEvent: typeof onSubtitleEvent;
declare const Subs_play: typeof play;
declare const Subs_setClientId: typeof setClientId;
declare const Subs_stop: typeof stop;
declare const Subs_timeupdate: typeof timeupdate;
declare namespace Subs {
  export { Subs_devicesChanged as devicesChanged, init$1 as init, Subs_load as load, Subs_offSubtitleEvent as offSubtitleEvent, Subs_onSubtitleEvent as onSubtitleEvent, Subs_play as play, Subs_setClientId as setClientId, Subs_stop as stop, Subs_timeupdate as timeupdate };
}

interface Servers {
    apps?: string;
    subs?: string;
}
/**
 * Override default API server URLs.
 * Call before init() if you need to point at staging/dev environments.
 */
declare function setServers(servers: Servers): void;
/**
 * Full mode — subtitles + mobile app device control via FeelExchangeCenter.
 *
 * @param feelSubsToken  - Feel Subtitles (Pibds) access token
 * @param feelAppsToken  - Feel Apps (ControlPlane) access token / FEC JWT
 * @param userId         - Feel Apps user ID
 */
declare function init(feelSubsToken: string, feelAppsToken: string, userId: string): void;
/**
 * Mobile mode — runs inside the Feel app's embedded webview.
 * Subtitle events are forwarded to the native app via postMessage.
 *
 * @param feelSubsToken - Feel Subtitles access token
 */
declare function initMobile(feelSubsToken: string): void;
/**
 * Slider mode — device control only, no subtitle loading.
 *
 * @param feelAppsToken - Feel Apps access token / FEC JWT
 * @param userId        - Feel Apps user ID
 */
declare function initSlider(feelAppsToken: string, userId: string): void;
/**
 * Close all connections and release internal resources.
 * Must be called before calling init / initSlider / initMobile again.
 */
declare function destroy(): void;

export { Apps as apps, destroy, init, initMobile, initSlider, setServers, Subs as subs };
