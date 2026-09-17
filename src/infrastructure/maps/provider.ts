import { NominatimMapProvider } from './NominatimMapProvider';
import type { MapProvider } from './types';

// Nominatim's usage policy asks for an identifying User-Agent. Update this
// with real contact details before a production release.
export const mapProvider: MapProvider = new NominatimMapProvider('NearBell/0.0.1');
