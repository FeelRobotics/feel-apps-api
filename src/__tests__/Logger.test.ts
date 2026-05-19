// Logger has module-level state (sessionId, devices, intervalStarted).
// Use jest.resetModules() per test for full isolation.

import type * as LoggerType from '../subs/Logger';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function fresh(): typeof LoggerType {
  jest.resetModules();
  return require('../subs/Logger') as typeof LoggerType;
}

beforeEach(() => {
  mockFetch.mockReset().mockResolvedValue({} as Response);
});

describe('Logger.devicesChanged — array comparison logic', () => {
  it('does nothing when devices list is identical', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(0);
    mockFetch.mockClear();

    Logger.devicesChanged(['dev1'], 1000);  // first call — changes from []
    mockFetch.mockClear();
    Logger.devicesChanged(['dev1'], 2000);  // same list — no fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('triggers fetch when device is added', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(0);
    mockFetch.mockClear();

    Logger.devicesChanged(['dev1', 'dev2'], 1000);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('triggers fetch when device is removed', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(0);
    Logger.devicesChanged(['dev1', 'dev2'], 0);
    mockFetch.mockClear();

    Logger.devicesChanged(['dev1'], 1000);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not trigger fetch when order changes but values differ in count', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(0);
    Logger.devicesChanged(['dev1'], 0);
    mockFetch.mockClear();

    Logger.devicesChanged(['dev2'], 1000);  // same length, different value → changed
    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not fetch when intervalStarted is false even if devices changed', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    // intervalStarted is false (no startInterval call)

    Logger.devicesChanged(['dev1'], 1000);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('Logger.startInterval / endInterval — sessionId guard', () => {
  it('does not fetch when sessionId is null', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    // no setSessionId call
    Logger.startInterval(1000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches /start with correct URL after setSessionId', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(42);
    Logger.startInterval(5000);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/sessions/42/start?apptoken=tok',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends start time in seconds (divides by 1000)', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(3000);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.start).toBe(3);
  });

  it('endInterval does not fetch when sessionId is null', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.endInterval();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches /end with correct URL after setSessionId', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(7);
    Logger.endInterval();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/sessions/7/end?apptoken=tok',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('endInterval sets intervalStarted to false', () => {
    const Logger = fresh();
    Logger.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    Logger.setSessionId(1);
    Logger.startInterval(0);
    Logger.endInterval();
    mockFetch.mockClear();

    Logger.devicesChanged(['dev1'], 0); // intervalStarted is now false
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
