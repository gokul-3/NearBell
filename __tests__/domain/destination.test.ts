import { isValidDestination } from '../../src/domain/location/destination';

describe('isValidDestination', () => {
  it('accepts a well-formed destination', () => {
    expect(
      isValidDestination({ id: 'd1', name: 'Central Station', latitude: 12.9716, longitude: 77.5946 }),
    ).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(isValidDestination({ id: 'd1', name: '  ', latitude: 12.9716, longitude: 77.5946 })).toBe(
      false,
    );
  });

  it('rejects an empty id', () => {
    expect(
      isValidDestination({ id: '', name: 'Central Station', latitude: 12.9716, longitude: 77.5946 }),
    ).toBe(false);
  });

  it('rejects invalid coordinates', () => {
    expect(
      isValidDestination({ id: 'd1', name: 'Central Station', latitude: 200, longitude: 77.5946 }),
    ).toBe(false);
  });
});
