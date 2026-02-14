'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Draft } from '@/types';
import { Button } from '@/components/ui/Button';
import { DraftCard } from '@/components/DraftCard';
import { Plus, LogOut } from 'lucide-react';

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts');
      const data = await response.json();
      if (data.success) {
        setDrafts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">My Drafts</h1>
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
      </header>

      <main className="container mx-auto px-4 py-8">
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No drafts yet. Create your first post!
            </p>
            <Button onClick={handleCreateDraft} isLoading={isCreating}>
              <Plus size={18} className="mr-2" />
              Create First Draft
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
