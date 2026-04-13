import type { SubsSettings, SubtitleEntry } from '../types'
import * as PlayerLogic from '../subs/PlayerLogic'
import type { SubtitleCallback } from '../subs/PlayerLogic'
import * as Loader from '../subs/Loader'
import * as Parser from '../subs/Parser'

type SubtitleEventCallback = (percentValue: number) => void
type PlaySubtitleFn = (percentValue: number, positionMsec: number, subtitles: SubtitleEntry[]) => void

const subtitleCallbacks: SubtitleEventCallback[] = []

let initialized = false
let onSubtitle: PlaySubtitleFn | null = null
let watchDogTimeout: ReturnType<typeof setTimeout> | null = null
let buffering = false
let playing = false
let previousPos = 0
const SEEK_DISTANCE = 2.0

function emitSubtitleEvent(percentValue: number): void {
  subtitleCallbacks.forEach((cb) => cb(percentValue))
}

const subtitleCallback: SubtitleCallback = (subtitleObj, positionMsec, subtitles) => {
  const percentValue = subtitleObj.subtitle * 25
  emitSubtitleEvent(percentValue)
  onSubtitle?.(percentValue, positionMsec, subtitles)
}

function resetDevice(): void {
  subtitleCallback({ time: 0, subtitle: 0 }, 0, [])
}

function checkInitialized(): void {
  if (!initialized) {
    throw new Error('Please call $feel.init before loading/playing subtitles')
  }
}

function handleVideoSeekEvent(currentPosSec: number): boolean {
  if (Math.abs(currentPosSec - previousPos) > SEEK_DISTANCE) {
    const wasPlaying = playing
    stop()
    if (wasPlaying) play(currentPosSec)
    previousPos = currentPosSec
    return true
  }
  previousPos = currentPosSec
  return false
}

export function play(currentPosSec: number): void {
  checkInitialized()
  const posMsec = Math.floor(currentPosSec * 1000)
  PlayerLogic.play(posMsec, subtitleCallback)
  playing = true
}

export function timeupdate(currentPosSec: number): void {
  checkInitialized()

  if (handleVideoSeekEvent(currentPosSec)) return

  const posMsec = Math.floor(currentPosSec * 1000)
  if (buffering) {
    buffering = false
    PlayerLogic.play(posMsec, subtitleCallback)
  } else {
    PlayerLogic.timeupdate(posMsec, subtitleCallback)
  }

  if (watchDogTimeout) clearTimeout(watchDogTimeout)
  if (playing) {
    watchDogTimeout = setTimeout(() => {
      PlayerLogic.stop()
      buffering = true
    }, 1_000)
  }
}

export function stop(): void {
  checkInitialized()
  PlayerLogic.stop()
  resetDevice()
  if (watchDogTimeout) clearTimeout(watchDogTimeout)
  playing = false
}

export async function load(
  videoId: string,
  subtitlesId: number | string,
  externalUserId: string | null,
  channel = '',
): Promise<void> {
  console.log('webbl.Subs.load')
  checkInitialized()
  const subtitlesData = await Loader.loadSubtitlesInfo(videoId, subtitlesId, externalUserId, channel)
  const subtitleMap = Parser.parse(subtitlesData.text)
  PlayerLogic.setSubtitles(subtitleMap)
  if (playing) PlayerLogic.play(0, subtitleCallback)
}

export function init(settings: SubsSettings, onPlaySubtitle: PlaySubtitleFn): void {
  console.log('webbl.Subs.init')
  Loader.init(settings)
  onSubtitle = onPlaySubtitle
  initialized = true
}

export function onSubtitleEvent(callback: SubtitleEventCallback): void {
  subtitleCallbacks.push(callback)
}

export function offSubtitleEvent(callback: SubtitleEventCallback): void {
  const idx = subtitleCallbacks.indexOf(callback)
  if (idx !== -1) subtitleCallbacks.splice(idx, 1)
}
