'use client';

import { useEffect, useState } from 'react';
import { JSONContent } from '@tiptap/react';
import { useDebounce } from '@/hooks/useDebounce';

interface AutoSaveProps {
  draftId: string;
  content: JSONContent;
  title: string;
}

export function AutoSave({ draftId, content, title }: AutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 5000);
  const debouncedTitle = useDebounce(title, 5000);

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
            title: debouncedTitle,
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
  }, [debouncedContent, debouncedTitle, draftId]);

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
