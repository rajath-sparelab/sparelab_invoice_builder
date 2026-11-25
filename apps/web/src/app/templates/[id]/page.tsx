'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import type { Template, TemplateVersion } from '@/services/api';
import { StatusBadge } from '@/components/templates/StatusBadge';
import { VersionHistory } from '@/components/templates/VersionHistory';
import { PublishDialog } from '@/components/templates/PublishDialog';
import { DOCUMENT_TYPES } from '@/lib/template-config';

interface UpdateTemplateInput {
  name?: string;
  description?: string;
  documentType?: string;
}

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const templateId = params.id;
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit metadata form state
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState<{
    name: string;
    description: string;
    documentType: string;
  }>({ name: '', description: '', documentType: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Publish dialog state
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishVersionId, setPublishVersionId] = useState<string>('');
  const [publishVersionNumber, setPublishVersionNumber] = useState(0);

  // Create version state
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getTemplate(templateId);
      const t = response.data;
      setTemplate(t);
      setFormValues({
        name: t.name,
        description: t.description ?? '',
        documentType: t.documentType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template.');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const fetchVersions = useCallback(async () => {
    try {
      const response = await apiService.listVersions(templateId);
      setVersions(response.data);
    } catch {
      // Versions failing should not block the whole page; keep empty list.
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
      fetchVersions();
    }
  }, [templateId, fetchTemplate, fetchVersions]);

  const refresh = useCallback(() => {
    fetchTemplate();
    fetchVersions();
    router.refresh();
  }, [templateId, fetchTemplate, fetchVersions, router]);

  const handlePublishClick = (versionId: string, versionNumber: number) => {
    setPublishVersionId(versionId);
    setPublishVersionNumber(versionNumber);
    setPublishOpen(true);
  };

  // ---- Edit metadata ----
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitError(null);
    setFormErrors({});

    const templateData = template;
    if (!templateData) return;

    const updates: UpdateTemplateInput = {};
    if (formValues.name.trim() !== templateData.name) updates.name = formValues.name.trim();
    if (
      (formValues.description.trim() ?? '') !== (templateData.description ?? '')
    ) {
      updates.description = formValues.description.trim() ?? undefined;
    }
    if (formValues.documentType !== templateData.documentType) {
      updates.documentType = formValues.documentType;
    }

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }

    if (!updates.name || updates.name.length > 200) {
      setFormErrors({ name: 'Template name is required (max 200 characters)' });
      return;
    }

    setFormLoading(true);
    try {
      await apiService.updateTemplate(templateId, updates);
      setEditing(false);
      await refresh();
    } catch (err) {
      setFormSubmitError(
        err instanceof Error ? err.message : 'Failed to update template.',
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ---- Create new version ----
  const handleCreateVersion = async () => {
    const templateData = template;
    if (!templateData) return;
    const latest = templateData.currentVersion;
    if (!latest) return;

    setVersionError(null);
    setVersionLoading(true);
    try {
      await apiService.createVersion(templateId, {
        configuration: latest.configuration as import('@sparelab/contracts').TemplateConfiguration,
      });
      await refresh();
    } catch (err) {
      setVersionError(err instanceof Error ? err.message : 'Failed to create version.');
    } finally {
      setVersionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Template</h1>
            <p className="text-muted-foreground">Loading template details…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Template</h1>
            <p className="text-muted-foreground">Template details</p>
          </div>
          <Button onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <Card className="p-6">
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchTemplate} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const t = template!;
  const docTypeLabel = DOCUMENT_TYPES.find((d) => d.value === t.documentType)?.label;
  const currentVersion = t.currentVersion;

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t.name}</h1>
          <p className="text-muted-foreground">
            {t.description ?? 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.back()}>
            Back
          </Button>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={!formLoading ? handleEditSave : undefined}>
                {formLoading ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)}>
                Edit metadata
              </Button>
              <Button
                onClick={() => router.push('/templates')}
                variant="outline"
              >
                All templates
              </Button>
              <Button
                onClick={() => router.push(`/templates/${templateId}/editor`)}
              >
                Open editor
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Edit template metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form id="template-edit-form" onSubmit={handleEditSave} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                  Template name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className="h-10 px-3 text-sm border rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  rows={3}
                  className="h-24 px-3 text-sm border rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues({ ...formValues, description: e.target.value })
                  }
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive">{formErrors.description}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-doctype" className="text-sm font-medium text-foreground">
                  Document type
                </label>
                <select
                  id="edit-doctype"
                  className="h-10 px-3 text-sm border rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={formValues.documentType}
                  onChange={(e) =>
                    setFormValues({ ...formValues, documentType: e.target.value })
                  }
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {formErrors.documentType && (
                  <p className="text-xs text-destructive">{formErrors.documentType}</p>
                )}
              </div>

              {formSubmitError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/50 p-3 text-destructive text-sm">
                  {formSubmitError}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Metadata display */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={t.status} className="mt-2 inline-block" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Document type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{docTypeLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              v{currentVersion?.versionNumber ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {new Date(t.updatedAt).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Version history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Version history</CardTitle>
          {versionError && <p className="text-xs text-destructive">{versionError}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <VersionHistory versions={versions} />
            {versions.length > 0 && (
              <div className="pt-4 flex items-center gap-2 border-t">
                <Button
                  size="sm"
                  onClick={!versionLoading ? handleCreateVersion : undefined}
                >
                  {versionLoading ? 'Creating…' : 'Create new version'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publish actions per draft version */}
      <div className="space-y-2">
        {versions
          .filter((v) => v.status === 'DRAFT')
          .map((v) => (
            <Button
              key={v.id}
              variant="outline"
              onClick={() => handlePublishClick(v.id, v.versionNumber)}
              className="w-full md:w-auto text-sm"
            >
              Publish v{v.versionNumber}
            </Button>
          ))}
      </div>

      {/* Publish dialog for draft versions */}
      {publishOpen && (
        <PublishDialog
          open
          onClose={() => setPublishOpen(false)}
          templateId={t.id}
          versionId={publishVersionId}
          versionNumber={publishVersionNumber}
          onSuccess={refresh}
        />
      )}
    </main>
  );
}
