const SENSOR_SERVICE_UUID = '88f82580-0000-01e6-aace-0002a5d5c51b'
const MOTOR_CHAR_UUID = '88f82581-0000-01e6-aace-0002a5d5c51b'

export class Fuse {
  readonly device: BluetoothDevice
  private server: BluetoothRemoteGATTServer | null = null
  private sensorService: BluetoothRemoteGATTService | null = null
  private motorChar: BluetoothRemoteGATTCharacteristic | null = null

  constructor(device: BluetoothDevice) {
    this.device = device
  }

  static get deviceNames(): string[] {
    return ['Fuse']
  }

  static get services(): string[] {
    return [SENSOR_SERVICE_UUID]
  }

  async connect(): Promise<this> {
    this.server = await this.device.gatt!.connect()
    console.log('Device connected. Getting service...')
    this.sensorService = await this.server.getPrimaryService(SENSOR_SERVICE_UUID)
    console.log('Getting motor characteristic...')
    this.motorChar = await this.sensorService.getCharacteristic(MOTOR_CHAR_UUID)
    console.log('Done.')
    return this
  }

  disconnect(): void {
    if (this.device.gatt?.connected) this.device.gatt.disconnect()
  }

  async write(percent: number): Promise<void> {
    const value = Math.max(0, Math.min(100, Math.round(percent)))
    await this.motorChar!.writeValue(new Uint8Array([value, value, 0]))
  }
}
