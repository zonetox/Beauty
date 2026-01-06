// G1.2 - Unit Tests for Image Utility Functions
// Tuân thủ Master Plan v1.1

import { getOptimizedSupabaseUrl } from '../image';

describe('getOptimizedSupabaseUrl', () => {
  it('should transform Supabase Storage URL with optimization parameters', () => {
    const supabaseUrl = 'https://project.supabase.co/storage/v1/object/public/bucket/image.jpg';
    const result = getOptimizedSupabaseUrl(supabaseUrl, { width: 800, quality: 85 });
    
    expect(result).toContain('/render/image/public/');
    expect(result).toContain('width=800');
    expect(result).toContain('quality=85');
    expect(result).toContain('format=webp');
  });

  it('should return original URL for non-Supabase URLs', () => {
    const externalUrl = 'https://picsum.photos/seed/beauty/1200/630';
    const result = getOptimizedSupabaseUrl(externalUrl, { width: 800 });
    
    expect(result).toBe(externalUrl);
  });

  it('should handle data URLs', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = getOptimizedSupabaseUrl(dataUrl, { width: 800 });
    
    expect(result).toBe(dataUrl);
  });

  it('should handle empty string', () => {
    const result = getOptimizedSupabaseUrl('', { width: 800 });
    expect(result).toBe('');
  });

  it('should not include quality if not specified', () => {
    const supabaseUrl = 'https://project.supabase.co/storage/v1/object/public/bucket/image.jpg';
    const result = getOptimizedSupabaseUrl(supabaseUrl, { width: 800 });
    
    expect(result).toContain('width=800');
    expect(result).toContain('format=webp');
    // Quality should not be included if not specified
    expect(result).not.toContain('quality=');
  });
});

