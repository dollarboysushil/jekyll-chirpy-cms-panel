import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, deleteFile } from '@/lib/github';
import { requireAuth } from '@/lib/auth';
import { sql } from '@vercel/postgres';

// Disable caching for this route to always fetch latest content
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/**
 * GET /api/posts/[filename] - Get a specific post content from GitHub
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { filename } = await params;
    const post = await getPost(filename);
    return NextResponse.json({ post }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[filename] - Update a post on GitHub
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { filename } = await params;
    const body = await request.json();
    const { content, commitMessage } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const result = await updatePost(filename, content, commitMessage);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[filename] - Delete a post from GitHub (and database if exists)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireAuth();
    const { filename } = await params;

    // Delete from GitHub
    const githubPath = `_posts/${filename}`;
    await deleteFile(githubPath, `Delete post: ${filename}`);

    // Try to delete from database if it exists
    try {
      const { rows } = await sql`
        SELECT id FROM drafts WHERE filename = ${filename}
      `;
      
      if (rows.length > 0) {
        const draftId = rows[0].id;
        // Delete published_posts record first
        await sql`DELETE FROM published_posts WHERE draft_id = ${draftId}`;
        // Then delete the draft
        await sql`DELETE FROM drafts WHERE id = ${draftId}`;
      }
    } catch (dbError) {
      // Database deletion failed but GitHub deletion succeeded
      console.warn('Failed to delete from database, but GitHub deletion succeeded:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
