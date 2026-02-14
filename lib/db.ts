import { sql } from '@vercel/postgres';
import { Draft, DraftImage, PublishedPost } from '@/types';
import { JSONContent } from '@tiptap/react';

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create drafts table
    await sql`
      CREATE TABLE IF NOT EXISTS drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL DEFAULT 'Untitled',
        slug TEXT,
        content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
        cover_image TEXT,
        tags TEXT[] DEFAULT '{}',
        category TEXT,
        excerpt TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'draft'
      )
    `;

    // Create draft_images table
    await sql`
      CREATE TABLE IF NOT EXISTS draft_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
        blob_url TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create published_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS published_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        draft_id UUID REFERENCES drafts(id),
        github_path TEXT NOT NULL,
        commit_sha TEXT,
        published_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create index for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_draft_images_draft_id ON draft_images(draft_id)`;

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// List all drafts
export async function getDrafts(): Promise<Draft[]> {
  try {
    const { rows } = await sql<Draft>`
      SELECT * FROM drafts 
      ORDER BY updated_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
}

// Get single draft by ID
export async function getDraft(id: string): Promise<Draft | null> {
  try {
    const { rows } = await sql<Draft>`
      SELECT * FROM drafts 
      WHERE id = ${id}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching draft:', error);
    throw error;
  }
}

// Create new draft
export async function createDraft(): Promise<Draft> {
  try {
    const defaultContent: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    };

    const { rows } = await sql<Draft>`
      INSERT INTO drafts (content)
      VALUES (${JSON.stringify(defaultContent)}::jsonb)
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
}

// Update draft
export async function updateDraft(
  id: string, 
  data: Partial<Draft>
): Promise<Draft> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${valueIndex++}`);
      values.push(data.title);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${valueIndex++}`);
      values.push(data.slug);
    }
    if (data.content !== undefined) {
      updates.push(`content = $${valueIndex++}::jsonb`);
      values.push(JSON.stringify(data.content));
    }
    if (data.cover_image !== undefined) {
      updates.push(`cover_image = $${valueIndex++}`);
      values.push(data.cover_image);
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${valueIndex++}`);
      values.push(data.tags);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${valueIndex++}`);
      values.push(data.category);
    }
    if (data.excerpt !== undefined) {
      updates.push(`excerpt = $${valueIndex++}`);
      values.push(data.excerpt);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${valueIndex++}`);
      values.push(data.status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE drafts 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const { rows } = await sql.query<Draft>(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
}

// Delete draft
export async function deleteDraft(id: string): Promise<void> {
  try {
    await sql`DELETE FROM drafts WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

// Save image reference
export async function saveDraftImage(
  draftId: string,
  blobUrl: string,
  filename: string
): Promise<DraftImage> {
  try {
    const { rows } = await sql<DraftImage>`
      INSERT INTO draft_images (draft_id, blob_url, filename)
      VALUES (${draftId}, ${blobUrl}, ${filename})
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('Error saving draft image:', error);
    throw error;
  }
}

// Get all images for draft
export async function getDraftImages(draftId: string): Promise<DraftImage[]> {
  try {
    const { rows } = await sql<DraftImage>`
      SELECT * FROM draft_images 
      WHERE draft_id = ${draftId}
      ORDER BY created_at ASC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching draft images:', error);
    throw error;
  }
}

// Delete draft images
export async function deleteDraftImages(draftId: string): Promise<void> {
  try {
    await sql`DELETE FROM draft_images WHERE draft_id = ${draftId}`;
  } catch (error) {
    console.error('Error deleting draft images:', error);
    throw error;
  }
}

// Mark draft as published
export async function markPublished(
  draftId: string,
  githubPath: string,
  commitSha: string
): Promise<PublishedPost> {
  try {
    // Update draft status
    await sql`
      UPDATE drafts 
      SET status = 'published'
      WHERE id = ${draftId}
    `;

    // Create published post record
    const { rows } = await sql<PublishedPost>`
      INSERT INTO published_posts (draft_id, github_path, commit_sha)
      VALUES (${draftId}, ${githubPath}, ${commitSha})
      RETURNING *
    `;

    return rows[0];
  } catch (error) {
    console.error('Error marking as published:', error);
    throw error;
  }
}

// Get published posts
export async function getPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const { rows } = await sql<PublishedPost>`
      SELECT * FROM published_posts 
      ORDER BY published_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Error fetching published posts:', error);
    throw error;
  }
}
