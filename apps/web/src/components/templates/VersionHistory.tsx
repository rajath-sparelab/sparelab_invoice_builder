'use client';

import { TemplateVersion } from '@/services/api';
import { StatusBadge } from './StatusBadge';

interface VersionHistoryProps {
  versions: TemplateVersion[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionHistory({ versions }: VersionHistoryProps) {
  const ordered = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  if (ordered.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">No versions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 pl-4 pr-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Version
            </th>
            <th className="pb-3 pr-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Schema
            </th>
            <th className="pb-3 pr-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="pb-3 pr-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ordered.map((version) => (
            <tr key={version.id} className="hover:bg-muted/50 transition-colors">
              <td className="pb-3 pl-4 pr-2 font-medium">
                v{version.versionNumber}
              </td>
              <td className="pb-3 pr-2 text-muted-foreground">
                {version.schemaVersion}
              </td>
              <td className="pb-3 pr-2">
                <StatusBadge status={version.status} />
              </td>
              <td className="pb-3 pr-2 text-muted-foreground">
                {formatDate(version.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
