import { z } from 'zod';
import { type TemplateDocumentType, type TemplateStatus } from '@sparelab/contracts';

/**
 * Client-facing document type options used by the template create/edit forms.
 * Values mirror the backend TemplateDocumentType enum.
 */
export const DOCUMENT_TYPES: Array<{ value: TemplateDocumentType; label: string }> = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'DELIVERY_CHALLAN', label: 'Delivery Challan' },
  { value: 'OTHER', label: 'Other' },
] as const;

/**
 * Display labels and Tailwind color variants for template statuses.
 */
export const TEMPLATE_STATUS: Record<
  TemplateStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  PUBLISHED: { label: 'Published', variant: 'default' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
};

/**
 * Minimal valid template configuration for a newly created template.
 * A single text section satisfies the backend's "at least one section" rule.
 */
export const DEFAULT_CONFIG = {
  schemaVersion: '1.0.0',
  page: {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  sections: [
    {
      id: 'section-1',
      name: 'Content',
      blocks: [
        {
          id: 'block-1',
          type: 'text' as const,
          content: '',
        },
      ],
    },
  ],
};

/**
 * Client-side validation schema for the create-template form.
 * Mirrors the fields exposed by createTemplateRequestSchema that the UI collects
 * (name, description, documentType). The configuration is supplied by the backend.
 */
export const createTemplateFormSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  documentType: z
    .string()
    .trim()
    .min(1, 'Document type is required')
    .refine((value) => DOCUMENT_TYPES.some((t) => t.value === value), {
      message: 'Select a valid document type',
    }),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;
