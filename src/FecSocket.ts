/**
 * FecSocket — singleton Socket.IO client connected to the FeelExchangeCenter
 * /pubnub namespace.
 *
 * Initialised once by DeviceWatch.init() and then reused by every module that
 * needs real-time messaging (Status, RoomConnection, SubtitleChunkPlayer,
 * BillingSession).
 */
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENT } from './constants';
import * as debug from './debug';

let _socket: Socket | null = null;

/**
 * Create and connect the Socket.IO client.
 * Must be called before getSocket().
 *
 * @param fecUrl - Base URL of the FeelExchangeCenter server (e.g. "https://fec.feel-app.com")
 * @param token  - JWT access token (feelAppsToken / ControlPlane partner token)
 */
export function initSocket(
  fecUrl: string,
  fecToken: string,
  roomName: string,
): Socket {
  _socket = io(`${fecUrl}/pubnub`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    auth: { token: fecToken },
  });

  _socket.on(SOCKET_EVENT.CONNECT, () => {
    debug.log('FecSocket connected, id:', _socket?.id);
    _socket?.emit(
      SOCKET_EVENT.ROOM_JOIN,
      { room_name: roomName },
      (ack: { ok?: boolean; error?: string } | undefined) => {
        if (!ack?.ok)
          debug.error('FecSocket room:join failed:', ack?.error ?? 'no ack');
        else debug.log('FecSocket room:join ok:', roomName);
      },
    );
  });

  _socket.on(SOCKET_EVENT.CONNECT_ERROR, (err) => {
    debug.error('FecSocket connection error:', err.message);
  });

  _socket.on(SOCKET_EVENT.DISCONNECT, (reason) => {
    debug.log('FecSocket disconnected:', reason);
  });

  return _socket;
}

/**
 * Return the active socket. Throws if initSocket() was not called first.
 */
export function getSocket(): Socket {
  if (!_socket)
    throw new Error('FecSocket not initialized — call initSocket() first');
  return _socket;
}

/**
 * Disconnect and discard the socket.
 */
export function destroySocket(): void {
  _socket?.disconnect();
  _socket = null;
}
