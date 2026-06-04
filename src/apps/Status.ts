import type { Socket } from 'socket.io-client';
import { MESSAGE_TYPE, SOCKET_EVENT } from '../constants';
import * as debug from '../debug';
import type { DeviceStatusEvent, FecInboundMessage } from '../types';

type StatusCallback = (status: DeviceStatusEvent) => void;
type DevicesChangedCallback = (devices: string[]) => void;

const statusCallbacks: StatusCallback[] = [];

let _socket: Socket | null = null;
let onDevicesChangedCallback: DevicesChangedCallback | null = null;

let isOnline = false;
let currentDevices: string[] = [];

function emitStatus(): void {
  const event: DeviceStatusEvent = {
    online: isOnline,
    devices: currentDevices,
    deviceDescriptions: [],
  };
  statusCallbacks.forEach((cb) => {
    cb(event);
  });
}

function onMessage(payload: FecInboundMessage): void {
  debug.log('Status: onMessage', payload);
  if (payload.message_type === MESSAGE_TYPE.SYSTEM_PRESENCE) {
    const d = payload.data as { action?: string };
    if (d.action === 'join') {
      debug.log('Status: Feel app connected');
      isOnline = true;
      emitStatus();
      onDevicesChangedCallback?.(currentDevices);
    } else if (d.action === 'leave') {
      debug.log('Status: Feel app disconnected');
      isOnline = false;
      currentDevices = [];
      emitStatus();
      onDevicesChangedCallback?.([]);
    }
  }
}

export function subscribe(callback: StatusCallback): void {
  statusCallbacks.push(callback);
}

export function unsubscribe(callback: StatusCallback): void {
  const idx = statusCallbacks.indexOf(callback);
  if (idx !== -1) statusCallbacks.splice(idx, 1);
}

export function disconnect(): void {
  if (_socket) {
    _socket.off(SOCKET_EVENT.MESSAGE, onMessage);
    _socket = null;
  }
}

export function init(
  socket: Socket,
  onDevicesChanged: DevicesChangedCallback | null,
): void {
  _socket = socket;
  onDevicesChangedCallback = onDevicesChanged;

  isOnline = false;
  currentDevices = [];
  emitStatus();

  socket.on(SOCKET_EVENT.MESSAGE, onMessage);
}
