'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { Template } from '@/services/api';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { DOCUMENT_TYPES } from '@/lib/template-config';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (docTypeFilter && t.documentType !== docTypeFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      return true;
    });
  }, [templates, search, docTypeFilter, statusFilter]);

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">
              Manage your document templates.
            </p>
          </div>
          <Button onClick={() => router.push('/templates/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>
        <div className="animate-pulse rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">Loading templates…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">
              Manage your document templates.
            </p>
          </div>
          <Button onClick={() => router.push('/templates/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>
        <Card className="p-6">
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchTemplates} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage your document templates.
          </p>
        </div>
        <Button onClick={() => router.push('/templates/new')}>
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle>Filters</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="template-search"
              placeholder="Search by name"
              className="flex-1 h-8 px-3 text-sm border border-input rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              id="template-doctype"
              className="h-8 px-3 text-sm border border-input rounded-lg bg-background"
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
            >
              <option value="">All document types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              id="template-status"
              className="h-8 px-3 text-sm border border-input rounded-lg bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground">
                No templates match your filters.
              </p>
              {!search || !docTypeFilter || !statusFilter ? (
                <Button onClick={fetchTemplates} className="mt-4">
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => router.push('/templates/new')} className="mt-4">
                  Create Template
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
