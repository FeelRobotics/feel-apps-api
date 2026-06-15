import type { Socket } from 'socket.io-client';

// Mock FecSocket so we control the socket object
const mockSocket = {
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
};
jest.mock('../FecSocket', () => ({
  initSocket: jest.fn(() => mockSocket),
}));

// Mock AppsSettings — DeviceWatch writes userId/roomName to it
jest.mock('../apps/AppsSettings', () => ({
  getFecUrl: jest.fn(() => 'https://fec.test'),
  setUserId: jest.fn(),
  setRoomName: jest.fn(),
}));

import { MESSAGE_TYPE, SOCKET_EVENT } from '../constants';
import * as DeviceWatch from '../DeviceWatch';

// Helper: grab the handler registered for a given socket event
function captureHandler(event: string): (...args: unknown[]) => void {
  const call =
    mockSocket.on.mock.calls.find(([e]) => e === event) ??
    mockSocket.once.mock.calls.find(([e]) => e === event);
  if (!call) throw new Error(`No handler registered for "${event}"`);
  return call[1] as (...args: unknown[]) => void;
}

beforeEach(() => {
  jest.clearAllMocks();
  DeviceWatch.reset();
});

describe('init()', () => {
  it('throws if called twice without reset', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    expect(() => DeviceWatch.init('tok', 'user1', 'room1')).toThrow(
      'already initialized',
    );
  });

  it('resolves when socket emits connect', async () => {
    const promise = DeviceWatch.init('tok', 'user1', 'room1');
    const connectHandler = captureHandler(SOCKET_EVENT.CONNECT);
    connectHandler();
    await expect(promise).resolves.toBeUndefined();
  });

  it('registers a message handler on the socket', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    expect(mockSocket.on).toHaveBeenCalledWith(
      SOCKET_EVENT.MESSAGE,
      expect.any(Function),
    );
  });
});

describe('reset()', () => {
  it('allows re-initialisation after destroy', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    DeviceWatch.reset();
    expect(() => DeviceWatch.init('tok', 'user1', 'room1')).not.toThrow();
  });

  it('clears wasDeviceConnected', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    // Simulate device join
    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'join' },
    });
    expect(DeviceWatch.wasDeviceConnected()).toBe(true);

    DeviceWatch.reset();
    expect(DeviceWatch.wasDeviceConnected()).toBe(false);
  });

  it('clears registered onDeviceConnected callbacks', () => {
    const cb = jest.fn();
    DeviceWatch.onDeviceConnected(cb);
    DeviceWatch.reset();

    // Re-init and trigger device join — old callback must NOT fire
    DeviceWatch.init('tok', 'user1', 'room1');
    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'join' },
    });
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('onDeviceConnected()', () => {
  it('fires callback when device joins', () => {
    const cb = jest.fn();
    DeviceWatch.onDeviceConnected(cb);
    DeviceWatch.init('tok', 'user1', 'room1');

    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'join' },
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('calls socket.off after first join — self-removes from socket', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'join' },
    });
    expect(mockSocket.off).toHaveBeenCalledWith(
      SOCKET_EVENT.MESSAGE,
      messageHandler,
    );
  });

  it('does not fire for non-presence messages', () => {
    const cb = jest.fn();
    DeviceWatch.onDeviceConnected(cb);
    DeviceWatch.init('tok', 'user1', 'room1');

    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({ message_type: MESSAGE_TYPE.DEVICE_POSITION, data: {} });
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not fire for presence leave', () => {
    const cb = jest.fn();
    DeviceWatch.onDeviceConnected(cb);
    DeviceWatch.init('tok', 'user1', 'room1');

    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'leave' },
    });
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('wasDeviceConnected()', () => {
  it('returns false before any device joins', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    expect(DeviceWatch.wasDeviceConnected()).toBe(false);
  });

  it('returns true after device joins', () => {
    DeviceWatch.init('tok', 'user1', 'room1');
    const messageHandler = captureHandler(SOCKET_EVENT.MESSAGE);
    messageHandler({
      message_type: MESSAGE_TYPE.SYSTEM_PRESENCE,
      data: { action: 'join' },
    });
    expect(DeviceWatch.wasDeviceConnected()).toBe(true);
  });
});
