import type { SubtitleEntry } from '../types';
import { MESSAGE_TYPE, SOCKET_EVENT } from '../constants';

const mockSubtitleChunkPlay = jest.fn();
const mockSubtitleChunkReset = jest.fn();
jest.mock('../apps/SubtitleChunkPlayer', () => ({
  play: mockSubtitleChunkPlay,
  reset: mockSubtitleChunkReset,
}));

jest.mock('../apps/AppsSettings', () => ({
  default: { userId: 'user1' },
}));

// MessageQueue and PercentArrayFilter are pure in-memory — use the real modules
import * as RoomConnection from '../apps/RoomConnection';
import * as MessageQueue from '../apps/MessageQueue';

const makeSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  id: 'sock1',
});

beforeEach(() => {
  jest.clearAllMocks();
  RoomConnection.disconnect();
  MessageQueue.reset('room1');
  MessageQueue.endSending('room1');
});

describe('send() — routing', () => {
  it('uses SubtitleChunkPlayer when subtitles are non-empty', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    const subtitles: SubtitleEntry[] = [{ time: 1000, subtitle: 2 }];

    RoomConnection.send(75, 500, subtitles);

    expect(mockSubtitleChunkPlay).toHaveBeenCalledWith(500, subtitles, socket, 'room1');
    expect(MessageQueue.getMessages('room1')).toEqual([]);
  });

  it('emits device:position when subtitles are empty — slider use case', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');

    RoomConnection.send(75, 0, []);

    expect(socket.emit).toHaveBeenCalledWith(
      SOCKET_EVENT.MESSAGE,
      expect.objectContaining({
        message_type: MESSAGE_TYPE.DEVICE_POSITION,
        data: expect.objectContaining({ what: 'device_percent', payload: 75 }),
      }),
      expect.any(Function),
    );
    expect(mockSubtitleChunkPlay).not.toHaveBeenCalled();
  });

  it('does nothing when socket is not connected yet', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    RoomConnection.send(50, 0, []);
    expect(MessageQueue.getMessages('room1')).toEqual([]);
    expect(mockSubtitleChunkPlay).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('connect() / disconnect()', () => {
  it('registers a message handler on connect', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    expect(socket.on).toHaveBeenCalledWith(SOCKET_EVENT.MESSAGE, expect.any(Function));
  });

  it('emits room:leave and removes the message handler on disconnect', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    RoomConnection.disconnect();
    expect(socket.emit).toHaveBeenCalledWith(SOCKET_EVENT.ROOM_LEAVE, { room_name: 'room1' });
    expect(socket.off).toHaveBeenCalledWith(SOCKET_EVENT.MESSAGE, expect.any(Function));
  });

  it('resets SubtitleChunkPlayer on disconnect', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    RoomConnection.disconnect();
    expect(mockSubtitleChunkReset).toHaveBeenCalled();
  });
});

describe('incoming message handling', () => {
  function getMessageHandler(socket: ReturnType<typeof makeSocket>) {
    return socket.on.mock.calls.find(([e]) => e === SOCKET_EVENT.MESSAGE)?.[1] as
      (payload: unknown) => void;
  }

  it('fires subscribers with percent and deviceName on device:position', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    const cb = jest.fn();
    RoomConnection.subscribe(cb);

    const handler = getMessageHandler(socket);
    handler({
      message_type: MESSAGE_TYPE.DEVICE_POSITION,
      data: { what: 'device_percent', payload: 80, from: 'remote' },
    });

    expect(cb).toHaveBeenCalledWith(80, 'remote');
    RoomConnection.unsubscribe(cb);
  });

  it('does not throw when device:position data is null', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');
    const cb = jest.fn();
    RoomConnection.subscribe(cb);

    const handler = getMessageHandler(socket);
    expect(() => handler({ message_type: MESSAGE_TYPE.DEVICE_POSITION, data: null })).not.toThrow();
    expect(cb).not.toHaveBeenCalled();
    RoomConnection.unsubscribe(cb);
  });

  it('resets SubtitleChunkPlayer when a peer joins the room', () => {
    const socket = makeSocket();
    RoomConnection.connect(socket as any, 'room1');

    const handler = getMessageHandler(socket);
    handler({ message_type: MESSAGE_TYPE.WEBSHARE_PRESENCE, data: { action: 'join' } });

    expect(mockSubtitleChunkReset).toHaveBeenCalled();
  });
});
