import type { Coordinates } from '@domain/shared/coordinates';
import { isValidCoordinates } from '@domain/shared/coordinates';

export type Destination = Coordinates & {
  id: string;
  name: string;
  address?: string;
};

export function isValidDestination(destination: Destination): boolean {
  return (
    typeof destination.id === 'string' &&
    destination.id.length > 0 &&
    typeof destination.name === 'string' &&
    destination.name.trim().length > 0 &&
    isValidCoordinates(destination)
  );
}
