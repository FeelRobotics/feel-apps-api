// ─── Token refresh ────────────────────────────────────────────────────────────

export interface TokenRefreshOptions {
  /** Called every 12 h to retrieve a fresh fecToken before the current one expires. */
  fetchToken: () => string | Promise<string>;
  /** Called when fetchToken fails so the caller can react (e.g. force logout). */
  onTokenError?: (err: Error) => void;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

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

// ─── FEC Socket.IO inbound message envelope ───────────────────────────────────

export interface FecInboundMessage {
  room: string;
  message_type: string;
  data: unknown;
}
