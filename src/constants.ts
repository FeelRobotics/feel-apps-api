// ─── Socket.IO event names ────────────────────────────────────────────────────

export const SOCKET_EVENT = {
  MESSAGE: 'message',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
} as const;

// ─── FEC message_type values ──────────────────────────────────────────────────

export const MESSAGE_TYPE = {
  SYSTEM_PRESENCE: 'system:presence',
  WEBSHARE_PRESENCE: 'webshare:presence',
  DEVICE_POSITION: 'device:position',
  ROOM_PLAY: 'room:play',
  ROOM_STOP: 'room:stop',
} as const;
