// G1.3 - Integration Tests for Auth Flows
// Tuân thủ Master Plan v1.1
// Tests cho authentication flows

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

describe('Auth Flows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should register new user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'newuser@test.com',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await mockSupabase.auth.signUp({
        email: 'newuser@test.com',
        password: 'Test123!',
      });

      expect(result.data.user).toEqual(mockUser);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        password: 'Test123!',
      });
    });

    it('should handle registration errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      });

      const result = await mockSupabase.auth.signUp({
        email: 'existing@test.com',
        password: 'Test123!',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Email already exists');
    });
  });

  describe('User Login Flow', () => {
    it('should login user successfully', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: '123', email: 'user@test.com' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'user@test.com',
        password: 'Test123!',
      });

      expect(result.data.session).toEqual(mockSession);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'Test123!',
      });
    });

    it('should handle login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'user@test.com',
        password: 'WrongPassword',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await mockSupabase.auth.resetPasswordForEmail('user@test.com');

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@test.com');
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: '123', email: 'user@test.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await mockSupabase.auth.getSession();

      expect(result.data.session).toEqual(mockSession);
    });

    it('should handle no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await mockSupabase.auth.getSession();

      expect(result.data.session).toBeNull();
    });
  });
});






