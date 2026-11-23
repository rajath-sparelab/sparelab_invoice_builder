import { z } from 'zod';

/**
 * Generated document data schema.
 *
 * Represents the runtime data supplied when generating a document from a
 * template. Must be a plain JSON object. Kept separate from the template
 * configuration (layout).
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

const unsafeDataKeys = new Set(['__proto__', 'constructor', 'prototype']);

export const DocumentDataSchema = z
  .record(jsonValueSchema)
  .refine(
    (value) => !Object.keys(value).some((key) => unsafeDataKeys.has(key)),
    { message: 'Document data contains a disallowed key' },
  );
export type DocumentData = z.infer<typeof DocumentDataSchema>;
export type JsonObject = DocumentData;

/**
 * Validates that a value is a JSON object suitable as generated document data.
 */
export function validateDocumentData(value: unknown): DocumentData {
  return DocumentDataSchema.parse(value);
}

export const documentDataSchema = DocumentDataSchema;
