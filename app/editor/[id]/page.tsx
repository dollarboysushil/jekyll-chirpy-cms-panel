'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JSONContent } from '@tiptap/react';
import { Draft } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { AutoSave } from '@/components/editor/AutoSave';
import { ArrowLeft, Trash2, Send } from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState<JSONContent>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    }
  }, [draftId]);

  const fetchDraft = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}`);
      const data = await response.json();
      if (data.success) {
        const fetchedDraft = data.data;
        setDraft(fetchedDraft);
        setTitle(fetchedDraft.title);
        setSlug(fetchedDraft.slug || '');
        setCategory(fetchedDraft.category || '');
        setTags(fetchedDraft.tags?.join(', ') || '');
        setContent(fetchedDraft.content);
      }
    } catch (error) {
      console.error('Failed to fetch draft:', error);
      alert('Failed to load draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('draftId', draftId);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.data.url;
  };

  const handlePublish = async () => {
    if (!title || title === 'Untitled') {
      alert('Please add a title before publishing');
      return;
    }

    if (!confirm('Are you sure you want to publish this post to your Jekyll blog?')) {
      return;
    }

    setIsPublishing(true);
    try {
      // First update the metadata
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          category: category || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        }),
      });

      // Then publish
      const response = await fetch(`/api/drafts/${draftId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Post published successfully!');
        router.push('/drafts');
      } else {
        alert(`Failed to publish: ${data.error}`);
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/drafts');
      } else {
        alert('Failed to delete draft');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete draft');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Draft not found</p>
          <Button onClick={() => router.push('/drafts')}>
            Back to Drafts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/drafts')}
              >
                <ArrowLeft size={18} />
              </Button>
              <AutoSave draftId={draftId} content={content} title={title} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 size={18} />
              </Button>
              <Button
                onClick={handlePublish}
                isLoading={isPublishing}
                disabled={draft.status === 'published'}
              >
                <Send size={18} className="mr-2" />
                {draft.status === 'published' ? 'Published' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Metadata */}
        <div className="mb-8 space-y-4">
          <Input
            type="text"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="text-3xl font-bold border-none px-0 focus:ring-0"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Slug (optional)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-slug"
            />
            <Input
              type="text"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Tutorial, Guide"
            />
          </div>

          <Input
            type="text"
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. nextjs, react, typescript"
          />
        </div>

        {/* Editor */}
        <div className="mb-8">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
          />
        </div>
      </main>
    </div>
  );
}
