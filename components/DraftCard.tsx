'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Draft } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { FileText, Calendar, Tag, CheckCircle2, Edit3, Github, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

interface DraftCardProps {
  draft: Draft & { isGitHubOnly?: boolean };
  onDelete?: () => void;
}

export function DraftCard({ draft, onDelete }: DraftCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = new Date(draft.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isPublished = draft.status === 'published';
  const isGitHubOnly = 'isGitHubOnly' in draft && draft.isGitHubOnly;
  
  // GitHub-only posts go to post viewer, others go to editor
  const href = isGitHubOnly && draft.filename 
    ? `/posts/${encodeURIComponent(draft.filename)}` 
    : `/editor/${draft.id}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draft.filename) {
      alert('Cannot delete: filename not found');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${draft.filename}"?\n\n` +
      'This will permanently delete the post from your GitHub repository. This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(draft.filename)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Post deleted successfully!');
        if (onDelete) onDelete();
      } else {
        alert(`Failed to delete post: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <Link href={href} className="block">
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 pr-2">
                <CardTitle className="text-lg mb-2 line-clamp-2 break-words">
                  {draft.filename ? draft.filename.replace('.md', '') : draft.title || 'Untitled'}
                </CardTitle>
                {draft.excerpt && (
                  <CardDescription className="line-clamp-2">
                    {draft.excerpt}
                  </CardDescription>
                )}
              </div>
              <div className="flex-shrink-0">
                {isGitHubOnly ? (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Github size={12} />
                    GitHub
                  </span>
                ) : isPublished ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle2 size={12} />
                    Published
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Edit3 size={12} />
                    Draft
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground min-w-0 flex-1">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Calendar size={14} />
                  <span>{formattedDate}</span>
                </div>
                {draft.filename && (
                  <div className="flex items-center gap-1 min-w-0">
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="text-xs truncate">{draft.filename}</span>
                  </div>
                )}
              </div>
              {isPublished && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete post"
                  type="button"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
