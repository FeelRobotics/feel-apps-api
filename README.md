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
import { init, subs } from '@feelrobotics/feel-apps-api'

// Initialize with all tokens
await init(feelSubsToken, fecToken, userId, roomName)

// Load subtitles for a video
await subs.load(videoId, subtitlesId, externalUserId)

// Wire up the HTML5 video element
video.addEventListener('play', () => subs.play(video.currentTime))
video.addEventListener('timeupdate', () => subs.timeupdate(video.currentTime))
video.addEventListener('pause', () => subs.stop())
```

## Modes

| Mode | Function | Use case |
|---|---|---|
| Full | `init()` | Web app with device control + haptic subtitles |
| Slider | `initSlider()` | Device control only, no subtitle support |

## API Reference

### Top-level

#### `init(feelSubsToken, fecToken, userId, roomName)`
Full initialization. Connects to FEC, starts device monitoring, and sets up subtitle playback once a device connects.

#### `initSlider(fecToken, userId, roomName)`
Device control without subtitle support.

#### `setServers(servers)`
Override default API endpoints before calling `init`.
```ts
setServers({ apps: 'https://...', subs: 'https://...' })
```

#### `destroy()`
Disconnect the socket and reset all state.

### `apps` module

#### `apps.playSubtitle(percentValue, positionMsec, subtitles)`
Send a haptic subtitle event directly to connected devices.

#### `apps.status.subscribe(callback)`
Listen for device connection status changes.
```ts
apps.status.subscribe(({ online, devices }) => { ... })
```

#### `apps.data.subscribe(callback)`
Listen for haptic position messages from peer devices.
```ts
apps.data.subscribe((percent, deviceName) => { ... })
```

### `subs` module

#### `subs.load(videoId, subtitlesId, externalUserId?, channel?)`
Fetch subtitle data for a video. Returns a Promise.

#### `subs.play(currentPosSec)`
Start subtitle playback from the given video position (seconds).

#### `subs.timeupdate(currentPosSec)`
Update the current video position. Call on every `timeupdate` event. Handles seek detection automatically.

#### `subs.stop()`
Stop playback and reset device to neutral.

#### `subs.onSubtitleEvent(callback)`
Subscribe to subtitle fire events. Callback receives `percentValue` (0–100).

#### `subs.offSubtitleEvent(callback)`
Unsubscribe from subtitle events.

## Development

```bash
npm run dev   # watch mode
npm test      # run tests
```

## License

Copyright © Feel Robotics. All rights reserved.
