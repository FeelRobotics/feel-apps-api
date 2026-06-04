import * as Loader from '../subs/Loader';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const ok = (data: object) =>
  ({ ok: true, json: () => Promise.resolve(data) } as Response);

beforeEach(() => {
  mockFetch.mockReset();
  Loader.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
});

const withAuth = expect.objectContaining({
  headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
});

describe('Loader.loadSubtitlesInfo — URL building', () => {
  it('sends apptoken as Authorization header, not in URL', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining('apptoken'),
      withAuth,
    );
  });

  it('parses subtitlesId string to integer in the path', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', '42.9', null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/subtitles/42'), withAuth);
  });

  it('encodes videoId in the path', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('my video/id', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('my%20video%2Fid'), withAuth);
  });

  it('adds external_user_id when provided', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, 'user-99', '');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('external_user_id=user-99'), withAuth);
  });

  it('omits external_user_id when null', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.not.stringContaining('external_user_id'), withAuth);
  });

  it('adds channel when provided', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, 'ch1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('channel=ch1'), withAuth);
  });

  it('omits channel when empty string', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.not.stringContaining('channel='), withAuth);
  });

  it('adds pubnub_uuid when clientId is set', async () => {
    Loader.setClientId('client-abc');
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('pubnub_uuid=client-abc'), withAuth);
  });

  it('omits pubnub_uuid when clientId is empty', async () => {
    Loader.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(expect.not.stringContaining('pubnub_uuid'), withAuth);
  });
});

describe('Loader.loadSubtitlesInfo — error handling', () => {
  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' } as Response);
    await expect(Loader.loadSubtitlesInfo('vid', 1, null, '')).rejects.toThrow(
      'Failed to load subtitles: Not Found',
    );
  });

  it('throws when subtitlesId is non-numeric', async () => {
    await expect(Loader.loadSubtitlesInfo('vid', 'abc', null, '')).rejects.toThrow(
      'subtitlesId must be numeric',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
