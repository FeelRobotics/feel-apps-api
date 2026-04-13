/**
 * Status tracks whether the mobile app (device) is online.
 *
 * Instead of PubNub presence events, it listens to FEC Socket.IO messages:
 *  - `sharing:device_connected`   → mobile app came online
 *  - `sharing:device_disconnected` → mobile app went offline
 *
 * These messages are sent by the mobile app to the user's personal FEC room
 * (auto-joined on connection) and relayed here.
 */
import type { Socket } from 'socket.io-client'
import type { AppsSettingsData, DeviceStatusEvent, FecInboundMessage, UserDevicesResponse } from '../types'

type StatusCallback = (status: DeviceStatusEvent) => void
type DevicesChangedCallback = (devices: string[]) => void

const statusCallbacks: StatusCallback[] = []

let _socket: Socket | null = null
let settings: AppsSettingsData | null = null
let onDevicesChangedCallback: DevicesChangedCallback | null = null

let isOnline = false
let userDevices: string[] = []
let userDeviceDescriptions: unknown[] = []

function emitStatus(): void {
  const event: DeviceStatusEvent = {
    online: isOnline,
    devices: userDevices,
    deviceDescriptions: userDeviceDescriptions,
  }
  statusCallbacks.forEach((cb) => cb(event))
}

function notifyDevicesChanged(): void {
  onDevicesChangedCallback?.(isOnline ? userDevices : [])
}

async function fetchUserDevices(): Promise<void> {
  if (!settings) return
  const url =
    `${settings.apiUrl}/jslib-api/v1/user/${settings.userId}/devices` +
    `?partner_token=${settings.partnerToken}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(response.statusText)
    const result: UserDevicesResponse = await response.json()

    let devices: string[] = []
    if (typeof result.devices === 'string') {
      devices = JSON.parse(result.devices)
    } else if (Array.isArray(result.devices)) {
      devices = result.devices
    }

    userDevices = devices
    userDeviceDescriptions = result.device_descriptions ?? []
    emitStatus()
    notifyDevicesChanged()
  } catch (err) {
    console.log(err)
  }
}

function onMessage(payload: FecInboundMessage): void {
  if (payload.message_type === 'sharing:device_connected') {
    console.log('Status: mobile app connected')
    isOnline = true
    emitStatus()
    notifyDevicesChanged()
    void fetchUserDevices()
  } else if (payload.message_type === 'sharing:device_disconnected') {
    console.log('Status: mobile app disconnected')
    isOnline = false
    emitStatus()
    notifyDevicesChanged()
  }
}

export function subscribe(callback: StatusCallback): void {
  statusCallbacks.push(callback)
}

export function unsubscribe(callback: StatusCallback): void {
  const idx = statusCallbacks.indexOf(callback)
  if (idx !== -1) statusCallbacks.splice(idx, 1)
}

export function disconnect(): void {
  if (_socket) {
    _socket.off('message', onMessage)
    _socket = null
  }
}

export function init(
  socket: Socket,
  newSettings: AppsSettingsData,
  onDevicesChanged: DevicesChangedCallback | null,
): void {
  _socket = socket
  settings = newSettings
  onDevicesChangedCallback = onDevicesChanged

  // Report offline initially
  isOnline = false
  emitStatus()
  notifyDevicesChanged()

  socket.on('message', onMessage)

  // Fetch device list immediately in case devices are already registered
  void fetchUserDevices()
}
