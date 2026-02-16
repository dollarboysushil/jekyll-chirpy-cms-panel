import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/github';

// Disable caching for this route to always fetch latest posts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/posts - Get all published posts from GitHub
 */
export async function GET(request: NextRequest) {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
