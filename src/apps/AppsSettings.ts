import type { AppsSettingsData } from '../types';

const settingsProd: AppsSettingsData = {
  apiUrl: 'https://api.feel-app.com',
  subtitlesUrl: 'https://api.pibds.com/api/v1',
  partnerToken: '',
  userId: '',
  fecUrl: 'https://fec.feelme.com',
  roomName: '',
};

const settingsStaging: AppsSettingsData = {
  apiUrl: 'https://stg-api.feel-app.com',
  subtitlesUrl: 'https://api-subtitles.feel-app.com/api/v1',
  partnerToken: '',
  userId: '',
  fecUrl: 'https://fec-stg.feelme.com',
  roomName: '',
};

const settingsDev: AppsSettingsData = {
  apiUrl: 'https://api.feel-app.com',
  subtitlesUrl: 'https://api.pibds.com/api/v1',
  partnerToken: '',
  userId: '',
  fecUrl: '192.168.6.243:8000',
  roomName: '',
};

// Controlled by the FEEL_ENV build-time variable.
// Set it when building: FEEL_ENV=staging npm run build
const env = (process.env.FEEL_ENV ?? 'staging') as 'prod' | 'staging' | 'dev'; // TODO: revert default to 'prod'

const settings: AppsSettingsData =
  env === 'dev'
    ? settingsDev
    : env === 'staging'
      ? settingsStaging
      : settingsProd;

export default settings;
