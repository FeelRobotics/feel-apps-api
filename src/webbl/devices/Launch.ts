const SERVICE_UUID = '88f80580-0000-01e6-aace-0002a5d5c51b'
const DATA_CHAR_UUID = '88f80581-0000-01e6-aace-0002a5d5c51b'
const COMMAND_CHAR_UUID = '88f80583-0000-01e6-aace-0002a5d5c51b'

export class Launch {
  readonly device: BluetoothDevice
  private server: BluetoothRemoteGATTServer | null = null
  private service: BluetoothRemoteGATTService | null = null
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null

  constructor(device: BluetoothDevice) {
    this.device = device
  }

  static get deviceNames(): string[] {
    return ['Launch']
  }

  static get services(): string[] {
    return [SERVICE_UUID]
  }

  async connect(): Promise<this> {
    this.server = await this.device.gatt!.connect()
    console.log('Device connected. Getting service...')
    this.service = await this.server.getPrimaryService(SERVICE_UUID)
    this.dataChar = await this.service.getCharacteristic(DATA_CHAR_UUID)
    this.commandChar = await this.service.getCharacteristic(COMMAND_CHAR_UUID)
    console.log('Done.')
    return this
  }

  disconnect(): void {
    if (this.device.gatt?.connected) this.device.gatt.disconnect()
  }

  async write(percent: number): Promise<void> {
    await this.commandChar!.writeValue(new Uint8Array([0]))
    const value = Math.max(5, Math.min(99, Math.round(percent)))
    await this.dataChar!.writeValue(new Uint8Array([value, 0x63]))
  }
}
