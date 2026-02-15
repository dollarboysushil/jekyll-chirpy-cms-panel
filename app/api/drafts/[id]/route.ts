import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDraft, updateDraft, deleteDraft } from '@/lib/db';
import { deleteDraftImages } from '@/lib/storage';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { validateUUID, validateDraftUpdate } from '@/lib/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single draft
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    
    // Validate UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid draft ID' },
        { status: 400 }
      );
    }
    
    const draft = await getDraft(id);
    
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: draft });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

// PATCH - Update draft
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    
    // Rate limiting: 60 updates per minute per IP
    const rateLimit = rateLimitMiddleware(request, {
      maxRequests: 60,
      windowSeconds: 60,
    });
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many update requests. Please slow down.' 
        },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }
    
    // Validate UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid draft ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validate draft update data
    try {
      validateDraftUpdate(data);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    const updatedDraft = await updateDraft(id, data);
    
    return NextResponse.json(
      { success: true, data: updatedDraft },
      { headers: rateLimit.headers }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// DELETE - Delete draft
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    
    // Validate UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid draft ID' },
        { status: 400 }
      );
    }
    
    // Delete images from blob storage before deleting draft
    await deleteDraftImages(id);
    
    // Delete draft (and database image records via CASCADE)
    await deleteDraft(id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
