import sharp from 'sharp';

/**
 * Convert an image to WebP format with optimization
 */
export async function convertToWebP(
  inputBuffer: Buffer,
  options?: {
    quality?: number;
    maxWidth?: number;
  }
): Promise<Buffer> {
  try {
    const quality = options?.quality || 85;
    const maxWidth = options?.maxWidth || 1200;

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality })
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .toBuffer();

    return webpBuffer;
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw new Error('Failed to convert image to WebP');
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
  buffer: Buffer,
  width: number,
  height?: number
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error('Failed to resize image');
  }
}

/**
 * Process uploaded image: validate, convert to WebP, and optimize
 */
export async function processUploadedImage(
  buffer: Buffer,
  filename: string
): Promise<{ buffer: Buffer; filename: string }> {
  try {
    // Validate it's an image
    const metadata = await getImageMetadata(buffer);
    
    if (!metadata.format) {
      throw new Error('Invalid image format');
    }

    // Convert to WebP
    const webpBuffer = await convertToWebP(buffer);

    // Change extension to .webp
    const newFilename = filename.replace(/\.[^.]+$/, '.webp');

    return {
      buffer: webpBuffer,
      filename: newFilename,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}
