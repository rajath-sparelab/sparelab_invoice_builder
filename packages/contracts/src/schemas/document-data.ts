import { z } from 'zod';

/**
 * Generated document data schema.
 *
 * Represents the runtime data supplied when generating a document from a
 * template. Must be a plain JSON object. Kept separate from the template
 * configuration (layout).
 */
export const DocumentDataSchema = z.record(z.unknown());
export type DocumentData = z.infer<typeof DocumentDataSchema>;

/**
 * Validates that a value is a JSON object suitable as generated document data.
 */
export function validateDocumentData(value: unknown): DocumentData {
  return DocumentDataSchema.parse(value);
}

export const documentDataSchema = DocumentDataSchema;
