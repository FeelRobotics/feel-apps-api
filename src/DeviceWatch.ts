import type { FecInboundMessage } from "./types";
import appsSettings from "./apps/AppsSettings";
import { initSocket } from "./FecSocket";

type ConnectCallback = () => void;
const connectCallbacks: ConnectCallback[] = [];
let deviceWasConnected = false;

function emitConnect(): void {
  deviceWasConnected = true;
  connectCallbacks.forEach((cb) => cb());
}

/**
 * @param fecToken - FEC JWT (must contain sub claim)
 * @param userId   - Current user ID
 */
export function init(fecToken: string, userId: string, roomName: string): void {
  if (appsSettings.userId) {
    throw new Error(
      "Error: $feel library has been already initialized. Please call $feel.destroy() before initializing it again.",
    );
  }

  appsSettings.userId = userId;
  appsSettings.roomName = roomName;

  const socket = initSocket(appsSettings.fecUrl, fecToken, roomName);

  let handled = false;

  socket.on("message", (payload: FecInboundMessage) => {
    if (handled) return;
    if (payload.message_type === "system:presence") {
      const d = payload.data as { action?: string };
      if (d.action === "join") {
        console.log("DeviceWatch: Feel app connected");
        handled = true;
        emitConnect();
      }
    }
  });

  socket.on("connect", () => {
    console.log("DeviceWatch: FEC socket connected as user", userId);
  });
}

export function onDeviceConnected(callback: ConnectCallback): void {
  connectCallbacks.push(callback);
}

export function wasDeviceConnected(): boolean {
  return deviceWasConnected;
}
