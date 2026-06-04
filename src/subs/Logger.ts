import * as debug from '../debug';
import type { SubsSettings } from '../types';

let settings: SubsSettings = { apiUrl: '', apptoken: '', clientId: '' };
let sessionId: number | null = null;
let devices: string[] = [];
let isIntervalActive = false;

export function init(newSettings: SubsSettings): void {
  settings = newSettings;
}

export function setSessionId(id: string | number): void {
  sessionId = parseInt(String(id), 10);
}

export function startInterval(currentTimeMsec: number): void {
  isIntervalActive = true;
  writeIntervalStart(currentTimeMsec);
}

export function endInterval(): void {
  isIntervalActive = false;
  writeIntervalEnd();
}

export function devicesChanged(
  newDevices: string[],
  currentTimeMsec: number,
): void {
  const same =
    newDevices.length === devices.length &&
    newDevices.every((device, i) => device === devices[i]);

  if (same) return;

  devices = newDevices;
  if (isIntervalActive) writeIntervalStart(currentTimeMsec);
}

function sessionUrl(endpoint: string): string {
  return `${settings.apiUrl}/sessions/${sessionId}/${endpoint}`;
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${settings.apptoken}` };
}

function writeIntervalStart(intervalStartMsec: number): void {
  if (sessionId === null) return;
  fetch(sessionUrl('start'), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: intervalStartMsec / 1000, devices }),
  }).catch(debug.error);
}

function writeIntervalEnd(): void {
  if (sessionId === null) return;
  fetch(sessionUrl('end'), {
    method: 'POST',
    headers: authHeaders(),
  }).catch(debug.error);
}
