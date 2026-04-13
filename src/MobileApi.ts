/**
 * Used when the library runs inside the Feel mobile app's embedded webview.
 * Instead of sending haptic values over PubNub, it posts a message to the
 * parent frame which the native app listens to.
 */
export function playSubtitle(percentValue: number): void {
  console.log('subtitle percent value: ', percentValue)
  window.parent.postMessage({ what: 'write', percent: percentValue }, '*')
}
