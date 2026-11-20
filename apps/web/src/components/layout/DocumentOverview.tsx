'use client';

import { FileText, Plus, Users, Clock } from 'lucide-react';

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
        <h2 className="text-sm font-semibold uppercase tracking-wider">Overview</h2>
        <div className="grid gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
                <div className="p-2 rounded-md bg-muted/50">
                  <stat.icon className="h-5 w-5 {stat.color}" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
