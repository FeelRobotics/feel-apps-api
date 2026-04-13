export interface QueuedValue {
  value: number
  /** Target device ID. Empty string means broadcast to all devices. */
  to?: string
}

const sendingInProgress: Record<string, boolean> = {}
const queues: Record<string, QueuedValue[]> = {}

export function push(channel: string, message: QueuedValue): void {
  if (!queues[channel]) queues[channel] = []
  queues[channel].push(message)
}

export function isSendingInProgress(channel: string): boolean {
  return sendingInProgress[channel] ?? false
}

export function startSending(channel: string): void {
  sendingInProgress[channel] = true
}

export function endSending(channel: string): void {
  sendingInProgress[channel] = false
}

export function getMessages(channel: string): QueuedValue[] {
  return queues[channel] ?? []
}

export function reset(channel: string): void {
  queues[channel] = []
}

export function isEmpty(channel: string): boolean {
  return (queues[channel] ?? []).length === 0
}
