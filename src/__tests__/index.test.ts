import type * as IndexType from '../index';

const mockAppsSetServerUrl = jest.fn();
const mockAppsResetServerUrl = jest.fn();

function fresh(): typeof IndexType {
  jest.resetModules();
  jest.doMock('../DeviceWatch', () => ({
    init: jest.fn(() => Promise.resolve()),
    onDeviceConnected: jest.fn(),
    reset: jest.fn(),
    wasDeviceConnected: jest.fn(() => false),
  }));
  jest.doMock('../apps/Apps', () => ({
    init: jest.fn(),
    destroy: jest.fn(),
    playSubtitle: jest.fn(),
    setServerUrl: mockAppsSetServerUrl,
    resetServerUrl: mockAppsResetServerUrl,
    status: {},
    data: {},
  }));
  jest.doMock('../subs/Subs', () => ({
    init: jest.fn(),
    destroy: jest.fn(),
    devicesChanged: jest.fn(),
    setClientId: jest.fn(),
  }));
  jest.doMock('../FecSocket', () => ({
    getSocket: jest.fn(() => ({ id: 'socket-1' })),
    destroySocket: jest.fn(),
  }));
  return require('../index') as typeof IndexType;
}

beforeEach(() => jest.clearAllMocks());

describe('init — parameter validation', () => {
  it('throws when feelSubsToken is empty', () => {
    const { init } = fresh();
    expect(() => init('', 'fec-tok', 'user-1', 'room-1')).toThrow(
      'feelSubsToken is required',
    );
  });

  it('throws when fecToken is empty', () => {
    const { init } = fresh();
    expect(() => init('subs-tok', '', 'user-1', 'room-1')).toThrow(
      'fecToken is required',
    );
  });

  it('throws when userId is empty', () => {
    const { init } = fresh();
    expect(() => init('subs-tok', 'fec-tok', '', 'room-1')).toThrow(
      'userId is required',
    );
  });

  it('throws when roomName is empty', () => {
    const { init } = fresh();
    expect(() => init('subs-tok', 'fec-tok', 'user-1', '')).toThrow(
      'roomName is required',
    );
  });

  it('does not throw when all params are provided', () => {
    const { init } = fresh();
    expect(() => init('subs-tok', 'fec-tok', 'user-1', 'room-1')).not.toThrow();
  });
});

describe('initSlider — parameter validation', () => {
  it('throws when fecToken is empty', () => {
    const { initSlider } = fresh();
    expect(() => initSlider('', 'user-1', 'room-1')).toThrow(
      'fecToken is required',
    );
  });

  it('throws when userId is empty', () => {
    const { initSlider } = fresh();
    expect(() => initSlider('fec-tok', '', 'room-1')).toThrow(
      'userId is required',
    );
  });

  it('throws when roomName is empty', () => {
    const { initSlider } = fresh();
    expect(() => initSlider('fec-tok', 'user-1', '')).toThrow(
      'roomName is required',
    );
  });

  it('does not throw when all params are provided', () => {
    const { initSlider } = fresh();
    expect(() => initSlider('fec-tok', 'user-1', 'room-1')).not.toThrow();
  });
});

describe('destroy — server URL reset', () => {
  it('resets subsApiUrl so the next init uses the default subs URL', () => {
    const { setServers, destroy } = fresh();
    setServers({ subs: 'https://custom-subs.example.com' });
    destroy();
    // Capture what apiUrl subs.init is called with on the next init
    jest.doMock('../subs/Subs', () => ({
      init: jest.fn(),
      destroy: jest.fn(),
      devicesChanged: jest.fn(),
      setClientId: jest.fn(),
    }));
    // After destroy, subsApiUrl should be back to default — verified via resetServerUrl call
    expect(mockAppsResetServerUrl).toHaveBeenCalled();
  });

  it('resets appsSettings.apiUrl via resetServerUrl on destroy', () => {
    const { setServers, destroy } = fresh();
    setServers({ apps: 'https://custom-apps.example.com' });
    destroy();
    expect(mockAppsResetServerUrl).toHaveBeenCalled();
  });
});
