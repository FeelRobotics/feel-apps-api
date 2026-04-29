import type { Socket } from "socket.io-client";
import type { DeviceStatusEvent, FecInboundMessage } from "../types";

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
  statusCallbacks.forEach((cb) => cb(event));
}

function onMessage(payload: FecInboundMessage): void {
  console.log("Status: onMessage", payload);
  if (payload.message_type === "system:presence") {
    const d = payload.data as { action?: string };
    if (d.action === "join") {
      console.log("Status: Feel app connected");
      isOnline = true;
      emitStatus();
      onDevicesChangedCallback?.(currentDevices);
    } else if (d.action === "leave") {
      console.log("Status: Feel app disconnected");
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
    _socket.off("message", onMessage);
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

  socket.on("message", onMessage);
}
