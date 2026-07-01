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
import type { TokenRefreshOptions } from './types';

// Refresh at half the token's 24 h TTL so there is always a 12 h safety window
const TOKEN_REFRESH_MS = 12 * 60 * 60 * 1000;

let socket: Socket | null = null;
let currentToken = '';
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Create and connect the Socket.IO client.
 * Must be called before getSocket().
 *
 * @param fecUrl       - Base URL of the FeelExchangeCenter server
 * @param fecToken     - Initial JWT access token
 * @param roomName     - FEC room to join on connect
 * @param tokenRefresh - Optional token refresh config. Provide `fetchToken` to
 *                        auto-refresh every 12 h, and `onFetchTokenError` to
 *                        handle failures (e.g. force logout).
 */
export function initSocket(
  fecUrl: string,
  fecToken: string,
  roomName: string,
  tokenRefresh?: TokenRefreshOptions,
): Socket {
  currentToken = fecToken;

  socket = io(`${fecUrl}/pubnub`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    // Function form so every reconnect attempt reads the latest token
    auth: (done: (data: { token: string }) => void) =>
      done({ token: currentToken }),
  });

  if (tokenRefresh) {
    const { fetchToken, onTokenError } = tokenRefresh;
    refreshTimer = setInterval(async () => {
      try {
        currentToken = await fetchToken();
        socket?.disconnect();
        socket?.connect();
        debug.log('FecSocket: token refreshed, socket reconnected');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        debug.error('FecSocket: token refresh failed:', error);
        onTokenError?.(error);
      }
    }, TOKEN_REFRESH_MS);
  }

  socket.on(SOCKET_EVENT.CONNECT, () => {
    debug.log('FecSocket connected, id:', socket?.id);
    socket?.emit(
      SOCKET_EVENT.ROOM_JOIN,
      { room_name: roomName },
      (ack: { ok?: boolean; error?: string } | undefined) => {
        if (!ack?.ok)
          debug.error('FecSocket room:join failed:', ack?.error ?? 'no ack');
        else debug.log('FecSocket room:join ok:', roomName);
      },
    );
  });

  socket.on(SOCKET_EVENT.CONNECT_ERROR, (err) => {
    debug.error('FecSocket connection error:', err.message);
  });

  socket.on(SOCKET_EVENT.DISCONNECT, (reason) => {
    debug.log('FecSocket disconnected:', reason);
  });

  return socket;
}

/**
 * Return the active socket. Throws if initSocket() was not called first.
 */
export function getSocket(): Socket {
  if (!socket)
    throw new Error('FecSocket not initialized — call initSocket() first');
  return socket;
}

/**
 * Disconnect and discard the socket, and cancel any pending token refresh.
 */
export function destroySocket(): void {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  socket?.disconnect();
  socket = null;
  currentToken = '';
}
