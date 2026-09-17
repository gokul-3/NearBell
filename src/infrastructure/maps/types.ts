export type Place = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
};

export type PlaceSearchResult = Place & { id: string };

export interface MapProvider {
  search(query: string): Promise<PlaceSearchResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<Place>;
}
