import * as apps from './apps/Apps'
import * as subs from './subs/Subs'
import * as DeviceWatch from './DeviceWatch'
import { playSubtitle as mobilePlaySubtitle } from './MobileApi'
import { getSocket, destroySocket } from './FecSocket'

// Production:  'https://api.pibds.com/api/v1'
// Staging:
let SUBS_API_URL = 'https://api-subtitles.feel-app.com/api/v1'

interface Servers {
  apps?: string
  subs?: string
}

/**
 * Override default API server URLs.
 * Call before init() if you need to point at staging/dev environments.
 */
export function setServers(servers: Servers): void {
  if (servers.apps) apps.setServerUrl(servers.apps)
  if (servers.subs) SUBS_API_URL = servers.subs
}

/**
 * Full mode — subtitles + mobile app device control via FeelExchangeCenter.
 *
 * @param feelSubsToken  - Feel Subtitles (Pibds) access token
 * @param feelAppsToken  - Feel Apps (ControlPlane) access token / FEC JWT
 * @param userId         - Feel Apps user ID
 */
export function init(feelSubsToken: string, feelAppsToken: string, userId: string): void {
  console.log('feel.init')

  DeviceWatch.init(feelAppsToken, userId)
  DeviceWatch.onDeviceConnected(() => {
    const socket = getSocket()
    const clientId = socket.id ?? ''
    subs.init({ apiUrl: SUBS_API_URL, apptoken: feelSubsToken, clientId }, apps.playSubtitle)
    apps.init(onDevicesChanged)
  })
}

function onDevicesChanged(devices: string[]): void {
  subs.devicesChanged(devices)
}

/**
 * Mobile mode — runs inside the Feel app's embedded webview.
 * Subtitle events are forwarded to the native app via postMessage.
 *
 * @param feelSubsToken - Feel Subtitles access token
 */
export function initMobile(feelSubsToken: string): void {
  subs.init(
    { apiUrl: SUBS_API_URL, apptoken: feelSubsToken, clientId: '' },
    mobilePlaySubtitle,
  )
}

/**
 * Slider mode — device control only, no subtitle loading.
 *
 * @param feelAppsToken - Feel Apps access token / FEC JWT
 * @param userId        - Feel Apps user ID
 */
export function initSlider(feelAppsToken: string, userId: string): void {
  DeviceWatch.init(feelAppsToken, userId)
  DeviceWatch.onDeviceConnected(() => {
    apps.init(null)
  })
}

/**
 * Close all connections and release internal resources.
 * Must be called before calling init / initSlider / initMobile again.
 */
export function destroy(): void {
  apps.destroy()
  destroySocket()
}

export { apps, subs }
