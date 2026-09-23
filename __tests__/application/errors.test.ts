import { AppError, describeError, ERROR_TAXONOMY } from '@application/errors';

describe('describeError', () => {
  it('has a taxonomy entry for every AppErrorCode', () => {
    const codes = Object.keys(ERROR_TAXONOMY);
    for (const code of codes) {
      const entry = ERROR_TAXONOMY[code as keyof typeof ERROR_TAXONOMY];
      expect(entry.userMessage.length).toBeGreaterThan(0);
      expect(entry.recovery.length).toBeGreaterThan(0);
    }
  });

  it('maps a known AppError to its taxonomy entry', () => {
    const result = describeError(new AppError('LOCATION_PERMISSION_DENIED'));
    expect(result).toBe(ERROR_TAXONOMY.LOCATION_PERMISSION_DENIED);
  });

  it('falls back to a generic message for non-AppError values', () => {
    const result = describeError(new Error('boom'));
    expect(result.userMessage).toBe('Something went wrong.');
  });
});
