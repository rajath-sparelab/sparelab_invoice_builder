import { z } from 'zod';
import type { HealthCheckResponse } from '../types/health';

export const HealthIndicatorSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  database: HealthIndicatorSchema,
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const healthResponseSchema = HealthResponseSchema;
