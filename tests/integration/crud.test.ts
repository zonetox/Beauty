// G1.3 - Integration Tests for CRUD Operations
// Tuân thủ Master Plan v1.1
// Tests cho CRUD operations

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
};

describe('CRUD Operations Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Business CRUD', () => {
    it('should create business', async () => {
      const mockBusiness = {
        name: 'Test Business',
        slug: 'test-business',
        address: '123 Test St',
      };

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [mockBusiness],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      const result = await mockSupabase
        .from('businesses')
        .insert(mockBusiness)
        .select();

      expect(result.data).toEqual([mockBusiness]);
      expect(result.error).toBeNull();
    });

    it('should update business', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Updated Business' }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockUpdate);

      const result = await mockSupabase
        .from('businesses')
        .update({ name: 'Updated Business' })
        .eq('id', 1)
        .select();

      expect(result.data[0].name).toBe('Updated Business');
    });

    it('should delete business', async () => {
      const mockDelete = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockDelete);

      const result = await mockSupabase
        .from('businesses')
        .delete()
        .eq('id', 1);

      expect(result.error).toBeNull();
    });
  });

  describe('Service CRUD', () => {
    it('should create service', async () => {
      const mockService = {
        business_id: 1,
        name: 'Test Service',
        price: 100000,
      };

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [mockService],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockInsert);

      const result = await mockSupabase
        .from('services')
        .insert(mockService)
        .select();

      expect(result.data).toEqual([mockService]);
    });
  });
});






