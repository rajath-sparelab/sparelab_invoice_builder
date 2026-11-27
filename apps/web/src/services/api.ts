import { z } from 'zod';
import {
  HealthResponseSchema,
  type CreateTemplateRequest,
  type UpdateTemplateRequest,
  type CreateTemplateVersionRequest,
} from '@sparelab/contracts';

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  schemaVersion: string;
  configuration: unknown;
  status: 'DRAFT' | 'PUBLISHED';
  createdBy: string | null;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  documentType: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  currentVersionId: string | null;
  currentVersion: TemplateVersion | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatesListResponse {
  data: Template[];
  meta: { page: number; limit: number; total: number };
}

export interface TemplateDetailResponse {
  data: Template;
}

export interface TemplateVersionResponse {
  data: TemplateVersion;
}

export interface TemplateVersionsListResponse {
  data: TemplateVersion[];
}

export interface PublishResponse {
  data: { template: Template; version: TemplateVersion };
}

export interface CreateTemplateResponse {
  data: { template: Template; version: TemplateVersion };
}

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

  /* ------------------------------------------------------------------ */
  // Templates
  /* ------------------------------------------------------------------ */

  async getTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<TemplatesListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const path = query.toString() ? `/templates?${query.toString()}` : '/templates';
    const data = await this.request<TemplatesListResponse>(path);
    return data;
  }

  async createTemplate(dto: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    const data = await this.request<CreateTemplateResponse>('/templates', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return data;
  }

  async getTemplate(id: string): Promise<TemplateDetailResponse> {
    const data = await this.request<TemplateDetailResponse>(`/templates/${id}`);
    return data;
  }

  async updateTemplate(
    id: string,
    dto: UpdateTemplateRequest,
  ): Promise<TemplateDetailResponse> {
    const data = await this.request<TemplateDetailResponse>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return data;
  }

  async createVersion(
    templateId: string,
    dto: CreateTemplateVersionRequest,
  ): Promise<TemplateVersionResponse> {
    const data = await this.request<TemplateVersionResponse>(
      `/templates/${templateId}/versions`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
    return data;
  }

  async listVersions(templateId: string): Promise<TemplateVersionsListResponse> {
    const data = await this.request<TemplateVersionsListResponse>(
      `/templates/${templateId}/versions`,
    );
    return data;
  }

  async getVersion(
    templateId: string,
    versionId: string,
  ): Promise<TemplateVersionResponse> {
    const data = await this.request<TemplateVersionResponse>(
      `/templates/${templateId}/versions/${versionId}`,
    );
    return data;
  }

  async publishVersion(
    templateId: string,
    versionId: string,
  ): Promise<PublishResponse> {
    const data = await this.request<PublishResponse>(
      `/templates/${templateId}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({ versionId }),
      },
    );
    return data;
  }

  /* ------------------------------------------------------------------ */
  // PDF generation
  /* ------------------------------------------------------------------ */

  async downloadPdf(
    templateId: string,
    dto: { data: Record<string, unknown>; configuration?: unknown; filename?: string },
  ): Promise<Blob> {
    const path = `/templates/${templateId}/pdf`;
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API error: ${res.status} ${res.statusText}${text ? ': ' + text : ''}`);
    }

    return res.blob();
  }
}

export const apiService = new ApiService(API_BASE);
