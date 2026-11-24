'use client';

import Link from 'next/link';
import { Template } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { DOCUMENT_TYPES } from '@/lib/template-config';

interface TemplateCardProps {
  template: Template;
}

function documentTypeLabel(value: string): string {
  const match = DOCUMENT_TYPES.find((t) => t.value === value);
  return match ? match.label : value;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const updatedAt = new Date(template.updatedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href={`/templates/${template.id}`}
              className="text-lg font-semibold text-foreground hover:underline"
            >
              {template.name}
            </Link>
            <p className="text-xs text-muted-foreground truncate md:max-w-[300px]">
              {template.description ?? 'No description'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end w-full sm:w-auto">
            <span className="text-xs text-muted-foreground">
              {documentTypeLabel(template.documentType)}
            </span>
            <StatusBadge status={template.status} />
            <span className="text-xs text-muted-foreground">v{template.currentVersion?.versionNumber ?? '—'}</span>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Link
              href={`/templates/${template.id}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View
            </Link>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{updatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
