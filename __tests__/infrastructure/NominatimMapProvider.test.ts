import { NominatimMapProvider } from '../../src/infrastructure/maps/NominatimMapProvider';
import { AppError } from '../../src/application/errors';

function mockFetchOnce(response: { ok: boolean; status?: number; json: () => Promise<unknown> }) {
  (globalThis as any).fetch = jest.fn().mockResolvedValueOnce(response);
}

describe('NominatimMapProvider.search', () => {
  it('parses a well-formed response into place search results', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [
        { place_id: 1, display_name: 'Central Station, City, Country', lat: '12.9716', lon: '77.5946' },
      ],
    });

    const provider = new NominatimMapProvider('test-agent');
    const results = await provider.search('central station');

    expect(results).toEqual([
      {
        id: '1',
        name: 'Central Station',
        address: 'Central Station, City, Country',
        latitude: 12.9716,
        longitude: 77.5946,
      },
    ]);
  });

  it('filters out malformed entries instead of throwing', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [
        { place_id: 1, display_name: 'Valid Place', lat: '1', lon: '2' },
        { place_id: 2, display_name: 'Broken Place', lat: 'not-a-number', lon: '2' },
        { place_id: 3, lat: '1', lon: '2' }, // missing display_name
      ],
    });

    const provider = new NominatimMapProvider('test-agent');
    const results = await provider.search('query');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Valid Place');
  });

  it('returns an empty array for a blank query without making a request', async () => {
    (globalThis as any).fetch = jest.fn();
    const provider = new NominatimMapProvider('test-agent');

    const results = await provider.search('   ');

    expect(results).toEqual([]);
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });

  it('throws MAP_SEARCH_FAILED on a non-ok HTTP response', async () => {
    mockFetchOnce({ ok: false, status: 503, json: async () => ({}) });
    const provider = new NominatimMapProvider('test-agent');

    await expect(provider.search('query')).rejects.toMatchObject({
      code: 'MAP_SEARCH_FAILED',
    });
  });

  it('throws NETWORK_UNAVAILABLE when fetch itself rejects', async () => {
    (globalThis as any).fetch = jest.fn().mockRejectedValueOnce(new TypeError('Network request failed'));
    const provider = new NominatimMapProvider('test-agent');

    await expect(provider.search('query')).rejects.toBeInstanceOf(AppError);
    await expect(provider.search('query')).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
  });
});

describe('NominatimMapProvider.reverseGeocode', () => {
  it('returns a Place for a valid response', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ display_name: 'Some Place, City' }),
    });

    const provider = new NominatimMapProvider('test-agent');
    const place = await provider.reverseGeocode(12.9716, 77.5946);

    expect(place).toEqual({
      name: 'Some Place',
      address: 'Some Place, City',
      latitude: 12.9716,
      longitude: 77.5946,
    });
  });

  it('throws MAP_SEARCH_FAILED when display_name is missing', async () => {
    mockFetchOnce({ ok: true, json: async () => ({}) });
    const provider = new NominatimMapProvider('test-agent');

    await expect(provider.reverseGeocode(0, 0)).rejects.toMatchObject({
      code: 'MAP_SEARCH_FAILED',
    });
  });
});
