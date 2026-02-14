import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

// GET - Initialize database tables
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully',
    });
  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}
