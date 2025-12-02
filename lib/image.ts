// lib/image.ts
/**
 * Transforms a Supabase Storage URL to request an optimized image from the CDN.
 * See: https://supabase.com/docs/guides/storage/image-transformations
 * 
 * @param url The original public URL of the Supabase image.
 * @param options Transformation options like width, height, and quality.
 * @returns The transformed URL or the original URL if it's not a valid Supabase Storage URL.
 */
export const getOptimizedSupabaseUrl = (
    url: string,
    options: { width?: number; quality?: number; }
): string => {
    // Return non-Supabase URLs (like picsum.photos or data URLs) as-is.
    if (!url || !url.includes('supabase.co')) {
        return url;
    }

    try {
        // The transformation path is `/render/image/public`.
        // We replace the standard `/object/public`.
        const transformedUrl = url.replace('/object/public/', '/render/image/public/');
        
        const urlObj = new URL(transformedUrl);
        
        if (options.width) {
            urlObj.searchParams.set('width', String(options.width));
        }
        if (options.quality) {
            urlObj.searchParams.set('quality', String(options.quality));
        }

        // Add format option for better compression, especially for PNGs
        urlObj.searchParams.set('format', 'webp');

        return urlObj.toString();

    } catch (error) {
        console.error("Failed to parse or transform URL:", url, error);
        return url; // Return original URL on error
    }
};
