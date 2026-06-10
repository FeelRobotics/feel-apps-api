// Because MessageQueue has module-level state (queues and sendingInProgress),
// we re-require it in each test via jest.isolateModules to get a clean slate.

describe('MessageQueue', () => {
  let Queue: typeof import('../apps/MessageQueue');

  beforeEach(() => {
    jest.isolateModules(() => {
      Queue = require('../apps/MessageQueue');
    });
  });

  const channel = 'test-channel';

  describe('push / getMessages / isEmpty', () => {
    it('starts with empty queue', () => {
      expect(Queue.isEmpty(channel)).toBe(true);
      expect(Queue.getMessages(channel)).toEqual([]);
    });

    it('push adds a message', () => {
      Queue.push(channel, { value: 42 });
      expect(Queue.isEmpty(channel)).toBe(false);
      expect(Queue.getMessages(channel)).toEqual([{ value: 42 }]);
    });

    it('push accumulates multiple messages', () => {
      Queue.push(channel, { value: 1 });
      Queue.push(channel, { value: 2 });
      Queue.push(channel, { value: 3 });
      expect(Queue.getMessages(channel)).toEqual([
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ]);
    });

    it('push works on a channel that was never used', () => {
      Queue.push('new-channel', { value: 99 });
      expect(Queue.getMessages('new-channel')).toEqual([{ value: 99 }]);
    });
  });

  describe('reset', () => {
    it('clears the queue', () => {
      Queue.push(channel, { value: 1 });
      Queue.reset(channel);
      expect(Queue.isEmpty(channel)).toBe(true);
      expect(Queue.getMessages(channel)).toEqual([]);
    });

    it('reset on never-used channel does not throw', () => {
      expect(() => Queue.reset('never-used')).not.toThrow();
    });
  });

  describe('sendingInProgress lifecycle', () => {
    it('isSendingInProgress returns false initially', () => {
      expect(Queue.isSendingInProgress(channel)).toBe(false);
    });

    it('startSending sets isSendingInProgress to true', () => {
      Queue.startSending(channel);
      expect(Queue.isSendingInProgress(channel)).toBe(true);
    });

    it('endSending sets isSendingInProgress to false', () => {
      Queue.startSending(channel);
      Queue.endSending(channel);
      expect(Queue.isSendingInProgress(channel)).toBe(false);
    });

    it('isSendingInProgress is independent per channel', () => {
      Queue.startSending('ch-a');
      expect(Queue.isSendingInProgress('ch-a')).toBe(true);
      expect(Queue.isSendingInProgress('ch-b')).toBe(false);
    });
  });

  describe('getMessages on empty channel', () => {
    it('returns [] for unknown channel', () => {
      expect(Queue.getMessages('unknown')).toEqual([]);
    });
  });
});
