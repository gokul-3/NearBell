import { AppError } from '@application/errors';
import type { MapProvider, Place, PlaceSearchResult } from './types';

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Free OpenStreetMap-backed geocoding — no API key required, so it works
 * for the MVP without any secret provisioning. Nominatim's public instance
 * has a strict usage policy (max ~1 req/sec, requires an identifying
 * User-Agent, no heavy/bulk use): fine for interactive user-typed search at
 * MVP scale, but a production release at real scale should move to a
 * self-hosted Nominatim instance or a commercial provider — see
 * 06-technical-implementation.md's instruction to validate map/geocoding
 * providers before adoption rather than assuming this scales indefinitely.
 */
export class NominatimMapProvider implements MapProvider {
  constructor(private readonly userAgent: string) {}

  async search(query: string): Promise<PlaceSearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return [];
    }

    const url = `${SEARCH_URL}?format=jsonv2&limit=8&q=${encodeURIComponent(trimmed)}`;
    const json = await this.request(url);

    if (!Array.isArray(json)) {
      throw new AppError('MAP_SEARCH_FAILED', 'Unexpected search response shape');
    }

    return json
      .map((entry): PlaceSearchResult | null => {
        const latitude = Number(entry?.lat);
        const longitude = Number(entry?.lon);
        const displayName = typeof entry?.display_name === 'string' ? entry.display_name : null;
        if (!displayName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return {
          id: String(entry.place_id ?? `${latitude},${longitude}`),
          name: displayName.split(',')[0]?.trim() || displayName,
          address: displayName,
          latitude,
          longitude,
        };
      })
      .filter((place): place is PlaceSearchResult => place !== null);
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<Place> {
    const url = `${REVERSE_URL}?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const entry = await this.request(url);

    const displayName = typeof entry?.display_name === 'string' ? entry.display_name : null;
    if (!displayName) {
      throw new AppError('MAP_SEARCH_FAILED', 'Unexpected reverse-geocode response shape');
    }

    return {
      name: displayName.split(',')[0]?.trim() || displayName,
      address: displayName,
      latitude,
      longitude,
    };
  }

  private async request(url: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError('MAP_SEARCH_FAILED', `Nominatim responded with ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError('NETWORK_UNAVAILABLE', 'Map search timed out');
      }
      throw new AppError('NETWORK_UNAVAILABLE', 'Map search failed due to a network error');
    } finally {
      clearTimeout(timeout);
    }
  }
}
