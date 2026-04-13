import { Fuse } from './devices/Fuse'
import { Onyx2 } from './devices/Onyx2'
import { Launch } from './devices/Launch'
import { Launch11 } from './devices/Launch11'
import { Titan11 } from './devices/Titan11'
import { Onyx21 } from './devices/Onyx21'
import type { ESP32CommonDevice } from './devices/ESP32CommonDevice'

type AnyDevice = Fuse | Onyx2 | Launch | Launch11 | Titan11 | Onyx21

interface DeviceClass {
  deviceNames: string[]
  services: string[]
  new (device: BluetoothDevice): AnyDevice
}

const deviceClasses: DeviceClass[] = [
  Fuse as unknown as DeviceClass,
  Onyx2 as unknown as DeviceClass,
  Launch as unknown as DeviceClass,
  Launch11 as unknown as DeviceClass,
  Titan11 as unknown as DeviceClass,
  Onyx21 as unknown as DeviceClass,
]

export function getAllDeviceNames(): string[] {
  return deviceClasses.flatMap((cls) => cls.deviceNames)
}

export function createDevice(webBleDevice: BluetoothDevice): AnyDevice | null {
  const name = webBleDevice.name ?? ''
  for (const Cls of deviceClasses) {
    if (Cls.deviceNames.includes(name)) {
      return new Cls(webBleDevice)
    }
  }
  return null
}

export async function connectDevice(): Promise<AnyDevice> {
  const filters = getAllDeviceNames().map((name) => ({ name }))
  const optionalServices = deviceClasses.flatMap((cls) => cls.services)

  console.log('allDevices', filters)
  console.log('allServices', optionalServices)

  console.log('Selecting device')
  const bleDevice = await navigator.bluetooth.requestDevice({ filters, optionalServices })
  console.log(
    `Device selected. Name: ${bleDevice.name}, id: ${bleDevice.id}, connected: ${bleDevice.gatt?.connected}. Connecting...`,
  )

  const deviceWrapper = createDevice(bleDevice)
  if (!deviceWrapper) throw new Error(`Unsupported device: ${bleDevice.name}`)

  console.log('Device has been created', deviceWrapper)
  return deviceWrapper.connect()
}
