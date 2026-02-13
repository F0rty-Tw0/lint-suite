import { describe, expect, it } from 'vitest';

import { formatDate, isOverdue } from './format-date';

describe('formatDate', () => {
  it('should format a date in US locale', () => {
    const date = new Date('2025-06-15T00:00:00');
    const result = formatDate(date);

    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('should handle today', () => {
    const today = new Date();
    const result = formatDate(today);

    expect(result).toBeTruthy();
  });
});

describe('isOverdue', () => {
  it('should return true for past dates', () => {
    const pastDate = new Date('2020-01-01');

    expect(isOverdue(pastDate)).toBe(true);
  });

  it('should return false for future dates', () => {
    const futureDate = new Date('2099-12-31');

    expect(isOverdue(futureDate)).toBe(false);
  });
});
