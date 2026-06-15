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
  if (isNaN(id))
    throw new Error(`subtitlesId must be numeric, got: ${subtitlesId}`);
  const params = new URLSearchParams();
  params.set('apptoken', settings.apptoken);
  if (externalUserId) params.set('external_user_id', externalUserId);
  if (channel) params.set('channel', channel);
  if (settings.clientId) params.set('pubnub_uuid', settings.clientId);

  const url = `${settings.apiUrl}/videos/${encodeURIComponent(videoId)}/subtitles/${id}?${params}`;

  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Failed to load subtitles: ${response.statusText}`);
  const data = (await response.json()) as SubtitlesResponse;
  if (typeof data.text !== 'string')
    throw new Error('Subtitles API returned unexpected response shape');
  return data;
}
