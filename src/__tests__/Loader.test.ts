import * as Loader from '../subs/Loader';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const ok = (data: object) =>
  ({ ok: true, json: () => Promise.resolve(data) }) as Response;

beforeEach(() => {
  mockFetch.mockReset();
  Loader.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
});

describe('Loader.loadSubtitlesInfo — URL building', () => {
  it('sends apptoken as a query parameter', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('apptoken=tok'),
      expect.not.objectContaining({ headers: expect.anything() }),
    );
  });

  it('parses subtitlesId string to integer in the path', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', '42.9', null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/subtitles/42'),
      expect.anything(),
    );
  });

  it('encodes videoId in the path', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('my video/id', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('my%20video%2Fid'),
      expect.anything(),
    );
  });

  it('adds external_user_id when provided', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, 'user-99', '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('external_user_id=user-99'),
      expect.anything(),
    );
  });

  it('omits external_user_id when null', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining('external_user_id'),
      expect.anything(),
    );
  });

  it('adds channel when provided', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, 'ch1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('channel=ch1'),
      expect.anything(),
    );
  });

  it('omits channel when empty string', async () => {
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining('channel='),
      expect.anything(),
    );
  });

  it('adds pubnub_uuid when clientId is set', async () => {
    Loader.setClientId('client-abc');
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('pubnub_uuid=client-abc'),
      expect.anything(),
    );
  });

  it('omits pubnub_uuid when clientId is empty', async () => {
    Loader.init({ apiUrl: 'https://api.test', apptoken: 'tok', clientId: '' });
    mockFetch.mockResolvedValue(ok({ session_id: '1', text: '{}' }));
    await Loader.loadSubtitlesInfo('vid', 1, null, '');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.not.stringContaining('pubnub_uuid'),
      expect.anything(),
    );
  });
});

describe('Loader.loadSubtitlesInfo — error handling', () => {
  it('throws when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);
    await expect(Loader.loadSubtitlesInfo('vid', 1, null, '')).rejects.toThrow(
      'Failed to load subtitles: Not Found',
    );
  });

  it('throws when subtitlesId is non-numeric', async () => {
    await expect(
      Loader.loadSubtitlesInfo('vid', 'abc', null, ''),
    ).rejects.toThrow('subtitlesId must be numeric');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
