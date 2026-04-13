import { ESP32CommonDevice } from './ESP32CommonDevice'

export class Titan11 extends ESP32CommonDevice {
  static get deviceNames(): string[] {
    return ['Titan1.1']
  }

  async write(percent: number): Promise<void> {
    const pos = Math.floor(percent)
    return this.writeCommandChar(Uint8Array.from([0x01, pos]))
  }
}
