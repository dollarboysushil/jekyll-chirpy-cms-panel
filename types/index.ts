import { JSONContent } from '@tiptap/react';

export interface Draft {
  id: string;
  title: string;
  slug: string | null;
  content: JSONContent;
  cover_image: string | null;
  tags: string[];
  category: string | null;
  excerpt: string | null;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
}

export interface DraftImage {
  id: string;
  draft_id: string;
  blob_url: string;
  filename: string;
  created_at: string;
}

export interface PublishedPost {
  id: string;
  draft_id: string;
  github_path: string;
  commit_sha: string | null;
  published_at: string;
}

export interface JekyllFrontmatter {
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  image?: {
    path: string;
    alt: string;
  };
}

export interface PublishResult {
  success: boolean;
  githubPath?: string;
  commitSha?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
