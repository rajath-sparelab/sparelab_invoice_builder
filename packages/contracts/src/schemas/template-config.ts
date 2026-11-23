import { z } from 'zod';
import { jsonValueSchema } from './document-data';

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
export const BindingSchema = z
  .string()
  .regex(/^{{\s*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\s*}}$/, {
    message: 'Binding must be in the format {{fieldName}}',
  });
export type Binding = z.infer<typeof BindingSchema>;

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/, 'Invalid id');
const dataPathSchema = z
  .string()
  .regex(/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/, 'Invalid data path');
const unsafeTextPattern = /<\s*\/?\s*[a-z][^>]*>|javascript:|expression\s*\(|on[a-z]+\s*=/i;
const safeTextSchema = z
  .string()
  .max(5000)
  .refine((value) => !unsafeTextPattern.test(value), {
    message: 'HTML, JavaScript and executable expressions are not allowed',
  });

const stylePropertySchema = z.enum([
  'backgroundColor',
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'textDecoration',
  'lineHeight',
  'letterSpacing',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'border',
  'borderColor',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'width',
  'height',
  'maxWidth',
  'minWidth',
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
  'opacity',
  'pageBreakBefore',
  'pageBreakAfter',
]);

const safeStyleValueSchema = z.union([
  z.number().finite(),
  z.boolean(),
  z.string().max(200).refine(
    (value) => !/[<>]|javascript:|expression\s*\(|url\s*\(/i.test(value),
    { message: 'Unsafe style value' },
  ),
]);

export const BlockStyleSchema = z
  .record(z.string(), safeStyleValueSchema)
  .refine(
    (style) =>
      Object.keys(style).every((key) => stylePropertySchema.safeParse(key).success),
    { message: 'Unsupported style property' },
  )
  .optional();
export type BlockStyle = z.infer<typeof BlockStyleSchema>;

export const VisibilityConditionSchema = z
  .object({
    field: dataPathSchema,
    operator: z.enum([
      'eq',
      'ne',
      'gt',
      'gte',
      'lt',
      'lte',
      'in',
      'notIn',
      'exists',
      'notExists',
    ]),
    value: jsonValueSchema.optional(),
  })
  .superRefine((condition, ctx) => {
    const valueRequired = !['exists', 'notExists'].includes(condition.operator);
    if (valueRequired && condition.value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'A comparison value is required for this operator',
      });
    }
    if (
      ['in', 'notIn'].includes(condition.operator) &&
      !Array.isArray(condition.value)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'This operator requires an array value',
      });
    }
  });
export type VisibilityCondition = z.infer<typeof VisibilityConditionSchema>;

export const BaseBlockSchema = z.object({
  id: idSchema,
  type: z.string().min(1, 'Block type is required'),
  visible: z.boolean().optional(),
  visibleWhen: VisibilityConditionSchema.optional(),
  style: BlockStyleSchema,
});
export type BaseBlock = z.infer<typeof BaseBlockSchema>;

export const TextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('text'),
  content: safeTextSchema,
  binding: BindingSchema.optional(),
});
export type TextBlock = z.infer<typeof TextBlockSchema>;

export const ImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('image'),
  // Image source must be a URL or a data binding. Arbitrary HTML is not allowed.
  src: z
    .string()
    .refine(
      (value) => /^https?:\/\/[^\s<>]+$/.test(value) || BindingSchema.safeParse(value).success,
      { message: 'Image src must be a URL or a {{binding}}' },
    ),
  alt: safeTextSchema.optional(),
  width: z.number().positive().finite().optional(),
  height: z.number().positive().finite().optional(),
});
export type ImageBlock = z.infer<typeof ImageBlockSchema>;

export const TableColumnSchema = z.object({
  id: idSchema,
  header: safeTextSchema,
  key: dataPathSchema,
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('table'),
  columns: z.array(TableColumnSchema).min(1, 'A table must have at least one column'),
  rows: z.array(z.array(safeTextSchema)).min(1, 'A table must have at least one row'),
  repeat: BindingSchema.optional(),
});
export type TableBlock = z.infer<typeof TableBlockSchema>;

export const BlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  ImageBlockSchema,
  TableBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

export const SectionSchema = z.object({
  id: idSchema,
  name: safeTextSchema.optional(),
  visible: z.boolean().optional(),
  visibleWhen: VisibilityConditionSchema.optional(),
  blocks: z.array(BlockSchema),
  style: BlockStyleSchema,
});
export type Section = z.infer<typeof SectionSchema>;

export const PageSettingsSchema = z.object({
  size: z.enum(['A4', 'A3', 'A5', 'Letter', 'Legal']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  margins: z
    .object({
      top: z.number().nonnegative().finite().default(20),
      right: z.number().nonnegative().finite().default(20),
      bottom: z.number().nonnegative().finite().default(20),
      left: z.number().nonnegative().finite().default(20),
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
