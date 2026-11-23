export { HealthResponseSchema, healthResponseSchema, type HealthResponse } from './schemas/health';
export type { HealthCheckResponse } from './types/health';

export {
  type TemplateConfiguration,
  validateTemplateConfiguration,
  templateConfigurationSchema,
} from './schemas/template-config';
export type { TemplateDocumentType } from './schemas/template-config';
export { TemplateDocumentTypeSchema } from './schemas/template-config';
export type { TemplateStatus } from './schemas/template-config';
export { TemplateStatusSchema } from './schemas/template-config';
export type { Block } from './schemas/template-config';
export { BlockSchema } from './schemas/template-config';
export type { Section } from './schemas/template-config';
export { SectionSchema } from './schemas/template-config';

export {
  type DocumentData,
  type JsonObject,
  type JsonValue,
  validateDocumentData,
  documentDataSchema,
  jsonValueSchema,
} from './schemas/document-data';

export {
  type BlockStyle,
  type VisibilityCondition,
  BlockStyleSchema,
  VisibilityConditionSchema,
} from './schemas/template-config';

export {
  type CreateTemplateRequest,
  type UpdateTemplateRequest,
  type CreateTemplateVersionRequest,
  type PublishTemplateVersionRequest,
  type PaginationQuery,
  type DocumentType,
  createTemplateRequestSchema,
  updateTemplateRequestSchema,
  createTemplateVersionRequestSchema,
  publishTemplateVersionRequestSchema,
  paginationQuerySchema,
  documentTypeSchema,
} from './schemas/template-requests';

export {
  type CreateDocumentRequest,
  createDocumentRequestSchema,
} from './schemas/document-requests';
