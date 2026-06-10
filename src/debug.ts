let enabled = false;

export function setDebug(value: boolean): void {
  enabled = value;
}

export function log(...args: unknown[]): void {
  if (enabled) console.log(...args);
}

export function warn(...args: unknown[]): void {
  if (enabled) console.warn(...args);
}

export function error(...args: unknown[]): void {
  if (enabled) console.error(...args);
}
