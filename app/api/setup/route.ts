import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET - Initialize database tables (authenticated only)
export async function GET() {
  try {
    await requireAuth();
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}
