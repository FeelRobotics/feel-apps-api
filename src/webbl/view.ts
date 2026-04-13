import { connectDevice } from './connect'

type DeviceWithWrite = { write(percent: number): Promise<void>; device: BluetoothDevice }

let device: DeviceWithWrite | null = null

function loadView(): void {
  const panelDiv = document.createElement('div')
  panelDiv.innerHTML = `
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
      #web-bl-panel {
        width:32px; height:80px; background:white; border:1px solid black;
        color:black; font-weight:bold; text-align:center; padding-top:4px;
        position:fixed; top:50%; right:0; z-index:99999;
      }
      .wbp-column-wrapper { height:32px; width:8px; background:#CFD8DC; transform:rotate(180deg); margin:8px auto; }
      .wbp-column { width:8px; height:0%; background:#000; }
    </style>
    <div id="web-bl-panel">
      <a href="#" id="web-bl-panel-connect">
        <i class="material-icons" id="wbp-icon">bluetooth</i>
      </a>
      <div class="wbp-column-wrapper">
        <div class="wbp-column" id="wbp-column"></div>
      </div>
    </div>`

  document.body.appendChild(panelDiv)

  document.getElementById('web-bl-panel-connect')!.onclick = () => {
    if (device) {
      device.device.gatt?.disconnect()
      device = null
    }
    document.getElementById('wbp-icon')!.innerHTML = 'bluetooth_searching'

    connectDevice()
      .then((connDevice) => {
        device = connDevice as DeviceWithWrite
        document.getElementById('wbp-icon')!.innerHTML = 'bluetooth_connected'
        device.device.addEventListener('gattserverdisconnected', () => {
          document.getElementById('wbp-icon')!.innerHTML = 'bluetooth'
        })
      })
      .catch((err) => {
        console.error(err)
        document.getElementById('wbp-icon')!.innerHTML = 'bluetooth'
      })
  }
}

export function show(): void {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadView()
  } else {
    document.addEventListener('DOMContentLoaded', loadView, false)
  }
}

export function onSub(percent: number): void {
  const col = document.getElementById('wbp-column')
  if (col) col.style.height = `${percent}%`
  device?.write(percent)
}
