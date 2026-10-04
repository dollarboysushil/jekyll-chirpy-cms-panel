import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, deleteFile } from '@/lib/github';
import { requireAuth } from '@/lib/auth';
import { validateMarkdownFilename, sanitizeString } from '@/lib/validation';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { sql } from '@vercel/postgres';

// Max post body: 1MB (generous for markdown, blocks repo-DoS via giant commits)
const MAX_POST_BYTES = 1024 * 1024;

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
    await requireAuth();
    const { filename: rawFilename } = await params;
    let filename: string;
    try {
      filename = validateMarkdownFilename(decodeURIComponent(rawFilename));
    } catch {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    const post = await getPost(filename);
    return NextResponse.json({ post }, {
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
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
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
    await requireAuth();

    // Rate limiting: 30 updates per 10 minutes per IP (editing saves)
    const rateLimit = rateLimitMiddleware(request, {
      maxRequests: 30,
      windowSeconds: 600,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many update requests. Please slow down.' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const { filename: rawFilename } = await params;
    let filename: string;
    try {
      filename = validateMarkdownFilename(decodeURIComponent(rawFilename));
    } catch {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, commitMessage } = body;

    if (typeof content !== 'string' || content.length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(content, 'utf8') > MAX_POST_BYTES) {
      return NextResponse.json(
        { error: 'Content too large (max 1MB)' },
        { status: 413 }
      );
    }

    let safeMessage: string | undefined;
    if (commitMessage !== undefined) {
      try {
        safeMessage = sanitizeString(String(commitMessage), 200);
      } catch {
        return NextResponse.json(
          { error: 'Invalid commit message' },
          { status: 400 }
        );
      }
    }

    const result = await updatePost(filename, content, safeMessage);
    return NextResponse.json(
      { success: true, data: result },
      { headers: rateLimit.headers }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
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
    const { filename: rawFilename } = await params;
    let filename: string;
    try {
      filename = validateMarkdownFilename(decodeURIComponent(rawFilename));
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

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
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
