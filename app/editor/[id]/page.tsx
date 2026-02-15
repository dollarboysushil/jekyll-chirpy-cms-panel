'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JSONContent } from '@tiptap/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Draft } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { AutoSave } from '@/components/editor/AutoSave';
import { ArrowLeft, Trash2, Send, FileText, Eye, Code2, AlertCircle } from 'lucide-react';
import { tiptapToMarkdown, markdownToTiptap, hasFrontmatter } from '@/lib/markdown-converter';

type EditorMode = 'visual' | 'markdown' | 'preview';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState<JSONContent>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [markdownContent, setMarkdownContent] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('markdown');
  const [hasYamlFrontmatter, setHasYamlFrontmatter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    }
  }, [draftId]);

  // Sync markdown when switching from visual to markdown mode
  useEffect(() => {
    if (editorMode === 'markdown' || editorMode === 'preview') {
      const md = tiptapToMarkdown(content);
      setMarkdownContent(md);
      setHasYamlFrontmatter(hasFrontmatter(md));
    }
  }, [editorMode]);

  // Check for frontmatter when markdown changes
  useEffect(() => {
    if (editorMode === 'markdown') {
      setHasYamlFrontmatter(hasFrontmatter(markdownContent));
    }
  }, [markdownContent, editorMode]);

  const fetchDraft = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}`);
      const data = await response.json();
      if (data.success) {
        const fetchedDraft = data.data;
        setDraft(fetchedDraft);
        setFilename(fetchedDraft.filename || '');
        setContent(fetchedDraft.content);
        setMarkdownContent(tiptapToMarkdown(fetchedDraft.content));
      }
    } catch (error) {
      console.error('Failed to fetch draft:', error);
      alert('Failed to load draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: EditorMode) => {
    // Warn if trying to leave markdown mode with frontmatter
    if (editorMode === 'markdown' && mode !== 'markdown' && hasYamlFrontmatter) {
      const confirmed = confirm(
        'Warning: Your markdown contains YAML frontmatter (Jekyll metadata). ' +
        'Switching to visual editor will lose the frontmatter formatting. ' +
        'Continue anyway?'
      );
      if (!confirmed) {
        return;
      }
    }

    if (editorMode === 'markdown' && mode !== 'markdown') {
      // Convert markdown back to Tiptap JSON
      const tiptapContent = markdownToTiptap(markdownContent);
      setContent(tiptapContent);
    } else if (editorMode === 'visual' && mode === 'markdown') {
      // Convert visual content to markdown
      const md = tiptapToMarkdown(content);
      setMarkdownContent(md);
    }
    
    setEditorMode(mode);
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
    if (!filename) {
      alert('Please specify a filename (e.g., my-post.md)');
      return;
    }

    if (!filename.endsWith('.md')) {
      alert('Filename must end with .md extension');
      return;
    }

    if (!confirm('Are you sure you want to publish this post to your Jekyll blog?')) {
      return;
    }

    setIsPublishing(true);
    try {
      // First update the filename
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
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
              <AutoSave 
                draftId={draftId} 
                content={content} 
                filename={filename}
                markdownSource={editorMode === 'markdown' ? markdownContent : undefined}
              />
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
        <div className="mb-8">
          <Input
            type="text"
            label="Filename (will be saved to _posts directory)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g., my-awesome-post.md or 2024-01-15-my-post.md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify the filename for your post (must end with .md). Jekyll convention: YYYY-MM-DD-title.md
          </p>
        </div>

        {/* Editor */}
        <div className="mb-8">
          {/* Editor Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-4">
            <button
              onClick={() => handleModeChange('visual')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                editorMode === 'visual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Visual Editor
            </button>
            <button
              onClick={() => handleModeChange('markdown')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                editorMode === 'markdown'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Code2 className="inline-block w-4 h-4 mr-2" />
              Markdown
            </button>
            <button
              onClick={() => handleModeChange('preview')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                editorMode === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Eye className="inline-block w-4 h-4 mr-2" />
              Preview
            </button>
          </div>

          {/* Frontmatter Warning */}
          {hasYamlFrontmatter && editorMode === 'markdown' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                  Jekyll Frontmatter Detected
                </h4>
                <p className="text-sm text-yellow-700">
                  Your markdown contains YAML frontmatter. Stay in Markdown mode to preserve it. 
                  Switching to Visual Editor or Preview will strip the frontmatter formatting.
                </p>
              </div>
            </div>
          )}

          {/* Visual Editor */}
          {editorMode === 'visual' && (
            <TiptapEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
            />
          )}

          {/* Markdown Editor */}
          {editorMode === 'markdown' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Write your post in markdown format
                  </p>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Quick Reference</summary>
                    <div className="absolute mt-2 p-3 bg-white border rounded-lg shadow-lg text-xs whitespace-pre-line z-10">
                      {`# Heading 1
## Heading 2
### Heading 3

**bold** or __bold__
*italic* or _italic_
\`inline code\`

[Link Text](url)
![Image Alt](image-url)

- Bullet list
- Item 2

1. Numbered list
2. Item 2

> Blockquote

\`\`\`
Code block
\`\`\`

---
Horizontal rule`}
                    </div>
                  </details>
                </div>
                <textarea
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  className="w-full h-[600px] p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="# Your Post Title&#10;&#10;Start writing your post in markdown...&#10;&#10;## Subheading&#10;&#10;Your content here..."
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {editorMode === 'preview' && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <p className="text-sm text-gray-600">
                  Preview of your markdown content
                </p>
              </div>
              <div className="p-8 prose prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ node, src, alt, ...props }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={src} 
                        alt={alt || ''} 
                        {...props}
                        className="rounded-lg shadow-sm max-w-full h-auto"
                        loading="lazy"
                      />
                    ),
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
