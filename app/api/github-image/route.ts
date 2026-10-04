import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { requireAuth } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { validateGitHubImagePath, validateImageFile } from '@/lib/validation';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPO_OWNER!;
const repo = process.env.GITHUB_REPO_NAME!;

/**
 * GET /api/github-image?path=assets/img/... - Proxy images from private GitHub repo
 * Authenticated only: repo is private, so images must not be publicly proxyable.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const rawPath = searchParams.get('path');

    let path: string;
    try {
      path = validateGitHubImagePath(rawPath);
    } catch {
      return NextResponse.json(
        { error: 'Invalid image path' },
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

    // Determine content type from file extension (SVG intentionally excluded)
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
    };
    const contentType = contentTypeMap[ext || ''];
    if (!contentType) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      );
    }

    // Return image with proper headers (private: requires auth, no shared caching)
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
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

    // Rate limiting: 20 uploads per 5 minutes per IP
    const rateLimit = rateLimitMiddleware(request, {
      maxRequests: 20,
      windowSeconds: 300,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawPath = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    let path: string;
    try {
      path = validateGitHubImagePath(rawPath);
    } catch {
      return NextResponse.json(
        { error: 'Invalid upload path' },
        { status: 400 }
      );
    }

    // Validate file type + size before uploading to GitHub
    try {
      validateImageFile(file);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid file' },
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
    }, { headers: rateLimit.headers });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error uploading image to GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to upload image to GitHub' },
      { status: 500 }
    );
  }
}
