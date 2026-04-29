/**
 * BillingPubnub joins the user's personal billing room on FEC when subtitle
 * playback starts.  The control plane publishes billing events to this room
 * via the FEC REST API (/api/pubnub/message).
 *
 * Room name: `billing.<socket.id>`
 */
import { getSocket } from "../FecSocket";

let joined = false;

export function play(): void {
  if (joined) return;

  let socket;
  try {
    socket = getSocket();
  } catch {
    // Socket not initialised (e.g. initMobile mode) — billing is a no-op
    return;
  }

  const channelId = "billing." + (socket.id ?? "");
  socket.emit("room:join", channelId);
  joined = true;
}
