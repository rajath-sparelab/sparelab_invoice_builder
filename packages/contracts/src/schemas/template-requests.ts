import { z } from 'zod';
import { templateConfigurationSchema } from './template-config';

export const documentTypeSchema = z.string().trim().min(1).max(100);
export type DocumentType = z.infer<typeof documentTypeSchema>;

const actorSchema = z.string().trim().min(1).max(200);

export const createTemplateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    documentType: documentTypeSchema,
    configuration: templateConfigurationSchema,
    createdBy: actorSchema.optional(),
  })
  .strict();
export type CreateTemplateRequest = z.infer<typeof createTemplateRequestSchema>;

export const updateTemplateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    documentType: documentTypeSchema.optional(),
    createdBy: actorSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== 'createdBy'),
    { message: 'At least one template field must be provided' },
  );
export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequestSchema>;

export const createTemplateVersionRequestSchema = z
  .object({
    configuration: templateConfigurationSchema,
    schemaVersion: z.string().trim().min(1).max(50).optional(),
    createdBy: actorSchema.optional(),
  })
  .strict();
export type CreateTemplateVersionRequest = z.infer<
  typeof createTemplateVersionRequestSchema
>;

export const publishTemplateVersionRequestSchema = z
  .object({
    versionId: z.string().uuid('versionId must be a UUID'),
    createdBy: actorSchema.optional(),
  })
  .strict();
export type PublishTemplateVersionRequest = z.infer<
  typeof publishTemplateVersionRequestSchema
>;

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strip();
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
