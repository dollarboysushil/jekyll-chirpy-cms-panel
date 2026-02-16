import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { requireAuth } from '@/lib/auth';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPO_OWNER!;
const repo = process.env.GITHUB_REPO_NAME!;

/**
 * GET /api/github-image?path=assets/img/... - Proxy images from private GitHub repo
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Fetch file content from GitHub
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (Array.isArray(data) || !('content' in data)) {
      return NextResponse.json(
        { error: 'Invalid file' },
        { status: 400 }
      );
    }

    // Decode base64 content
    const imageBuffer = Buffer.from(data.content, 'base64');

    // Determine content type from file extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
    };
    const contentType = contentTypeMap[ext || ''] || 'image/jpeg';

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error fetching image from GitHub:', error);
    
    // Return a 1x1 transparent PNG as fallback
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    return new NextResponse(transparentPng, {
      status: 404,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}

/**
 * POST /api/github-image - Upload image to GitHub repository
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentBase64 = buffer.toString('base64');

    // Check if file exists to get SHA for update
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      // File doesn't exist, that's fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Upload image to GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Add image: ${path}`,
      content: contentBase64,
      ...(sha && { sha }),
    });

    return NextResponse.json({
      success: true,
      data: {
        path,
        sha: data.commit.sha,
        url: `/${path}`,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error uploading image to GitHub:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to GitHub' },
      { status: 500 }
    );
  }
}
