// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppsSettingsData {
  apiUrl: string;
  userId: string;
  fecUrl: string;
  roomName: string;
}

export interface SubsSettings {
  apiUrl: string;
  apptoken: string;
  /** Socket.IO socket.id used to identify this client session */
  clientId: string;
}

// ─── Subtitles ────────────────────────────────────────────────────────────────

/** A single haptic event: time in ms from video start, intensity 0–4 */
export interface SubtitleEntry {
  time: number;
  subtitle: number;
}

/** Raw subtitle map returned from the parser: { "1200": 3, "2400": 1, ... } */
export type SubtitleMap = Record<string, number>;

// ─── User / Device status ─────────────────────────────────────────────────────

export interface DeviceStatusEvent {
  online: boolean;
  devices?: string[];
  deviceDescriptions?: unknown[];
}

// ─── FEC message shapes (wire format) ────────────────────────────────────────

export interface SubtitleChunkMessage {
  src: string;
  subtitles: SubtitleEntry[];
  type: "play" | "stop";
  serverTime: number;
  ver: 3;
}

export interface DeviceToDeviceMessageV1 {
  src: string;
  percents: number[];
  deviceName: string;
  ver: 1;
}

export interface DeviceToDeviceMessageV2 {
  src: string;
  values: Array<{ value: number; to: string; from?: string }>;
  percents: number[];
  ver: 2;
}

export type RoomMessage =
  | SubtitleChunkMessage
  | DeviceToDeviceMessageV1
  | DeviceToDeviceMessageV2;

// ─── DRS (Device Room Session) API response ───────────────────────────────────

export interface DrsInfo {
  drs_room: { drs_id: string };
}

export interface UserDevicesResponse {
  devices: string[] | string | null;
  device_descriptions: unknown[] | null;
}

// ─── FEC Socket.IO inbound message envelope ───────────────────────────────────

export interface FecInboundMessage {
  room: string;
  message_type: string;
  data: unknown;
}
