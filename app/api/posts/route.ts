import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/github';

/**
 * GET /api/posts - Get all published posts from GitHub
 */
export async function GET(request: NextRequest) {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
