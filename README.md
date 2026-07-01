# @feelrobotics/feel-apps-api

JavaScript/TypeScript library for real-time haptic feedback and device control in Feel Robotics applications.

## Overview

`@feelrobotics/feel-apps-api` synchronizes video playback with haptic subtitle events and communicates with Feel haptic devices in real time over a Socket.IO connection to the Feel Exchange Center (FEC).

## Installation

```bash
npm install @feelrobotics/feel-apps-api
```

## Quick Start

```ts
import { init, destroy, apps, subs } from '@feelrobotics/feel-apps-api'

// Initialize — tokens are provided by your backend
await init(feelSubsToken, fecToken, userId, roomName, {
  fetchToken: async () => {
    const res = await fetch('/api/refresh-fec-token')
    return (await res.json()).fec_token
  },
})

// Load subtitles for a video
await subs.load(videoId, subtitlesId, externalUserId)

// Wire up the HTML5 video element
video.addEventListener('play',       () => subs.play(video.currentTime))
video.addEventListener('timeupdate', () => subs.timeupdate(video.currentTime))
video.addEventListener('pause',      () => subs.stop())

// Clean up when done
destroy()
```

## Modes

| Mode | Function | Use case |
|---|---|---|
| Full | `init()` | Web app with device control + haptic subtitles |
| Slider | `initSlider()` | Direct intensity control only, no subtitle support |

## API Reference

### Top-level

#### `init(feelSubsToken, fecToken, userId, roomName, tokenRefresh?): Promise<void>`
Full initialization. Connects to FEC, starts device monitoring, and sets up subtitle playback once a device connects. The returned promise resolves when the FEC socket connects (not when a device joins).

#### `initSlider(fecToken, userId, roomName, tokenRefresh?): Promise<void>`
Device control without subtitle support. Use `apps.playSubtitle(percent, 0, [])` to send haptic intensity directly.

#### `TokenRefreshOptions`
Both `init` and `initSlider` accept an optional `tokenRefresh` object to keep the FEC connection alive past the token's 24 h TTL. The token is refreshed every 12 h.

| Field | Type | Required | Description |
|---|---|---|---|
| `fetchToken` | `() => string \| Promise<string>` | yes | Returns a fresh FEC JWT |
| `onTokenError` | `(err: Error) => void` | no | Called when `fetchToken` fails |

#### `setServers(servers)`
Override default API endpoints. Must be called before `init`.
```ts
setServers({ apps: 'https://...', subs: 'https://...' })
```

#### `destroy()`
Disconnect the socket and reset all internal state. Call this before re-initialising.

---

### `apps` module

#### `apps.playSubtitle(percentValue, positionMsec, subtitles)`
Send haptic data to connected devices.
- Pass a non-empty `subtitles` array for subtitle-synced haptic playback.
- Pass an empty array `[]` for direct intensity control (slider mode).

```ts
// Subtitle playback — called automatically by the subs module
apps.playSubtitle(75, 1200, subtitleEntries)

// Direct slider control
apps.playSubtitle(percent, 0, [])
```

#### `apps.getMobileAppLaunchUrl(requestToken): string`
Returns a deep link URL to launch the Feel mobile app for pairing.
```ts
const url = apps.getMobileAppLaunchUrl(tokens.authToken)
// "feelapp://authorize?token=..."
```

#### `apps.status.subscribe(callback)` / `apps.status.unsubscribe(callback)`
Listen for device connection status changes.
```ts
const onStatus = ({ online, devices }) => { ... }
apps.status.subscribe(onStatus)
apps.status.unsubscribe(onStatus)
```

#### `apps.data.subscribe(callback)` / `apps.data.unsubscribe(callback)`
Listen for haptic position messages sent by peer devices.
```ts
const onData = (percent, deviceName) => { ... }
apps.data.subscribe(onData)
apps.data.unsubscribe(onData)
```

---

### `subs` module

#### `subs.load(videoId, subtitlesId, externalUserId?, channel?, options?): Promise<void>`
Fetch subtitle data for a video. Waits for a device to connect before loading if none is connected yet. Supports `AbortSignal` for cancellation.
```ts
const controller = new AbortController()
await subs.load(videoId, subtitleId, userId, '', { signal: controller.signal })
controller.abort() // cancel a pending load
```

#### `subs.play(currentPosSec)`
Start subtitle playback from the given video position (in seconds).

#### `subs.timeupdate(currentPosSec)`
Update the current video position. Call on every `timeupdate` event. Handles seek detection and buffering automatically.

#### `subs.stop()`
Stop playback and reset the device to neutral intensity.

#### `subs.onSubtitleEvent(callback)` / `subs.offSubtitleEvent(callback)`
Subscribe to subtitle fire events. The callback receives `percentValue` (0–100).
```ts
const onHaptic = (percent) => setIntensity(percent)
subs.onSubtitleEvent(onHaptic)
subs.offSubtitleEvent(onHaptic)
```

---

## Development

```bash
npm run build      # build the library
npm run dev        # watch mode
npm test           # run tests
npm run lint       # lint with Biome
npm run check:fix  # auto-fix lint and format issues
```

## License

MIT © [Feel Robotics](https://github.com/feelrobotics)
