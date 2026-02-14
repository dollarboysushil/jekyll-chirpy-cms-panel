import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDraft, getDraftImages, markPublished } from '@/lib/db';
import { deleteBlobs } from '@/lib/storage';
import { uploadImage, createPost } from '@/lib/github';
import {
  generateJekyllPost,
  generateSlug,
  formatJekyllDate,
  generatePostFilename,
  replaceImageUrls,
} from '@/lib/jekyll-generator';
import { JekyllFrontmatter } from '@/types';

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

    // Validate required fields
    if (!draft.title || draft.title === 'Untitled') {
      return NextResponse.json(
        { success: false, error: 'Please add a title before publishing' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const slug = draft.slug || generateSlug(draft.title);

    // Get all draft images
    const draftImages = await getDraftImages(id);

    // Prepare frontmatter
    const publishDate = new Date();
    const frontmatter: JekyllFrontmatter = {
      title: draft.title,
      date: formatJekyllDate(publishDate),
      categories: draft.category ? [draft.category] : [],
      tags: draft.tags || [],
    };

    // Add cover image if present
    if (draft.cover_image) {
      const coverImageFilename = draft.cover_image.split('/').pop() || 'cover.webp';
      const githubImagePath = `/assets/img/posts/${slug}/${coverImageFilename}`;
      frontmatter.image = {
        path: githubImagePath,
        alt: draft.title,
      };
    }

    // Generate Jekyll post content
    let jekyllContent = generateJekyllPost(frontmatter, draft.content);

    // Upload images to GitHub and create URL mapping
    const urlMap = new Map<string, string>();

    for (const image of draftImages) {
      try {
        // Download image from blob
        const response = await fetch(image.blob_url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to GitHub
        const githubPath = `assets/img/posts/${slug}/${image.filename}`;
        await uploadImage(githubPath, buffer);

        // Map blob URL to GitHub URL
        const githubUrl = `/${githubPath}`;
        urlMap.set(image.blob_url, githubUrl);
      } catch (error) {
        console.error(`Failed to upload image ${image.filename}:`, error);
        // Continue with other images
      }
    }

    // Replace blob URLs with GitHub URLs in content
    jekyllContent = replaceImageUrls(jekyllContent, urlMap);

    // Create post file on GitHub
    const filename = generatePostFilename(publishDate, slug);
    const commitMessage = `Add post: ${draft.title}`;
    const { sha } = await createPost(filename, jekyllContent, commitMessage);

    // Delete images from blob storage
    const blobUrls = draftImages.map(img => img.blob_url);
    if (blobUrls.length > 0) {
      await deleteBlobs(blobUrls);
    }

    // Mark as published in database
    const githubPath = `_posts/${filename}`;
    await markPublished(id, githubPath, sha);

    return NextResponse.json({
      success: true,
      data: {
        githubPath,
        commitSha: sha,
        slug,
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
