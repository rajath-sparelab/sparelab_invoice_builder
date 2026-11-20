import { z } from 'zod';

export const TemplateDocumentTypeSchema = z.enum([
  'INVOICE',
  'PROFORMA_INVOICE',
  'QUOTATION',
  'PURCHASE_ORDER',
  'DELIVERY_CHALLAN',
  'OTHER',
]);

export type TemplateDocumentType = z.infer<typeof TemplateDocumentTypeSchema>;

export const TemplateStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type TemplateStatus = z.infer<typeof TemplateStatusSchema>;

// A dynamic field binding references document data, e.g. "{{invoiceNumber}}".
export const BindingSchema = z.string().regex(/^{{\s*[\w.]+\s*}}$/, {
  message: 'Binding must be in the format {{fieldName}}',
});
export type Binding = z.infer<typeof BindingSchema>;

export const BlockStyleSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  .optional();

export const BaseBlockSchema = z.object({
  id: z.string().min(1, 'Block id is required'),
  type: z.string().min(1, 'Block type is required'),
  visible: z.boolean().optional(),
  style: BlockStyleSchema,
});
export type BaseBlock = z.infer<typeof BaseBlockSchema>;

export const TextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  binding: BindingSchema.optional(),
});
export type TextBlock = z.infer<typeof TextBlockSchema>;

export const ImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('image'),
  // Image source must be a URL or a data binding. Arbitrary HTML is not allowed.
  src: z
    .string()
    .refine(
      (value) => /^https?:\/\//.test(value) || BindingSchema.safeParse(value).success,
      { message: 'Image src must be a URL or a {{binding}}' },
    ),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});
export type ImageBlock = z.infer<typeof ImageBlockSchema>;

export const TableColumnSchema = z.object({
  id: z.string().min(1),
  header: z.string().min(1),
  key: z.string().min(1),
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('table'),
  columns: z.array(TableColumnSchema).min(1, 'A table must have at least one column'),
  rows: z.array(z.array(z.string())).min(1, 'A table must have at least one row'),
});
export type TableBlock = z.infer<typeof TableBlockSchema>;

export const BlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  ImageBlockSchema,
  TableBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

export const SectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  visible: z.boolean().optional(),
  blocks: z.array(BlockSchema),
  style: BlockStyleSchema,
});
export type Section = z.infer<typeof SectionSchema>;

export const PageSettingsSchema = z.object({
  size: z.enum(['A4', 'A3', 'A5', 'Letter', 'Legal']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  margins: z
    .object({
      top: z.number().nonnegative().default(20),
      right: z.number().nonnegative().default(20),
      bottom: z.number().nonnegative().default(20),
      left: z.number().nonnegative().default(20),
    })
    .default({ top: 20, right: 20, bottom: 20, left: 20 }),
});
export type PageSettings = z.infer<typeof PageSettingsSchema>;

export const HeaderFooterSchema = z.object({
  blocks: z.array(BlockSchema),
  style: BlockStyleSchema,
});
export type HeaderFooter = z.infer<typeof HeaderFooterSchema>;

/**
 * Template configuration JSON schema (version 1).
 *
 * Represents the layout of a document template. Kept separate from generated
 * document data. No executable JavaScript or arbitrary HTML is permitted.
 */
export const TemplateConfigurationSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  page: PageSettingsSchema.optional(),
  sections: z.array(SectionSchema).min(1, 'A template must have at least one section'),
  header: HeaderFooterSchema.optional(),
  footer: HeaderFooterSchema.optional(),
});
export type TemplateConfiguration = z.infer<typeof TemplateConfigurationSchema>;

/**
 * Validates a template configuration object and returns the parsed result.
 * Throws a ZodError when the configuration is invalid.
 */
export function validateTemplateConfiguration(
  value: unknown,
): TemplateConfiguration {
  return TemplateConfigurationSchema.parse(value);
}

export const templateConfigurationSchema = TemplateConfigurationSchema;
