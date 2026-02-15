'use client';

import { useEffect, useState } from 'react';
import { JSONContent } from '@tiptap/react';
import { useDebounce } from '@/hooks/useDebounce';

interface AutoSaveProps {
  draftId: string;
  content: JSONContent;
  filename?: string;
  markdownSource?: string;
}

export function AutoSave({ draftId, content, filename, markdownSource }: AutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 5000);
  const debouncedFilename = useDebounce(filename, 5000);
  const debouncedMarkdownSource = useDebounce(markdownSource, 5000);

  useEffect(() => {
    const save = async () => {
      if (!draftId) return;

      setIsSaving(true);
      try {
        await fetch(`/api/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: debouncedContent,
            ...(debouncedFilename && { filename: debouncedFilename }),
            ...(debouncedMarkdownSource !== undefined && { markdown_source: debouncedMarkdownSource }),
          }),
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedContent, debouncedFilename, debouncedMarkdownSource, draftId]);

  return (
    <div className="text-sm text-muted-foreground">
      {isSaving ? (
        <span>Saving...</span>
      ) : lastSaved ? (
        <span>Saved at {lastSaved.toLocaleTimeString()}</span>
      ) : (
        <span>Not saved yet</span>
      )}
    </div>
  );
}
