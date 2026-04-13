import type { SubsSettings } from '../types'

let settings: SubsSettings = { apiUrl: '', apptoken: '', clientId: '' }
let sessionId: number | null = null
let devices: string[] = []
let intervalStarted = false

export function init(newSettings: SubsSettings): void {
  settings = newSettings
}

export function setSessionId(id: string | number): void {
  sessionId = parseInt(String(id), 10)
}

export function startInterval(currentTimeMsec: number): void {
  intervalStarted = true
  writeIntervalStart(currentTimeMsec)
}

export function endInterval(): void {
  intervalStarted = false
  writeIntervalEnd()
}

export function devicesChanged(newDevices: string[], currentTimeMsec: number): void {
  const same =
    newDevices.length === devices.length &&
    newDevices.every((d, i) => d === devices[i])

  if (same) return

  devices = newDevices
  if (intervalStarted) writeIntervalStart(currentTimeMsec)
}

function writeIntervalStart(intervalStartMsec: number): void {
  if (sessionId === null) return
  const url = `${settings.apiUrl}/sessions/${sessionId}/start?apptoken=${settings.apptoken}`
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: intervalStartMsec / 1000, devices }),
  }).catch(console.error)
}

function writeIntervalEnd(): void {
  if (sessionId === null) return
  const url = `${settings.apiUrl}/sessions/${sessionId}/end?apptoken=${settings.apptoken}`
  fetch(url, { method: 'POST' }).catch(console.error)
}
