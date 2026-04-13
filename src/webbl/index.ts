import * as Subs from './Subs'
import * as view from './view'

// Production
// const SUBS_API_URL = 'https://api.pibds.com/api/v1'
// Staging
const SUBS_API_URL = 'https://api-subtitles.feel-app.com/api/v1'

export function init(feelSubsToken: string): void {
  console.log('webbl.init')

  Subs.init(
    { apiUrl: SUBS_API_URL, apptoken: feelSubsToken, pubnubUUID: '' },
    (percent) => view.onSub(percent),
  )
  view.show()
}

export function destroy(): void {
  // placeholder for future cleanup
}

export { Subs as subs }
