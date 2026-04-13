/**
 * RoomConnection manages the DRS (Device Room Session) Socket.IO room on FEC.
 *
 * Replaces PubNub channel subscribe/publish with:
 *  - `room:join`       to join the DRS room
 *  - `room:leave`      to leave it on disconnect
 *  - emit `message`    with message_type `room:device_data` (v2) to broadcast device values
 *  - emit `message`    with message_type `room:play` / `room:stop` (v3) for subtitle chunks
 *  - listen `message`  for incoming `room:device_data` from remote peers
 *  - listen `message`  with message_type `webshare:presence` for room join/leave events
 */
import type { Socket } from 'socket.io-client'
import type { SubtitleEntry, FecInboundMessage } from '../types'
import * as MessageQueue from './PubnubMessageQueue'
import { filterIntermediateValues } from './PercentArrayFilter'
import * as SubtitleChunkPlayer from './SubtitleChunkPlayer'

type DataCallback = (percent: number, deviceName?: string) => void
const dataCallbacks: DataCallback[] = []

let _socket: Socket | null = null
let roomId: string | null = null
let hereNowTimeout: ReturnType<typeof setTimeout> | null = null

// Default to v3 (subtitle-chunk protocol) — FEC supports it natively.
// Set to 2 to fall back to per-value v2 messages.
let clientMessageHandlerVersion = 3

function emitData(percent: number, deviceName?: string): void {
  dataCallbacks.forEach((cb) => cb(percent, deviceName))
}

function onMessage(payload: FecInboundMessage): void {
  if (!roomId) return

  const { message_type, data } = payload

  if (message_type === 'room:device_data') {
    // data.from is appended by FEC (sender's user.sub)
    const d = data as { src?: string; percents?: number[]; values?: { to: string; value: number }[]; from?: string; ver?: number }
    if (d.src === _socket?.id) return // ignore own messages

    if (Array.isArray(d.values)) {
      for (const val of d.values) {
        emitData(val.value, d.from)
      }
    } else if (Array.isArray(d.percents)) {
      for (const p of d.percents) {
        emitData(p)
      }
    }
    return
  }

  if (message_type === 'webshare:presence') {
    // A peer joined or left the DRS room
    const d = data as { action?: string }
    if (d.action === 'join') {
      SubtitleChunkPlayer.reset()
    }
    return
  }
}

function sendQueue(): void {
  if (!_socket || !roomId) return

  MessageQueue.startSending(roomId)
  const messages = MessageQueue.getMessages(roomId)
  const filtered = filterIntermediateValues(messages)

  const data = {
    room: roomId,
    src: _socket.id ?? '',
    percents: filtered.map((m) => m.value),
    values: filtered.map((m) => ({ to: m.to ?? '', value: m.value })),
    ver: 2 as const,
  }

  console.log('Sending room:device_data to FEC:', data)
  MessageQueue.reset(roomId)

  const roomSnapshot = roomId
  _socket.emit(
    'message',
    { room: roomSnapshot, message_type: 'room:device_data', data },
    () => {
      MessageQueue.endSending(roomSnapshot)
      if (!MessageQueue.isEmpty(roomSnapshot)) {
        sendQueue()
      }
    },
  )
}

export function connect(socket: Socket, drsRoomName: string): void {
  _socket = socket
  roomId = drsRoomName

  socket.emit('room:join', drsRoomName, () => {
    console.log('Joined FEC room:', drsRoomName)
  })

  socket.on('message', onMessage)
  console.log('RoomConnection: listening on room', drsRoomName)
}

export function disconnect(): void {
  if (!_socket || !roomId) return
  _socket.emit('room:leave', roomId)
  _socket.off('message', onMessage)
  if (hereNowTimeout) clearTimeout(hereNowTimeout)
  roomId = null
}

export function send(
  percentValue: number,
  deviceId: string | null,
  positionMsec: number,
  subtitles: SubtitleEntry[],
): void {
  if (!_socket || !roomId) return

  if (subtitles && clientMessageHandlerVersion >= 3) {
    SubtitleChunkPlayer.play(positionMsec, subtitles, _socket, roomId)
  } else {
    const value = {
      value: percentValue,
      to: deviceId ?? '',
    }
    MessageQueue.push(roomId, value)
    if (!MessageQueue.isSendingInProgress(roomId)) {
      sendQueue()
    }
  }
}

export function subscribe(callback: DataCallback): void {
  dataCallbacks.push(callback)
}

export function unsubscribe(callback: DataCallback): void {
  const idx = dataCallbacks.indexOf(callback)
  if (idx !== -1) dataCallbacks.splice(idx, 1)
}
