'use client';

import { useEffect, useState } from 'react';
import { HealthStatus } from '@/components/layout/HealthStatus';
import { DocumentOverview } from '@/components/layout/DocumentOverview';

export default function Dashboard() {
  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Document Builder</h1>
          <p className="text-muted-foreground">
            Configurable document builder dashboard. Backend status:
          </p>
          <HealthStatus />
        </div>
        <DocumentOverview />
      </div>
    </main>
  );
}
