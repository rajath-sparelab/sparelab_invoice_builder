'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { apiService } from '@/services/api';

export function HealthStatus() {
  const [status, setStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [database, setDatabase] = useState<'checking' | 'up' | 'down'>('checking');

  useEffect(() => {
    apiService
      .getHealth()
      .then((data) => {
        setStatus(data.status as 'up' | 'down');
        setDatabase(data.database.status as 'up' | 'down');
      })
      .catch(() => {
        setStatus('down');
        setDatabase('down');
      });
  }, []);

  const badge = (s: 'checking' | 'up' | 'down') => {
    if (s === 'checking') return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-muted border">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking
      </span>
    );
    if (s === 'up') return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">
        <CheckCircle className="h-3 w-3" /> Up
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">
        <XCircle className="h-3 w-3" /> Down
      </span>
    );
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Database className="h-4 w-4" /> Connection Status
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Backend API</span>
          {badge(status)}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Database</span>
          {badge(database)}
        </div>
      </div>
    </div>
  );
}
