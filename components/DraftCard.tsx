'use client';

import Link from 'next/link';
import { Draft } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { FileText, Calendar, Tag } from 'lucide-react';

interface DraftCardProps {
  draft: Draft;
}

export function DraftCard({ draft }: DraftCardProps) {
  const formattedDate = new Date(draft.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/editor/${draft.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {draft.title || 'Untitled'}
              </CardTitle>
              {draft.excerpt && (
                <CardDescription className="line-clamp-2">
                  {draft.excerpt}
                </CardDescription>
              )}
            </div>
            {draft.status === 'published' && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Published
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            {draft.category && (
              <div className="flex items-center gap-1">
                <FileText size={14} />
                <span>{draft.category}</span>
              </div>
            )}
            {draft.tags && draft.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag size={14} />
                <span>{draft.tags.slice(0, 3).join(', ')}</span>
                {draft.tags.length > 3 && <span>+{draft.tags.length - 3}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
