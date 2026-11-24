'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { createTemplateFormSchema } from '@/lib/template-config';
import { DEFAULT_CONFIG } from '@/lib/template-config';
import { DOCUMENT_TYPES } from '@/lib/template-config';
import type { CreateTemplateFormValues } from '@/lib/template-config';

export default function NewTemplatePage() {
  const router = useRouter();
  const [values, setValues] = useState<CreateTemplateFormValues>({
    name: '',
    description: '',
    documentType: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTemplateFormValues, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const result = createTemplateFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateTemplateFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof CreateTemplateFormValues;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await apiService.createTemplate({
        name: values.name.trim(),
        description: (values.description ?? '').trim() || undefined,
        documentType: values.documentType,
        configuration: DEFAULT_CONFIG,
      });
      router.push(`/templates/${response.data.template.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create template. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Create Template</h1>
          <p className="text-muted-foreground">
            Define a new document template. A draft version will be created automatically.
          </p>
        </div>
        <Button onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Template details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 items-end">
            <div className="col-span-full space-y-1">
              <label htmlFor="template-name" className="text-sm font-medium text-foreground">
                Template name
              </label>
              <input
                id="template-name"
                type="text"
                placeholder="e.g. Standard Invoice"
                className="h-10 px-3 text-sm border rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="col-span-full space-y-1">
              <label htmlFor="template-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="template-description"
                placeholder="What kind of documents will this template generate?"
                rows={3}
                className="h-24 px-3 text-sm border rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="col-span-full sm:col-span-1 space-y-1">
              <label htmlFor="template-doctype" className="text-sm font-medium text-foreground">
                Document type
              </label>
              <select
                id="template-doctype"
                className="h-10 px-3 text-sm border rounded-md bg-background focus-visible:ring-2 focus-visible:ring-ring"
                value={values.documentType}
                onChange={(e) => setValues({ ...values, documentType: e.target.value })}
              >
                <option value="">Select a document type</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.documentType && (
                <p className="text-xs text-destructive">{errors.documentType}</p>
              )}
            </div>

            {submitError && (
              <div className="col-span-full rounded-lg border border-destructive/50 bg-destructive/50 p-3 text-destructive text-sm">
                {submitError}
              </div>
            )}

            <div className="col-span-full flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={!loading ? handleSubmit : undefined}>
                {loading ? 'Creating…' : 'Create template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
