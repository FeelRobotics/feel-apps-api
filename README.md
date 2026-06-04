# feel-apps-api

JavaScript/TypeScript library for real-time haptic feedback and device control in Feel Robotics applications.

## Overview

`feel-apps-api` synchronizes video playback with haptic subtitle events and communicates with Feel haptic devices in real time over a Socket.IO connection to the Feel Exchange Center (FEC).

## Installation

```bash
npm install @feelrobotics/feel-apps-api
```

## Build

```bash
npm run build
```

The library outputs ESM, CommonJS, and IIFE bundles. The IIFE global is `$feel`.

| Endpoint | URL |
|---|---|
| API | api.feel-app.com |
| Subtitles | api-subtitles.feel-app.com |
| FEC | fec.feelme.com |

## Quick Start

```ts
import { init, destroy, apps, subs } from '@feelrobotics/feel-apps-api'

// Initialize with all tokens
await init(feelSubsToken, fecToken, userId, roomName)

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

#### `init(feelSubsToken, fecToken, userId, roomName): Promise<void>`
Full initialization. Connects to FEC, starts device monitoring, and sets up subtitle playback once a device connects. The returned promise resolves when the FEC socket connects (not when a device joins).

#### `initSlider(fecToken, userId, roomName): Promise<void>`
Device control without subtitle support. Use `apps.playSubtitle(percent, 0, [])` to send haptic intensity directly.

#### `setServers(servers)`
Override default API endpoints. Must be called before `init`.
```ts
setServers({ apps: 'https://...', subs: 'https://...' })
```

#### `destroy()`
Disconnect the socket and reset all internal state. Call this before re-initialising.

#### `setDebug(enabled: boolean)`
Enable or disable debug logging to the console.

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

// Clean up
apps.status.unsubscribe(onStatus)
```

#### `apps.data.subscribe(callback)` / `apps.data.unsubscribe(callback)`
Listen for haptic position messages sent by peer devices.
```ts
const onData = (percent, deviceName) => { ... }
apps.data.subscribe(onData)

// Clean up
apps.data.unsubscribe(onData)
```

---

### `subs` module

#### `subs.load(videoId, subtitlesId, externalUserId?, channel?, options?): Promise<void>`
Fetch subtitle data for a video. Waits for a device to connect before loading if none is connected yet. Supports `AbortSignal` for cancellation.
```ts
const controller = new AbortController()
await subs.load(videoId, subtitleId, userId, '', { signal: controller.signal })

// Cancel a pending load
controller.abort()
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

// Clean up
subs.offSubtitleEvent(onHaptic)
```

---

## Development

```bash
npm run dev        # watch mode
npm test           # run tests
npm run lint       # lint with Biome
npm run check      # lint + format check
npm run check:fix  # auto-fix lint and format issues
```

## License

Copyright © Feel Robotics. All rights reserved.
