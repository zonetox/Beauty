// G1.2 - Unit Tests for UserSessionContext
// Tuân thủ Master Plan v1.1

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { UserSessionProvider, useUserSession } from '../UserSessionContext';
import { supabase } from '../../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    })),
  },
  isSupabaseConfigured: true,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserSessionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial context values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserSessionProvider>{children}</UserSessionProvider>
    );

    const { result } = renderHook(() => useUserSession(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.session).toBeNull();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('should handle login', async () => {
    const mockUser = { id: '123', email: 'test@example.com' } as User;
    const mockSession = { user: mockUser } as Session;

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserSessionProvider>{children}</UserSessionProvider>
    );

    const { result } = renderHook(() => useUserSession(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle login error', async () => {
    const error = { message: 'Invalid credentials' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserSessionProvider>{children}</UserSessionProvider>
    );

    const { result } = renderHook(() => useUserSession(), { wrapper });

    await act(async () => {
      await expect(result.current.login('test@example.com', 'wrong')).rejects.toEqual(error);
    });
  });

  it('should handle logout', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserSessionProvider>{children}</UserSessionProvider>
    );

    const { result } = renderHook(() => useUserSession(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle requestPasswordReset', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserSessionProvider>{children}</UserSessionProvider>
    );

    const { result } = renderHook(() => useUserSession(), { wrapper });

    await act(async () => {
      await result.current.requestPasswordReset('test@example.com');
    });

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: expect.any(String),
    });
  });
});

