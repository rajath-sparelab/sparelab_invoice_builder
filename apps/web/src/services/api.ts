import { z } from 'zod';
import { HealthResponseSchema } from '@sparelab/contracts';

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async getHealth(): Promise<HealthResponse> {
    const data = await this.request<unknown>('/health');
    return HealthResponseSchema.parse(data);
  }
}

export const apiService = new ApiService(API_BASE);
