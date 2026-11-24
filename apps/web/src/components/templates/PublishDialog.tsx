'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  versionId: string;
  versionNumber: number;
  onSuccess: () => void;
}

export function PublishDialog({
  open,
  onClose,
  templateId,
  versionId,
  versionNumber,
  onSuccess,
}: PublishDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiService.publishVersion(templateId, versionId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to publish version. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Card className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background shadow-lg">
        <CardHeader>
          <CardTitle>Publish version v{versionNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Publishing will make this version the current published version of the template.
            This action cannot be undone from this screen.
          </p>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/50 p-3 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={!loading ? onClose : undefined}>
              Cancel
            </Button>
            <Button onClick={!loading ? handlePublish : undefined}>
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Card>
  );
}
