/**
 * DeviceWatch detects the moment when the mobile app comes online.
 *
 * It connects to the FeelExchangeCenter (FEC) /pubnub namespace and waits for
 * a `sharing:device_connected` message to arrive on the user's personal room
 * (auto-joined by FEC on connection).  Once detected it fires all registered
 * CONNECT_EVENT callbacks.
 *
 * Replaces the old PubNub-presence approach (subscribe + hereNow polling).
 */
import type { FecInboundMessage } from './types'
import appsSettings from './apps/AppsSettings'
import { initSocket } from './FecSocket'

type ConnectCallback = () => void
const connectCallbacks: ConnectCallback[] = []
let deviceWasConnected = false

function emitConnect(): void {
  deviceWasConnected = true
  connectCallbacks.forEach((cb) => cb())
}

/**
 * Initialize DeviceWatch.
 *
 * Opens the FEC Socket.IO connection and listens for the mobile app's
 * `sharing:device_connected` presence message.
 *
 * @param feelAppsToken - ControlPlane partner token (used as JWT for FEC auth)
 * @param userId        - Current user ID
 */
export function init(feelAppsToken: string, userId: string): void {
  console.log('DeviceWatch.init')

  if (appsSettings.partnerToken || appsSettings.userId) {
    throw new Error(
      'Error: $feel library has been already initialized. Please call $feel.destroy() before initializing it again.',
    )
  }

  appsSettings.partnerToken = feelAppsToken
  appsSettings.userId = userId

  const socket = initSocket(appsSettings.fecUrl, feelAppsToken)

  let handled = false

  socket.on('message', (payload: FecInboundMessage) => {
    if (handled) return
    if (payload.message_type === 'sharing:device_connected') {
      console.log('DeviceWatch: mobile app connected via FEC')
      handled = true
      emitConnect()
    }
  })

  socket.on('connect', () => {
    console.log('DeviceWatch: FEC socket connected as user', userId)
  })
}

/** Register a callback to be called when the mobile app first connects */
export function onDeviceConnected(callback: ConnectCallback): void {
  connectCallbacks.push(callback)
}

/** Returns true if the mobile app has connected at least once */
export function wasDeviceConnected(): boolean {
  return deviceWasConnected
}
