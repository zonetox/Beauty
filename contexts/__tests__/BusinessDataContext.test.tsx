// G1.2 - Unit Tests for BusinessDataContext
// Tuân thủ Master Plan v1.1
// 100% hoàn thiện - không placeholder

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PublicDataProvider, useBusinessData } from '../BusinessDataContext';
import { supabase } from '../../lib/supabaseClient';
import { Business } from '../../types';


// Mock AdminContext to avoid import.meta issues
jest.mock('../AdminContext', () => {
  const React = require('react');
  return {
    AdminContext: React.createContext(null),
    useAdminAuth: () => ({ currentUser: null }),
    useAdmin: () => ({
      logAdminAction: jest.fn(),
      currentUser: null,
    }),
  };
});

// Helper function to create mock query builder (accessible in both mock and test)
const createMockQueryBuilderForTest = (defaultData: any[] = [], defaultCount: number | null = null) => {
  const builder: any = {};
  // Include all chainable methods used in BusinessDataContext
  const chainableMethods = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'order', 'limit', 'range', 'upsert'
  ];
  chainableMethods.forEach(method => {
    builder[method] = jest.fn().mockReturnValue(builder);
  });
  // select can take options like { count: 'exact' }
  builder.select = jest.fn((_columns?: string, options?: any) => {
    builder._count = options?.count === 'exact' ? (defaultCount ?? defaultData.length) : null;
    return builder;
  });
  // Make builder thenable (can be used as a promise)
  builder.then = jest.fn((resolve, reject) => {
    const result = { data: defaultData, error: null };
    if (builder._count !== null) {
      (result as any).count = builder._count;
    }
    return Promise.resolve(result).then(resolve, reject);
  });
  builder.catch = jest.fn((reject) => {
    const result = { data: defaultData, error: null };
    if (builder._count !== null) {
      (result as any).count = builder._count;
    }
    return Promise.resolve(result).catch(reject);
  });
  return builder;
};

// Mock Supabase with chainable query builder
jest.mock('../../lib/supabaseClient', () => {
  return {
    supabase: {
      from: jest.fn((table: string) => {
        // Return different data based on table
        if (table === 'blog_posts') {
          return createMockQueryBuilderForTest([]);
        }
        if (table === 'blog_categories') {
          return createMockQueryBuilderForTest([]);
        }
        if (table === 'membership_packages') {
          return createMockQueryBuilderForTest([]);
        }
        if (table === 'businesses') {
          return createMockQueryBuilderForTest([]);
        }
        return createMockQueryBuilderForTest([]);
      }),
      rpc: jest.fn((fnName: string, _params?: any) => {
        // Mock different RPC functions
        if (fnName === 'get_business_count') {
          return Promise.resolve({ data: 0, error: null });
        }
        if (fnName === 'search_businesses') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    },
    isSupabaseConfigured: true,
  };
});

describe('BusinessDataContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial context values', async () => {
    // Mock all queries that fetchAllPublicData will call
    const mockFrom = supabase.from as jest.Mock;
    const mockRpc = supabase.rpc as jest.Mock;

    // Mock businesses query - need to return builder with all methods
    const mockBusinessBuilder = createMockQueryBuilderForTest([], 0);
    mockFrom.mockReturnValueOnce(mockBusinessBuilder); // for fetchBusinesses (first call)
    mockFrom.mockReturnValueOnce(mockBusinessBuilder); // for markers (second call)

    // Mock blog queries
    const mockBlogBuilder = createMockQueryBuilderForTest([]);
    mockFrom.mockReturnValueOnce(mockBlogBuilder); // blog_posts
    mockFrom.mockReturnValueOnce(mockBlogBuilder); // blog_categories
    mockFrom.mockReturnValueOnce(mockBlogBuilder); // membership_packages

    // Mock RPC calls
    mockRpc.mockResolvedValueOnce({ data: 0, error: null }); // get_business_count

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PublicDataProvider>{children}</PublicDataProvider>
    );

    const { result } = renderHook(() => useBusinessData(), { wrapper });

    // Wait for initial data fetch to complete (useEffect runs fetchAllPublicData)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current.businesses)).toBe(true);
    // Note: BusinessDataContext uses 'loading' property, not 'businessLoading'
    expect(typeof result.current.fetchBusinesses).toBe('function');
  });

  it('should fetch businesses', async () => {
    const mockBusinesses: Business[] = [
      {
        id: 1,
        name: 'Test Business',
        slug: 'test-business',
        isVerified: true,
        isActive: true,
        rating: 4.5,
        reviewCount: 10,
        viewCount: 100,
        joinedDate: new Date().toISOString(),
      } as Business,
    ];

    // Mock the chain to return data with all methods
    const mockBuilder = createMockQueryBuilderForTest(mockBusinesses, mockBusinesses.length);

    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockReturnValue(mockBuilder);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PublicDataProvider>{children}</PublicDataProvider>
    );

    const { result } = renderHook(() => useBusinessData(), { wrapper });

    await act(async () => {
      await result.current.fetchBusinesses();
    });

    expect(supabase.from).toHaveBeenCalledWith('businesses');
  });

  it('should handle search using RPC function', async () => {
    // Mock search_businesses RPC to return some data
    const mockSearchData = [{ id: 1, name: 'Test Business' }];
    const mockRpcFn = supabase.rpc as jest.Mock;

    // First call: search_businesses
    mockRpcFn.mockResolvedValueOnce({ data: mockSearchData, error: null });

    // Mock businesses query for fetching full data after search
    const mockFrom = supabase.from as jest.Mock;
    const mockBusinessBuilder = createMockQueryBuilderForTest(mockSearchData, mockSearchData.length);
    mockFrom.mockReturnValueOnce(mockBusinessBuilder);

    // Second call: get_business_count
    mockRpcFn.mockResolvedValueOnce({ data: mockSearchData.length, error: null });

    // Third call: search_businesses for count (if search text provided)
    mockRpcFn.mockResolvedValueOnce({ data: mockSearchData, error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PublicDataProvider>{children}</PublicDataProvider>
    );

    const { result } = renderHook(() => useBusinessData(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      // fetchBusinesses accepts (page?, options?) where options can have search
      await result.current.fetchBusinesses(1, { search: 'test query' });
    });

    // Should call RPC function for search
    expect(supabase.rpc).toHaveBeenCalledWith('search_businesses_advanced', expect.objectContaining({
      p_search_text: 'test query',
    }));
  });
});

