/**
 * DeviceWatch detects the moment when the mobile app comes online.
 *
 * Flow:
 *  1. Fetches a FEC-specific JWT from ControlPlane
 *     (GET /jslib-api/v1/user/{userId}/fec-token?partner_token=...)
 *  2. Opens a Socket.IO connection to FeelExchangeCenter /pubnub namespace
 *     authenticated with that token
 *  3. Waits for a `sharing:device_connected` message on the user's personal
 *     room (auto-joined by FEC) and fires all onDeviceConnected() callbacks
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
 * Fetch a FEC-scoped JWT from ControlPlane.
 * The returned token has payload { sub: userId, partner_id, ab } which is
 * exactly what FEC's auth middleware expects.
 */
async function fetchFecToken(apiUrl: string, userId: string, partnerToken: string): Promise<string> {
  const url =
    `${apiUrl}/jslib-api/v1/user/${encodeURIComponent(userId)}/fec-token` +
    `?partner_token=${encodeURIComponent(partnerToken)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch FEC token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { fec_token: string }
  if (!data.fec_token) throw new Error('FEC token missing in response')
  return data.fec_token
}

/**
 * Initialize DeviceWatch.
 *
 * @param feelAppsToken - ControlPlane partner token (used to obtain a FEC JWT)
 * @param userId        - Current user ID
 */
export async function init(feelAppsToken: string, userId: string): Promise<void> {
  console.log('DeviceWatch.init')

  if (appsSettings.partnerToken || appsSettings.userId) {
    throw new Error(
      'Error: $feel library has been already initialized. Please call $feel.destroy() before initializing it again.',
    )
  }

  appsSettings.partnerToken = feelAppsToken
  appsSettings.userId = userId

  let fecToken: string
  try {
    fecToken = await fetchFecToken(appsSettings.apiUrl, userId, feelAppsToken)
    console.log('DeviceWatch: FEC token obtained')
  } catch (err) {
    console.error('DeviceWatch: failed to obtain FEC token', err)
    return
  }

  const socket = initSocket(appsSettings.fecUrl, fecToken)

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
