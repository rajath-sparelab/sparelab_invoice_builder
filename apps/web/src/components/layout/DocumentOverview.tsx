'use client';

import { FileText, Plus, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocumentOverview() {
  const stats = [
    { label: 'Total Documents', value: '0', icon: FileText, color: 'text-primary' },
    { label: 'Pending Review', value: '0', icon: Clock, color: 'text-muted-foreground' },
    { label: 'Templates', value: '0', icon: Plus, color: 'text-muted-foreground' },
    { label: 'Collaborators', value: '0', icon: Users, color: 'text-muted-foreground' },
  ];

  return (
    <aside className="lg:w-64 flex-1 space-y-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
        <div className="grid gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-4 bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
