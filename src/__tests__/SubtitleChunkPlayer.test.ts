import { play, reset } from '../apps/SubtitleChunkPlayer';
import type { SubtitleEntry } from '../types';

const makeSocket = () => ({ emit: jest.fn(), id: 'sock1' });
const sub = (time: number): SubtitleEntry => ({ time, subtitle: 1 });

beforeEach(() => reset());

describe('SubtitleChunkPlayer — empty subtitles condition', () => {
  it('sends room:stop when subtitles array is empty', () => {
    const socket = makeSocket();
    play(0, [], socket as any, 'room1');
    expect(socket.emit).toHaveBeenCalledWith(
      'message',
      expect.objectContaining({ message_type: 'room:stop' }),
    );
  });

  it('resets lastMessageTime after stop so next play at position 0 sends', () => {
    const socket = makeSocket();
    play(1000, [sub(500)], socket as any, 'room1'); // lastMessageTime = 1000
    socket.emit.mockClear();
    play(0, [], socket as any, 'room1');            // stop → lastMessageTime = null
    socket.emit.mockClear();
    play(0, [sub(500)], socket as any, 'room1');    // null → not throttled → sends
    expect(socket.emit).toHaveBeenCalledWith(
      'message',
      expect.objectContaining({ message_type: 'room:play' }),
    );
  });
});

describe('SubtitleChunkPlayer — 60s throttle logic', () => {
  it('throttles a second call within the 60s window', () => {
    const socket = makeSocket();
    play(0, [sub(1000)], socket as any, 'room1');
    socket.emit.mockClear();
    play(30_000, [sub(1000)], socket as any, 'room1');
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does not throttle at exactly 60s — condition is > not >=', () => {
    const socket = makeSocket();
    play(0, [sub(1000)], socket as any, 'room1');
    socket.emit.mockClear();
    play(60_000, [sub(1000)], socket as any, 'room1'); // 0 + 60000 > 60000 → false → sends
    expect(socket.emit).toHaveBeenCalled();
  });

  it('re-sends after 60s + 1ms', () => {
    const socket = makeSocket();
    play(0, [sub(1000)], socket as any, 'room1');
    socket.emit.mockClear();
    play(60_001, [sub(1000)], socket as any, 'room1');
    expect(socket.emit).toHaveBeenCalled();
  });

  it('reset() clears the throttle window', () => {
    const socket = makeSocket();
    play(0, [sub(1000)], socket as any, 'room1');
    socket.emit.mockClear();
    reset();
    play(0, [sub(1000)], socket as any, 'room1');
    expect(socket.emit).toHaveBeenCalled();
  });
});
