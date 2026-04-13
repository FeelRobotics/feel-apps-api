const SERVICE_UUID = '00001900-0000-1000-8000-00805f9b34fb'
const COMMAND_CHAR_UUID = 0x1902

export abstract class ESP32CommonDevice {
  protected device: BluetoothDevice
  protected server: BluetoothRemoteGATTServer | null = null
  protected service: BluetoothRemoteGATTService | null = null
  protected commandChar: BluetoothRemoteGATTCharacteristic | null = null

  constructor(device: BluetoothDevice) {
    this.device = device
  }

  static get services(): string[] {
    return [SERVICE_UUID]
  }

  async connect(): Promise<this> {
    const server = await this.device.gatt!.connect()
    this.server = server
    console.log('Device connected. Getting service...')

    this.service = await server.getPrimaryService(SERVICE_UUID)
    console.log('Getting command characteristic...')

    this.commandChar = await this.service.getCharacteristic(COMMAND_CHAR_UUID)
    console.log('Done.')
    return this
  }

  disconnect(): void {
    if (this.device.gatt?.connected) {
      this.device.gatt.disconnect()
    }
  }

  protected writeCommandChar(array: Uint8Array): Promise<void> {
    return this.commandChar!.writeValue(array.buffer as ArrayBuffer)
  }

  abstract write(percent: number): Promise<void>
}
