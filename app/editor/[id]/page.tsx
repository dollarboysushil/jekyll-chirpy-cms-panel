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
import { ArrowLeft, Trash2, Send, FileText, Eye, Code2, AlertCircle, Columns, Image as ImageIcon, X, Copy, Check } from 'lucide-react';
import { tiptapToMarkdown, markdownToTiptap, hasFrontmatter } from '@/lib/markdown-converter';

type EditorMode = 'visual' | 'markdown' | 'preview';

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  githubPath: string;
}

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
  const [isSplitView, setIsSplitView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);

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
        
        // If markdown_source exists, use it; otherwise convert from content
        if (fetchedDraft.markdown_source) {
          setMarkdownContent(fetchedDraft.markdown_source);
          // Set to markdown mode if we have markdown source
          setEditorMode('markdown');
        } else {
          setMarkdownContent(tiptapToMarkdown(fetchedDraft.content));
        }
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
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.data.url;
  };

  const handleMarkdownImagePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (!blob) continue;

        // Capture selection and textarea reference before async operation
        const textarea = e.currentTarget;
        const start = textarea?.selectionStart ?? markdownContent.length;
        const end = textarea?.selectionEnd ?? markdownContent.length;

        try {
          // Create a proper File object with a name and type
          const timestamp = Date.now();
          const extension = blob.type.split('/')[1] || 'png';
          const fileName = `pasted-image-${timestamp}.${extension}`;
          const file = new File([blob], fileName, { type: blob.type });

          const imageUrl = await handleImageUpload(file);
          const text = markdownContent;
          const before = text.substring(0, start);
          const after = text.substring(end);
          const imageMarkdown = `![Image](${imageUrl})`;
          
          setMarkdownContent(before + imageMarkdown + after);
          
          // Set cursor position after the inserted image
          setTimeout(() => {
            if (textarea) {
              textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
              textarea.focus();
            }
          }, 0);
        } catch (error) {
          console.error('Failed to upload pasted image:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`Failed to upload image: ${errorMessage}\nCheck console for details.`);
        }
        break;
      }
    }
  };

  // Generate GitHub path for image
  const generateGitHubImagePath = (file: File): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'webp';
    const fileName = `${timestamp}-${randomStr}.${extension}`;
    return `assets/img/post_media/${fileName}`;
  };

  // Handle image paste in GitHub upload section
  const handleGitHubImagePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (!blob) continue;

        const timestamp = Date.now();
        const extension = blob.type.split('/')[1] || 'webp';
        const fileName = `pasted-image-${timestamp}.${extension}`;
        const file = new File([blob], fileName, { type: blob.type });

        const preview = URL.createObjectURL(file);
        const githubPath = generateGitHubImagePath(file);
        const id = `${Date.now()}-${Math.random()}`;

        setPendingImages((prev) => [
          ...prev,
          { id, file, preview, githubPath },
        ]);
        break;
      }
    }
  };

  // Handle file selection from input
  const handleGitHubImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const preview = URL.createObjectURL(file);
      const githubPath = generateGitHubImagePath(file);
      const id = `${Date.now()}-${Math.random()}`;

      setPendingImages((prev) => [
        ...prev,
        { id, file, preview, githubPath },
      ]);
    });

    // Reset input
    e.target.value = '';
  };

  // Remove pending image
  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // Copy markdown syntax to clipboard
  const copyMarkdownSyntax = async (githubPath: string, imageId: string) => {
    const markdown = `![Image](/${githubPath})`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedImageId(imageId);
      setTimeout(() => setCopiedImageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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
      // Upload pending images to GitHub first
      if (pendingImages.length > 0) {
        for (const image of pendingImages) {
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('path', image.githubPath);

          const uploadResponse = await fetch('/api/github-image', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(`Failed to upload ${image.githubPath}: ${errorData.error}`);
          }
        }
      }

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
        // Clear pending images on successful publish
        pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
        setPendingImages([]);
        alert('Post published successfully!');
        router.push('/home');
      } else {
        alert(`Failed to publish: ${data.error}`);
      }
    } catch (error) {
      console.error('Publish error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to publish post: ${errorMessage}`);
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
        router.push('/home');
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
          <Button onClick={() => router.push('/home')}>
            Back to All Posts
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
                onClick={() => router.push('/home')}
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
      <main className={isSplitView && editorMode === 'markdown' ? '' : 'container mx-auto px-4 py-8 max-w-4xl'}>
        {/* Metadata */}
        {!(isSplitView && editorMode === 'markdown') && (
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
        )}

        {/* Editor */}
        <div className={isSplitView && editorMode === 'markdown' ? '' : 'mb-8'}>
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
              {/* GitHub Image Upload Section */}
              {!isSplitView && (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
                        GitHub Images - Paste or Upload
                      </p>
                    </div>
                    <label className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGitHubImageSelect}
                      />
                    </label>
                  </div>
                  
                  {pendingImages.length === 0 ? (
                    <div
                      onPaste={handleGitHubImagePaste}
                      className="p-8 text-center border-2 border-dashed border-gray-300 m-4 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                      tabIndex={0}
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click here and paste images (Ctrl+V / Cmd+V)
                      </p>
                      <p className="text-xs text-gray-500">
                        Images will be uploaded to GitHub at: assets/img/post_media/
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {pendingImages.map((image) => (
                        <div
                          key={image.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                        >
                          <img
                            src={image.preview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {image.file.name}
                            </p>
                            <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded border block truncate">
                              /{image.githubPath}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyMarkdownSyntax(image.githubPath, image.id)}
                              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                              title="Copy markdown syntax"
                            >
                              {copiedImageId === image.id ? (
                                <>
                                  <Check size={14} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => removePendingImage(image.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Remove image"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div
                        onPaste={handleGitHubImagePaste}
                        className="p-4 text-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                        tabIndex={0}
                      >
                        <p className="text-xs text-gray-600">
                          Click here to paste more images
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!isSplitView ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Write your post in markdown format
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSplitView(true)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Columns size={14} />
                        Split View
                      </button>
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">Quick Reference</summary>
                        <div className="absolute mt-2 p-3 bg-white border rounded-lg shadow-lg text-xs whitespace-pre-line z-10 right-0">
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
Horizontal rule

Paste images directly!`}
                        </div>
                      </details>
                    </div>
                  </div>
                  <textarea
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    onPaste={handleMarkdownImagePaste}
                    className="w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ height: 'calc(100vh - 280px)' }}
                    placeholder="# Your Post Title&#10;&#10;Start writing your post in markdown...&#10;&#10;## Subheading&#10;&#10;Your content here...&#10;&#10;You can paste images directly!"
                  />
                </div>
              ) : (
                <div className="fixed inset-0 top-[73px] bg-background z-20">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Split View - Edit &amp; Preview
                    </p>
                    <button
                      onClick={() => setIsSplitView(false)}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Exit Split View
                    </button>
                  </div>
                  <div className="grid grid-cols-2 divide-x h-[calc(100vh-73px-49px)]">
                    {/* Left: Markdown Editor */}
                    <div className="overflow-hidden flex flex-col bg-white">
                      <div className="bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 border-b">
                        Markdown
                      </div>
                      <textarea
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        onPaste={handleMarkdownImagePaste}
                        className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-auto"
                        placeholder="# Your Post Title&#10;&#10;Start writing...&#10;&#10;Paste images directly!"
                      />
                    </div>
                    {/* Right: Preview */}
                    <div className="overflow-auto flex flex-col bg-white">
                      <div className="bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 border-b">
                        Preview
                      </div>
                      <div className="flex-1 p-8 prose prose-lg max-w-none overflow-auto">
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
                  </div>
                </div>
              )}
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
