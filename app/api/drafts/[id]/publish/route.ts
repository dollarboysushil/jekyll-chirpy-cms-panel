import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDraft, markPublished } from '@/lib/db';
import { createPost } from '@/lib/github';
import { tiptapToMarkdown } from '@/lib/markdown-converter';
import { deleteDraftImages } from '@/lib/storage';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Publish draft to GitHub
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    // Get draft
    const draft = await getDraft(id);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Validate filename
    if (!draft.filename) {
      return NextResponse.json(
        { success: false, error: 'Please specify a filename for the post' },
        { status: 400 }
      );
    }

    if (!draft.filename.endsWith('.md')) {
      return NextResponse.json(
        { success: false, error: 'Filename must end with .md extension' },
        { status: 400 }
      );
    }

    const filename = draft.filename;

    // Get markdown content
    // If user wrote in markdown mode, use that directly
    // Otherwise convert from Tiptap JSON
    let markdownContent: string;
    if (draft.markdown_source) {
      markdownContent = draft.markdown_source;
    } else {
      markdownContent = tiptapToMarkdown(draft.content);
    }

    // Create post file on GitHub - push as-is without any processing
    const githubPath = `_posts/${filename}`;
    const commitMessage = `Add post: ${filename}`;
    const { sha } = await createPost(filename, markdownContent, commitMessage);

    // Mark as published in database
    await markPublished(id, githubPath, sha);

    // Delete draft images from blob storage (they're now published to GitHub)
    await deleteDraftImages(id);

    return NextResponse.json({
      success: true,
      data: {
        githubPath,
        commitSha: sha,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error publishing draft:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish draft' },
      { status: 500 }
    );
  }
}
