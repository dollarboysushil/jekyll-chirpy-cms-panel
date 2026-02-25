'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Draft } from '@/types';
import { Button } from '@/components/ui/Button';
import { DraftCard } from '@/components/DraftCard';
import { Plus, LogOut, Filter } from 'lucide-react';

type FilterType = 'all' | 'draft' | 'published';

interface GitHubPost {
  name: string;
  path: string;
  sha: string;
  url: string;
  downloadUrl: string;
}

// Combined type for display
interface PostItem extends Partial<Draft> {
  id: string;
  title: string;
  status: 'draft' | 'published';
  updated_at: string;
  filename: string | null;
  isGitHubOnly?: boolean;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [githubPosts, setGithubPosts] = useState<GitHubPost[]>([]);
  const [combinedPosts, setCombinedPosts] = useState<PostItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Combine drafts and GitHub posts
    const combined: PostItem[] = [];
    
    // Add all database drafts
    drafts.forEach(draft => {
      combined.push(draft as PostItem);
    });
    
    // Add GitHub posts that aren't in database
    const draftFilenames = new Set(drafts.map(d => d.filename));
    githubPosts.forEach(post => {
      if (!draftFilenames.has(post.name)) {
        // This is a GitHub-only post
        combined.push({
          id: post.sha,
          title: post.name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
          status: 'published',
          updated_at: new Date().toISOString(),
          filename: post.name,
          isGitHubOnly: true,
        });
      }
    });
    
    setCombinedPosts(combined);
  }, [drafts, githubPosts]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch drafts from database
      const draftsResponse = await fetch('/api/drafts');
      const draftsData = await draftsResponse.json();
      if (draftsData.success) {
        setDrafts(draftsData.data);
      }

      // Fetch posts from GitHub
      const postsResponse = await fetch('/api/posts');
      const postsData = await postsResponse.json();
      if (postsData.posts) {
        setGithubPosts(postsData.posts);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = combinedPosts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'draft') return post.status === 'draft';
    if (filter === 'published') return post.status === 'published';
    return true;
  });

  const draftCount = combinedPosts.filter(p => p.status === 'draft').length;
  const publishedCount = combinedPosts.filter(p => p.status === 'published').length;

  const handleCreateDraft = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/editor/${data.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
      alert('Failed to create draft. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Posts</h1>
          <div className="flex gap-2">
            <Button onClick={handleCreateDraft} isLoading={isCreating}>
              <Plus size={18} className="mr-2" />
              New Draft
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="container mx-auto px-4">
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              All ({combinedPosts.length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filter === 'draft'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                filter === 'published'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Published ({publishedCount})
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {filter === 'all' && 'No posts yet. Create your first post!'}
              {filter === 'draft' && 'No drafts. All your posts are published!'}
              {filter === 'published' && 'No published posts yet. Publish a draft to see it here!'}
            </p>
            {filter !== 'published' && (
              <Button onClick={handleCreateDraft} isLoading={isCreating}>
                <Plus size={18} className="mr-2" />
                Create First Draft
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <DraftCard 
                key={post.id} 
                draft={post as Draft}
                onDelete={fetchData}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
