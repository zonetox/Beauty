// lib/storage.ts
import { supabase } from './supabaseClient.ts';

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param file The file to upload.
 * @param folder An optional folder path within the bucket.
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (bucket: string, file: File, folder?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
        throw new Error('Could not get public URL for uploaded file.');
    }

    return data.publicUrl;
};

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param fileUrl The public URL of the file to delete.
 */
export const deleteFileByUrl = async (bucket: string, fileUrl: string): Promise<void> => {
    try {
        // FIX: The `supabase.storage.url` property is protected.
        // We can get the base URL by calling getPublicUrl with an empty path.
        const { data } = supabase.storage.from(bucket).getPublicUrl('');

        if (!data || !data.publicUrl) {
            console.error('Could not determine bucket URL for file deletion.');
            return;
        }
        
        const bucketUrl = data.publicUrl;

        if (!fileUrl.startsWith(bucketUrl)) {
            console.warn('URL does not belong to the storage bucket. Skipping delete.');
            return;
        }
        // FIX: The file path for removal should not have a leading slash.
        // The original code `fileUrl.substring(bucketUrl.length)` would produce '/path/to/file.png'.
        // It should be 'path/to/file.png'.
        const filePath = fileUrl.substring(bucketUrl.length + 1);

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            throw error;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to delete file by URL:", message);
    }
};
