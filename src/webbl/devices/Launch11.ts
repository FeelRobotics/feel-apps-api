import { ESP32CommonDevice } from './ESP32CommonDevice'

export class Launch11 extends ESP32CommonDevice {
  static get deviceNames(): string[] {
    return ['Launch1.1']
  }

  async write(percent: number): Promise<void> {
    const pos = Math.floor(percent)
    return this.writeCommandChar(Uint8Array.from([0x03, 0x00, 0x64, pos]))
  }
}
