import { getFecUrl, setRoomName, setUserId } from './apps/AppsSettings';
import { MESSAGE_TYPE, SOCKET_EVENT } from './constants';
import * as debug from './debug';
import { initSocket } from './FecSocket';
import type { FecInboundMessage } from './types';

type DeviceConnectedCallback = () => void;
const deviceConnectedCallbacks: DeviceConnectedCallback[] = [];
let deviceWasConnected = false;
let initialized = false;

function notifyDeviceConnected(): void {
  deviceWasConnected = true;
  deviceConnectedCallbacks.forEach((callback) => {
    callback();
  });
}

/**
 * Connects to FEC and watches for the first Feel app join event.
 *
 * The returned promise resolves when the FEC *socket* connects — not when a
 * device joins. Listen for device join via `onDeviceConnected()`.
 *
 * @param fecToken - FEC JWT (must contain sub claim)
 * @param userId   - Current user ID
 * @param roomName - DRS room name to join on connect
 */
export function init(fecToken: string, userId: string, roomName: string): Promise<void> {
  if (initialized) {
    throw new Error(
      'Error: $feel library has been already initialized. Please call $feel.destroy() before initializing it again.',
    );
  }
  initialized = true;

  setUserId(userId);
  setRoomName(roomName);

  const socket = initSocket(getFecUrl(), fecToken, roomName);

  function handlePresenceMessage(payload: FecInboundMessage): void {
    if (payload.message_type !== MESSAGE_TYPE.SYSTEM_PRESENCE) return;
    const data = payload.data;
    if (data == null || typeof data !== 'object') return;
    if ((data as Record<string, unknown>).action === 'join') {
      socket.off(SOCKET_EVENT.MESSAGE, handlePresenceMessage);
      debug.log('DeviceWatch: Feel app connected');
      notifyDeviceConnected();
    }
  }
  socket.on(SOCKET_EVENT.MESSAGE, handlePresenceMessage);

  return new Promise((resolve) => {
    socket.once(SOCKET_EVENT.CONNECT, () => {
      debug.log('DeviceWatch: FEC socket connected as user', userId);
      resolve();
    });
  });
}

/** Register a callback to fire once when the first Feel app joins the room. */
export function onDeviceConnected(callback: DeviceConnectedCallback): void {
  deviceConnectedCallbacks.push(callback);
}

/** Returns true if a Feel app has connected at least once in this session. */
export function wasDeviceConnected(): boolean {
  return deviceWasConnected;
}

/** Clear all state — must be called before re-initialising with `init()`. */
export function reset(): void {
  deviceConnectedCallbacks.length = 0;
  deviceWasConnected = false;
  initialized = false;
}
