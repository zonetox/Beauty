// G1.2 - Unit Tests for Utility Functions
// Tuân thủ Master Plan v1.1

import { snakeToCamel } from '../utils';

describe('snakeToCamel', () => {
  it('should convert snake_case to camelCase', () => {
    const input = {
      first_name: 'John',
      last_name: 'Doe',
      user_id: 123
    };
    const expected = {
      firstName: 'John',
      lastName: 'Doe',
      userId: 123
    };
    expect(snakeToCamel(input)).toEqual(expected);
  });

  it('should handle nested objects', () => {
    const input = {
      user_data: {
        first_name: 'John',
        contact_info: {
          email_address: 'john@example.com'
        }
      }
    };
    const expected = {
      userData: {
        firstName: 'John',
        contactInfo: {
          emailAddress: 'john@example.com'
        }
      }
    };
    expect(snakeToCamel(input)).toEqual(expected);
  });

  it('should handle arrays', () => {
    const input = [
      { first_name: 'John', last_name: 'Doe' },
      { first_name: 'Jane', last_name: 'Smith' }
    ];
    const expected = [
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Smith' }
    ];
    expect(snakeToCamel(input)).toEqual(expected);
  });

  it('should handle null and undefined', () => {
    expect(snakeToCamel(null)).toBeNull();
    expect(snakeToCamel(undefined)).toBeUndefined();
  });

  it('should handle primitive values', () => {
    expect(snakeToCamel('string')).toBe('string');
    expect(snakeToCamel(123)).toBe(123);
    expect(snakeToCamel(true)).toBe(true);
  });

  it('should prevent prototype pollution', () => {
    const input = {
      __proto__: { polluted: true },
      constructor: { polluted: true },
      prototype: { polluted: true },
      normal_key: 'value'
    };
    const result = snakeToCamel(input);
    // These keys should be filtered out, so they should not exist in result's own keys
    const resultKeys = Object.keys(result as any);
    expect(resultKeys).not.toContain('__proto__');
    expect(resultKeys).not.toContain('constructor');
    expect(resultKeys).not.toContain('prototype');
    expect((result as any).normalKey).toBe('value');
  });

  it('should handle empty objects and arrays', () => {
    expect(snakeToCamel({})).toEqual({});
    expect(snakeToCamel([])).toEqual([]);
  });
});

