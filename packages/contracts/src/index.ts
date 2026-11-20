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
  validateDocumentData,
  documentDataSchema,
} from './schemas/document-data';
