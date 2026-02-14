import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { processUploadedImage } from '@/lib/image-processor';
import { uploadDraftImage } from '@/lib/storage';
import { saveDraftImage } from '@/lib/db';

// POST - Upload and process image
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
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
