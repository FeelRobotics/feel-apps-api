const mockEmit = jest.fn();
const mockSocket = { id: 'sock1', emit: mockEmit };

jest.mock('../FecSocket', () => ({
  getSocket: jest.fn(() => mockSocket),
}));

import { SOCKET_EVENT } from '../constants';

describe('BillingSession', () => {
  let BillingSession: typeof import('../subs/BillingSession');

  beforeEach(() => {
    jest.isolateModules(() => {
      BillingSession = require('../subs/BillingSession');
    });
    mockEmit.mockClear();
  });

  it('joins the billing room on first play()', () => {
    BillingSession.play();
    expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENT.ROOM_JOIN, {
      room_name: 'billing.sock1',
    });
  });

  it('joins only once — second play() is a no-op', () => {
    BillingSession.play();
    BillingSession.play();
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('reset() allows re-joining on next play()', () => {
    BillingSession.play();
    mockEmit.mockClear();
    BillingSession.reset();
    BillingSession.play();
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('does not throw if socket is not initialised', () => {
    const { getSocket } = require('../FecSocket');
    getSocket.mockImplementationOnce(() => {
      throw new Error('not init');
    });
    expect(() => BillingSession.play()).not.toThrow();
  });
});
