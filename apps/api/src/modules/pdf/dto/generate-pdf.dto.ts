import { z } from 'zod';
import { documentDataSchema, templateConfigurationSchema } from '@sparelab/contracts';

export const generatePdfRequestSchema = z.object({
  data: documentDataSchema,
  // Optional: the configuration to render (e.g. unsaved editor draft). When
  // omitted, the template's current version configuration is used.
  configuration: templateConfigurationSchema.optional(),
  filename: z.string().min(1).max(200).optional(),
});

export type GeneratePdfRequest = z.infer<typeof generatePdfRequestSchema>;

export interface GeneratePdfResult {
  pdf: Buffer;
  filename: string;
  size: number;
}
