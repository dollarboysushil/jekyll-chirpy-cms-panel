'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import { Image as ImageIcon, X, Copy, Check } from 'lucide-react';

interface PostData {
  name: string;
  path: string;
  sha: string;
  content: string;
  url: string;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  githubPath: string;
}

type ViewMode = 'rendered' | 'raw' | 'edit';

export default function PostViewPage() {
  const params = useParams();
  const router = useRouter();
  const filename = decodeURIComponent(params.filename as string);
  
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);

  // Transform relative image URLs to use our GitHub proxy API
  const transformImageUrl = (src: string) => {
    if (!src) return src;
    
    // If already absolute URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // Remove leading slash if present
    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
    
    // Use our proxy API to fetch images from private GitHub repo
    return `/api/github-image?path=${encodeURIComponent(cleanSrc)}`;
  };

  useEffect(() => {
    fetchPost();
  }, [filename]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${encodeURIComponent(filename)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch post');
      }

      setPost(data.post);
      setEditedContent(data.post.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!post || !editedContent) return;

    try {
      setSaving(true);
      setSaveSuccess(false);
      
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

      const response = await fetch(`/api/posts/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          commitMessage: `Update ${post.name} via CMS panel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save post');
      }

      setPost({ ...post, content: editedContent });
      // Clear pending images on successful save
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setPendingImages([]);
      setSaveSuccess(true);
      setViewMode('rendered');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving post: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const extractFrontmatter = (content: string) => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: '', markdown: content };
    
    return {
      frontmatter: match[1],
      markdown: match[2],
    };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold">Error loading post</p>
          <p className="text-sm mt-1">{error || 'Post not found'}</p>
          <Link
            href="/posts"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  const { frontmatter, markdown } = extractFrontmatter(viewMode === 'edit' ? editedContent : post.content);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/posts"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Posts
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                {post.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Saved successfully
                </span>
              )}
              {viewMode === 'edit' && (
                <>
                  <button
                    onClick={() => {
                      setEditedContent(post.content);
                      // Clear pending images
                      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
                      setPendingImages([]);
                      setViewMode('rendered');
                    }}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || editedContent === post.content}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save to GitHub'
                    )}
                  </button>
                </>
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'rendered'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'raw'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Raw Markdown
            </button>
            <button
              onClick={() => {
                setEditedContent(post.content);
                // Clear any pending images when entering edit mode
                pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
                setPendingImages([]);
                setViewMode('edit');
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Edit
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {viewMode === 'rendered' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Frontmatter */}
            {frontmatter && (
              <div className="border-b">
                <div className="px-6 py-3 bg-gray-50 border-b">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Front Matter
                  </h2>
                </div>
                <div className="p-6">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border">
                    {frontmatter}
                  </pre>
                </div>
              </div>
            )}

            {/* Rendered Markdown */}
            <div>
              <div className="px-6 py-3 bg-gray-50 border-b">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Content
                </h2>
              </div>
              <div className="p-6 prose prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ node, src, alt, ...props }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={transformImageUrl(src || '')} 
                        alt={alt || ''} 
                        {...props}
                        className="rounded-lg shadow-sm max-w-full h-auto"
                        loading="lazy"
                      />
                    ),
                    a: ({ node, href, children, ...props }) => (
                      <a 
                        href={href} 
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-blue-600 hover:text-blue-800 underline"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'raw' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border overflow-x-auto leading-relaxed">
              {post.content}
            </pre>
          </div>
        )}

        {viewMode === 'edit' && (
          <div className="space-y-4">
            {/* GitHub Image Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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

            {/* Markdown Editor */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Edit Post
                </h2>
                <span className="text-xs text-gray-500">
                  Include front matter and content
                </span>
              </div>
              <div className="p-6">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[600px] text-sm font-mono bg-gray-50 p-4 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                  placeholder="Enter your markdown content..."
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
