/**
 * SubtitleChunkPlayer sends v3 subtitle-chunk messages to the FEC DRS room.
 *
 * Replaces the PubNub publish calls with Socket.IO `message` events:
 *  - `room:play`  — carries the next 70-second subtitle window
 *  - `room:stop`  — signals end of playback
 *
 * `serverTime` is now `Date.now()` (ms) instead of PubNub's timetoken.
 */
import type { Socket } from 'socket.io-client';
import * as debug from '../debug';
import type { SubtitleEntry } from '../types';
import { getNextSubtitles } from './SubtitleChunkUtils';

const CHUNK_SIZE_MSEC = 70_000;
const TIME_BETWEEN_CHUNKS_MSEC = 60_000;

let lastMessageTime: number | null = null;

function sendStop(socket: Socket, roomId: string): void {
  const data = { room: roomId, type: 'stop' as const, ver: 3 as const };
  debug.log('room:stop', data);
  socket.emit('message', { room: roomId, message_type: 'room:stop', data });
}

function sendPlay(
  nextSubtitles: SubtitleEntry[],
  socket: Socket,
  roomId: string,
): void {
  const data = {
    room: roomId,
    src: socket.id ?? '',
    subtitles: nextSubtitles,
    type: 'play' as const,
    serverTime: Date.now(),
    ver: 3 as const,
  };
  debug.log('room:play', data);
  socket.emit('message', { room: roomId, message_type: 'room:play', data });
}

export function play(
  positionMsec: number,
  subtitles: SubtitleEntry[],
  socket: Socket,
  roomId: string,
): void {
  if (!subtitles || subtitles.length === 0) {
    sendStop(socket, roomId);
    lastMessageTime = null;
    return;
  }

  if (
    lastMessageTime !== null &&
    lastMessageTime + TIME_BETWEEN_CHUNKS_MSEC > positionMsec
  ) {
    return;
  }

  lastMessageTime = positionMsec;
  const nextSubtitles = getNextSubtitles(
    subtitles,
    positionMsec,
    CHUNK_SIZE_MSEC,
  );
  sendPlay(nextSubtitles, socket, roomId);
}

export function reset(): void {
  lastMessageTime = null;
}
