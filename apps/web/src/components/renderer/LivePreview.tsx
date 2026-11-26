'use client';

import React, { useState } from 'react';
import type { DocumentData, TemplateConfiguration } from '@sparelab/contracts';
import { DocumentRenderer } from './DocumentRenderer';

/**
 * Representative sample document data used by the live preview so the preview
 * always renders something meaningful without needing a backend round-trip.
 */
const SAMPLE_DATA: DocumentData = {
  documentNumber: 'INV-2026-001',
  documentDate: '26 Nov 2026',
  title: 'Tax Invoice',
  seller: {
    name: 'SpareLab Supplies',
    address: '123 Industrial Area, Mumbai, MH 400001',
    gstin: '27AABCU9603R1ZM',
  },
  customer: {
    name: 'Acme Traders',
    address: '456 Market Street, Bengaluru, KA 560001',
    gstin: '29ABCDE1234F1Z5',
  },
  items: [
    { item: 'Widget A', quantity: 2, unitPrice: 750, taxableAmount: 1500, totalAmount: 1500 },
    { item: 'Widget B', quantity: 1, unitPrice: 2500, taxableAmount: 2500, totalAmount: 2500 },
    { item: 'Widget C', quantity: 3, unitPrice: 400, taxableAmount: 1200, totalAmount: 1200 },
  ],
  subtotal: 5200,
  tax: 936,
  total: 6136,
  page: 1,
  showHeader: true,
  showLogo: true,
};

interface LivePreviewProps {
  config: TemplateConfiguration | null;
}

/**
 * Live preview of a template configuration using sample data. Shows an error
 * state when rendering fails and re-renders whenever the configuration changes.
 */
export function LivePreview({ config }: LivePreviewProps) {
  const [error, setError] = useState<string | null>(null);

  let preview: React.ReactNode = null;
  if (config) {
    try {
      preview = <DocumentRenderer config={config} data={SAMPLE_DATA} />;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview.');
      preview = null;
    }
  }

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </h2>
        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 rounded">
          Sample data
        </span>
      </div>

      {error && (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div className="max-w-sm">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!error && (
        <div className="flex-1 overflow-auto p-4">
          {preview}
        </div>
      )}
    </section>
  );
}
