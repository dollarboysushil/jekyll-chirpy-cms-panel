import { put, del, list } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadBlob(
  path: string,
  content: Buffer | Blob,
  options?: { contentType?: string }
): Promise<{ url: string }> {
  try {
    // Convert Buffer to Blob if needed for Vercel Blob compatibility
    const uploadContent = Buffer.isBuffer(content) 
      ? new Blob([new Uint8Array(content)], { type: options?.contentType || 'application/octet-stream' })
      : content;

    const blob = await put(path, uploadContent, {
      access: 'public',
      ...options,
    });
    return { url: blob.url };
  } catch (error) {
    console.error('Error uploading to blob:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Error deleting from blob:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Delete multiple files from Vercel Blob storage
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(url => del(url)));
  } catch (error) {
    console.error('Error deleting blobs:', error);
    throw new Error('Failed to delete files');
  }
}

/**
 * List all blobs with a given prefix
 */
export async function listBlobs(prefix: string): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix });
    return blobs.map(blob => blob.url);
  } catch (error) {
    console.error('Error listing blobs:', error);
    throw new Error('Failed to list files');
  }
}

/**
 * Upload an image to blob storage with a specific draft
 */
export async function uploadDraftImage(
  draftId: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const timestamp = Date.now();
  const path = `drafts/${draftId}/${timestamp}-${filename}`;
  
  const { url } = await uploadBlob(path, buffer, {
    contentType: 'image/webp',
  });
  
  return url;
}

/**
 * Delete all images for a specific draft
 */
export async function deleteDraftImages(draftId: string): Promise<void> {
  try {
    const prefix = `drafts/${draftId}/`;
    const urls = await listBlobs(prefix);
    if (urls.length > 0) {
      await deleteBlobs(urls);
    }
  } catch (error) {
    console.error('Error deleting draft images:', error);
    // Don't throw - this is a cleanup operation
  }
}
