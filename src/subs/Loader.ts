import type { SubsSettings } from '../types';

interface SubtitlesResponse {
  session_id: string | number;
  text: string;
  [key: string]: unknown;
}

let settings: SubsSettings = { apiUrl: '', apptoken: '', clientId: '' };

export function init(newSettings: SubsSettings): void {
  settings = newSettings;
}

/** Update the client ID after the FEC socket connects (socket.id becomes available). */
export function setClientId(clientId: string): void {
  settings = { ...settings, clientId };
}

export async function loadSubtitlesInfo(
  videoId: string,
  subtitlesId: number | string,
  externalUserId: string | null,
  channel: string,
  signal?: AbortSignal,
): Promise<SubtitlesResponse> {
  const id = parseInt(String(subtitlesId), 10);
  const params = new URLSearchParams();
  params.set('apptoken', settings.apptoken);
  if (externalUserId) params.set('external_user_id', externalUserId);
  if (channel) params.set('channel', channel);
  // Keep the legacy query-param name for backward compatibility with the backend
  if (settings.clientId) params.set('pubnub_uuid', settings.clientId);

  const url = `${settings.apiUrl}/videos/${encodeURIComponent(videoId)}/subtitles/${id}?${params}`;

  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Failed to load subtitles: ${response.statusText}`);
  return response.json() as Promise<SubtitlesResponse>;
}
