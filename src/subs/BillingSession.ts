/**
 * BillingPubnub joins the user's personal billing room on FEC when subtitle
 * playback starts.  The control plane publishes billing events to this room
 * via the FEC REST API (/api/pubnub/message).
 *
 * Room name: `billing.<socket.id>`
 */
import { SOCKET_EVENT } from '../constants';
import { getSocket } from '../FecSocket';

let joined = false;

export function reset(): void {
  joined = false;
}

export function play(): void {
  if (joined) return;

  let socket: ReturnType<typeof getSocket>;
  try {
    socket = getSocket();
  } catch {
    // Socket not initialised — billing is a no-op
    return;
  }

  const channelId = `billing.${socket.id ?? ''}`;
  socket.emit(SOCKET_EVENT.ROOM_JOIN, { room_name: channelId });
  joined = true;
}
