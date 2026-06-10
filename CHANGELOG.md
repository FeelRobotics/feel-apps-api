# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-10

### Fixed
- `BillingSession`: `room:join` payload corrected from a plain string to `{ room_name }` object to match FEC schema — billing room was silently never joined in all previous versions

## [1.0.4] - 2026-06-04

### Security
- Clamp haptic intensity to 0–100% so out-of-range API values cannot reach the device
- Validate `subtitlesId` is numeric before making network requests
- Add input validation to `init()` and `initSlider()` for all required parameters

### Fixed
- `destroy()` now resets custom server URLs set via `setServers()` back to defaults
- `jest.config.js` renamed to `jest.config.cjs` to match `"type": "module"` in package.json

### Changed
- Internal settings store refactored from a mutable exported object to encapsulated getter/setter functions
- Removed unused types `DeviceToDeviceMessageV1`, `DeviceToDeviceMessageV2`, `RoomMessage`, `DrsInfo`, `UserDevicesResponse` from public API surface

## [1.0.3] - 2025-01-01

### Added
- Initial public release
