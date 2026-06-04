/**
 * RoomConnection manages the DRS (Device Room Session) Socket.IO room on FEC.
 *
 *  - `room:join`       to join the DRS room
 *  - `room:leave`      to leave it on disconnect
 *  - emit `message`    with message_type `device:position` to send haptic intensity
 *  - emit `message`    with message_type `room:play` / `room:stop` (v3) for subtitle chunks
 *  - listen `message`  for incoming `device:position` from remote peers
 *  - listen `message`  with message_type `webshare:presence` for room join/leave events
 */
import type { Socket } from "socket.io-client";
import { MESSAGE_TYPE, SOCKET_EVENT } from "../constants";
import * as debug from "../debug";
import type { FecInboundMessage, SubtitleEntry } from "../types";
import { getUserId } from "./AppsSettings";
import { filterIntermediateValues } from "./PercentArrayFilter";
import * as MessageQueue from "./MessageQueue";
import * as SubtitleChunkPlayer from "./SubtitleChunkPlayer";

type DataCallback = (percent: number, deviceName?: string) => void;
const dataCallbacks: DataCallback[] = [];

let _socket: Socket | null = null;
let roomId: string | null = null;

function emitData(percent: number, deviceName?: string): void {
  dataCallbacks.forEach((callback) => {
    callback(percent, deviceName);
  });
}

function onMessage(payload: FecInboundMessage): void {
  if (!roomId) return;

  const { message_type, data } = payload;

  if (message_type === MESSAGE_TYPE.DEVICE_POSITION) {
    if (data == null || typeof data !== "object") return;
    const positionData = data as Record<string, unknown>;
    if (positionData.what === "device_percent" && typeof positionData.payload === "number") {
      emitData(positionData.payload, positionData.from as string | undefined);
    }
    return;
  }

  if (message_type === MESSAGE_TYPE.SYSTEM_PRESENCE) {
    if (data == null || typeof data !== "object") return;
    const presenceData = data as Record<string, unknown>;
    if (presenceData.action === "join") {
      SubtitleChunkPlayer.reset();
    }
    return;
  }
}


function sendQueue(): void {
  if (!_socket || !roomId) return;

  MessageQueue.startSending(roomId);
  const messages = MessageQueue.getMessages(roomId);
  const filtered = filterIntermediateValues(messages);
  MessageQueue.reset(roomId);

  const last = filtered[filtered.length - 1];
  if (!last) {
    MessageQueue.endSending(roomId);
    return;
  }

  const roomSnapshot = roomId;
  const msg = {
    message_type: MESSAGE_TYPE.DEVICE_POSITION,
    data: {
      target: last.to || getUserId(),
      what: "device_percent",
      payload: last.value,
    },
  };
  debug.log("[RoomConnection] sending device:position", msg);
  _socket.emit(SOCKET_EVENT.MESSAGE, msg, () => {
    MessageQueue.endSending(roomSnapshot);
    if (!MessageQueue.isEmpty(roomSnapshot)) {
      sendQueue();
    }
  });
}

export function connect(socket: Socket, drsRoomName: string): void {
  _socket = socket;
  roomId = drsRoomName;
  socket.on(SOCKET_EVENT.MESSAGE, onMessage);
}

export function disconnect(): void {
  if (!_socket || !roomId) return;
  _socket.emit(SOCKET_EVENT.ROOM_LEAVE, { room_name: roomId });
  _socket.off(SOCKET_EVENT.MESSAGE, onMessage);
  _socket = null;
  roomId = null;
  SubtitleChunkPlayer.reset();
  dataCallbacks.length = 0;
}

export function send(
  percentValue: number,
  positionMsec: number,
  subtitles: SubtitleEntry[],
): void {
  if (!_socket || !roomId) {
    debug.warn("[RoomConnection] send called but socket/room not ready", {
      socket: !!_socket,
      roomId,
    });
    return;
  }

  if (subtitles.length > 0) {
    SubtitleChunkPlayer.play(positionMsec, subtitles, _socket, roomId);
  } else {
    MessageQueue.push(roomId, { value: percentValue });
    if (!MessageQueue.isSendingInProgress(roomId)) {
      sendQueue();
    }
  }
}

export function subscribe(callback: DataCallback): void {
  dataCallbacks.push(callback);
}

export function unsubscribe(callback: DataCallback): void {
  const idx = dataCallbacks.indexOf(callback);
  if (idx !== -1) dataCallbacks.splice(idx, 1);
}
