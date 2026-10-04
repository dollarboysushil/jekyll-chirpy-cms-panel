import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/github';
import { requireAuth } from '@/lib/auth';

// Disable caching for this route to always fetch latest posts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/posts - Get all published posts from GitHub
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const posts = await getAllPosts();
    return NextResponse.json({ posts }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
