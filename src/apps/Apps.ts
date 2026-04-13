import type { SubtitleEntry, DrsInfo } from '../types'
import * as Status from './Status'
import * as RoomConnection from './PubnubRoomConnection'
import * as SubsSubs from '../subs/Subs'
import appsSettings from './AppsSettings'
import { getSocket } from '../FecSocket'

type DevicesChangedCallback = (devices: string[]) => void

async function getUserConnectionInfo(): Promise<DrsInfo> {
  const url =
    `${appsSettings.apiUrl}/internal-api/v1/user/${appsSettings.userId}/drs` +
    `?partner_token=${appsSettings.partnerToken}`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`DRS request failed: ${response.statusText}`)
  return response.json() as Promise<DrsInfo>
}

export function setServerUrl(url: string): void {
  appsSettings.apiUrl = url
}

export function init(onDevicesChanged: DevicesChangedCallback | null): void {
  console.log('App.init')

  // Reuse the FEC socket opened by DeviceWatch
  const socket = getSocket()

  SubsSubs.setClientId(socket.id ?? '')
  Status.init(socket, appsSettings, onDevicesChanged)

  getUserConnectionInfo()
    .then((drsInfo) => {
      const drsRoomName = drsInfo.drs_room.drs_id
      RoomConnection.connect(socket, drsRoomName)
    })
    .catch((err) => console.log(err))
}

export function destroy(): void {
  RoomConnection.disconnect()
  Status.disconnect()
  appsSettings.partnerToken = ''
  appsSettings.userId = ''
}

export function playSubtitle(
  percentValue: number,
  positionMsec: number,
  subtitles: SubtitleEntry[],
): void {
  RoomConnection.send(percentValue, null, positionMsec, subtitles)
}

export function getMobileAppLaunchUrl(requestToken: string): string {
  return 'feelapp://authorize?token=' + encodeURIComponent(requestToken)
}

export { Status as status, RoomConnection as data }
