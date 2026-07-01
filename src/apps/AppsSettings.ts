export const DEFAULT_CONTROL_PLANE_API_URL = 'https://api.feel-app.com';
export const DEFAULT_FEC_URL = 'https://fec.feelme.com';

let apiUrl = DEFAULT_CONTROL_PLANE_API_URL;
const fecUrl = DEFAULT_FEC_URL;
let userId = '';
let roomName = '';

export function getApiUrl(): string {
  return apiUrl;
}
export function setApiUrl(url: string): void {
  apiUrl = url;
}
export function resetApiUrl(): void {
  apiUrl = DEFAULT_CONTROL_PLANE_API_URL;
}

export function getFecUrl(): string {
  return fecUrl;
}

export function getUserId(): string {
  return userId;
}
export function setUserId(id: string): void {
  userId = id;
}

export function getRoomName(): string {
  return roomName;
}
export function setRoomName(name: string): void {
  roomName = name;
}
