import type { AppsSettingsData } from '../types'

const settingsProd: AppsSettingsData = {
  apiUrl: 'https://api.feel-app.com',
  subtitlesUrl: 'https://api.pibds.com/api/v1',
  partnerToken: '',
  userId: '',
  // TODO: confirm production FEC URL
  fecUrl: 'https://fec.feel-app.com',
}

const settingsStaging: AppsSettingsData = {
  apiUrl: 'https://stg-api.feel-app.com',
  subtitlesUrl: 'https://api-subtitles.feel-app.com/api/v1',
  partnerToken: '',
  userId: '',
  // TODO: confirm staging FEC URL
  fecUrl: 'https://stg-fec.feel-app.com',
}

const settingsDev: AppsSettingsData = {
  apiUrl: 'http://0.0.0.0:5000',
  subtitlesUrl: '',
  partnerToken: '',
  userId: '',
  fecUrl: 'http://0.0.0.0:8000',
}

// Change to 'staging' or 'dev' for non-production environments
const env: 'prod' | 'staging' | 'dev' = ('prod' as 'prod' | 'staging' | 'dev')

const settings: AppsSettingsData =
  env === 'dev' ? settingsDev : env === 'staging' ? settingsStaging : settingsProd

export default settings
