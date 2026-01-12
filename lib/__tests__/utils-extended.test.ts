// G1.2 - Extended Unit Tests for Utility Functions
// Tuân thủ Master Plan v1.1

import { snakeToCamel, mapPostgrestResponse, mapSingleResponse } from '../utils';
import { PostgrestResponse } from '@supabase/supabase-js';

describe('mapPostgrestResponse', () => {
  it('should map PostgrestResponse data to camelCase', () => {
    const response: PostgrestResponse<any> = {
      data: [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    };

    const result = mapPostgrestResponse(response);
    
    expect(result.data).toEqual([
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Smith' }
    ]);
    expect(result.error).toBeNull();
  });

  it('should handle null data', () => {
    const response: PostgrestResponse<any> = {
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    };

    const result = mapPostgrestResponse(response);
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should preserve error', () => {
    const error: any = { message: 'Database error', code: 'PGRST116', details: '', hint: null, name: 'PostgrestError' };
    const response: PostgrestResponse<any> = {
      data: null,
      error,
      count: null,
      status: 500,
      statusText: 'Internal Server Error'
    };

    const result = mapPostgrestResponse(response);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(error);
  });
});

describe('mapSingleResponse', () => {
  it('should map single object response to camelCase', () => {
    const response = {
      data: { user_id: 123, full_name: 'John Doe', email_address: 'john@example.com' },
      error: null
    };

    const result = mapSingleResponse(response);
    
    expect(result.data).toEqual({
      userId: 123,
      fullName: 'John Doe',
      emailAddress: 'john@example.com'
    });
    expect(result.error).toBeNull();
  });

  it('should handle null data', () => {
    const response = {
      data: null,
      error: null
    };

    const result = mapSingleResponse(response);
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should preserve error', () => {
    const error = { message: 'Not found', code: 'PGRST116' };
    const response = {
      data: null,
      error
    };

    const result = mapSingleResponse(response);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(error);
  });
});

