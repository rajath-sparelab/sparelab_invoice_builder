import { z } from 'zod';
import { documentDataSchema } from './document-data';
import { documentTypeSchema } from './template-requests';

export const createDocumentRequestSchema = z
  .object({
    templateId: z.string().uuid('templateId must be a UUID').optional(),
    templateVersionId: z.string().uuid('templateVersionId must be a UUID'),
    documentType: documentTypeSchema,
    data: documentDataSchema,
    externalReferenceId: z.string().trim().min(1).max(200).optional(),
    createdBy: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type CreateDocumentRequest = z.infer<typeof createDocumentRequestSchema>;
