const SERVICE_UUID = 'f60402a6-0293-4bdb-9f20-6758133f7090'
const DATA_CHAR_UUID = '02962ac9-e86f-4094-989d-231d69995fc2'
const COMMAND_CHAR_UUID = 'c7b7a04b-2cc4-40ff-8b10-5d531d1161db'

export class Onyx2 {
  readonly device: BluetoothDevice
  private server: BluetoothRemoteGATTServer | null = null
  private service: BluetoothRemoteGATTService | null = null
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null

  constructor(device: BluetoothDevice) {
    this.device = device
  }

  static get deviceNames(): string[] {
    return ['Onyx2']
  }

  static get services(): string[] {
    return [SERVICE_UUID]
  }

  async connect(): Promise<this> {
    this.server = await this.device.gatt!.connect()
    console.log('Device connected. Getting service...')
    this.service = await this.server.getPrimaryService(SERVICE_UUID)
    console.log('Getting data characteristic...')
    this.dataChar = await this.service.getCharacteristic(DATA_CHAR_UUID)
    console.log('Getting command characteristic...')
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
