import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDrafts, createDraft } from '@/lib/db';

// GET - List all drafts
export async function GET() {
  try {
    await requireAuth();
    const drafts = await getDrafts();
    return NextResponse.json({ success: true, data: drafts });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST - Create new draft
export async function POST() {
  try {
    await requireAuth();
    const draft = await createDraft();
    return NextResponse.json({ success: true, data: draft });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
