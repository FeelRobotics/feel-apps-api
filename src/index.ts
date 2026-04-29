import * as apps from './apps/Apps'
import * as subs from './subs/Subs'
import * as DeviceWatch from './DeviceWatch'
import { getSocket, destroySocket } from './FecSocket'

let SUBS_API_URL = 'https://api-subtitles.feel-app.com/api/v1'

interface Servers {
  apps?: string
  subs?: string
}

export function setServers(servers: Servers): void {
  if (servers.apps) apps.setServerUrl(servers.apps)
  if (servers.subs) SUBS_API_URL = servers.subs
}

/**
 * Full mode — subtitles + device control.
 *
 * @param feelSubsToken - Feel Subtitles access token
 * @param fecToken      - FEC JWT with sub claim
 * @param userId        - Feel Apps user ID
 * @param roomName      - FEC room name to join
 */
export function init(feelSubsToken: string, fecToken: string, userId: string, roomName: string): void {
  console.log('feel.init')

  DeviceWatch.init(fecToken, userId, roomName)
  apps.init(onDevicesChanged)
  DeviceWatch.onDeviceConnected(() => {
    const socket = getSocket()
    const clientId = socket.id ?? ''
    subs.init({ apiUrl: SUBS_API_URL, apptoken: feelSubsToken, clientId }, apps.playSubtitle)
  })
}

function onDevicesChanged(devices: string[]): void {
  subs.devicesChanged(devices)
}

/**
 * Slider mode — device control only, no subtitles.
 *
 * @param fecToken - FEC JWT with sub claim
 * @param userId   - Feel Apps user ID
 * @param roomName - FEC room name to join
 */
export function initSlider(fecToken: string, userId: string, roomName: string): void {
  DeviceWatch.init(fecToken, userId, roomName)
  apps.init(null)
}

export function destroy(): void {
  apps.destroy()
  destroySocket()
}

export { apps, subs }
