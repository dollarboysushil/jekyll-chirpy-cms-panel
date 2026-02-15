import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { processUploadedImage } from '@/lib/image-processor';
import { uploadDraftImage } from '@/lib/storage';
import { saveDraftImage } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { validateImageFile, validateUUID } from '@/lib/validation';

// POST - Upload and process image
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    // Rate limiting: 20 uploads per 5 minutes per IP
    const rateLimit = rateLimitMiddleware(request, {
      maxRequests: 20,
      windowSeconds: 300,
    });
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many upload requests. Please try again in ${rateLimit.retryAfter} seconds.` 
        },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const draftId = formData.get('draftId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!validateUUID(draftId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid draft ID format' },
        { status: 400 }
      );
    }

    // Validate image file
    try {
      validateImageFile(file);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image (convert to WebP, optimize)
    const { buffer: processedBuffer, filename } = await processUploadedImage(
      buffer,
      file.name
    );

    // Upload to Vercel Blob
    const blobUrl = await uploadDraftImage(draftId, processedBuffer, filename);

    // Save reference in database
    await saveDraftImage(draftId, blobUrl, filename);

    return NextResponse.json({
      success: true,
      data: {
        url: blobUrl,
        filename,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
