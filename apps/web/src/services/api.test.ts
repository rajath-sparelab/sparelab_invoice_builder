import { apiService } from './api';

const baseUrl = 'http://localhost:3001/api';

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Not Found',
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('apiService', () => {
  const originalFetch = (globalThis as unknown as { fetch?: typeof fetch }).fetch;
  let mockFetch: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue(mockResponse({ data: {} }));

    restore = () => {
      if (originalFetch) {
        (globalThis as unknown as { fetch?: typeof fetch }).fetch = originalFetch;
      } else {
        delete (globalThis as unknown as { fetch?: typeof fetch }).fetch;
      }
    };

    (globalThis as unknown as { fetch?: typeof fetch }).fetch = mockFetch;
  });

  afterEach(() => {
    restore();
  });

  it('getTemplates calls GET /templates with query params', async () => {
    await apiService.getTemplates({ page: 2, limit: 10 });
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates?page=2&limit=10`,
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('createTemplate calls POST /templates with body', async () => {
    await apiService.createTemplate({
      name: 'Invoice',
      documentType: 'INVOICE',
      configuration: { schemaVersion: '1.0.0', sections: [] },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Invoice',
          documentType: 'INVOICE',
          configuration: { schemaVersion: '1.0.0', sections: [] },
        }),
      }),
    );
  });

  it('getTemplate calls GET /templates/:id', async () => {
    await apiService.getTemplate('abc-123');
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates/abc-123`,
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('updateTemplate calls PATCH /templates/:id', async () => {
    await apiService.updateTemplate('abc-123', { name: 'New' });
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates/abc-123`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'New' }),
      }),
    );
  });

  it('createVersion calls POST /templates/:id/versions', async () => {
    await apiService.createVersion('abc-123', {
      configuration: { schemaVersion: '1.0.0', sections: [] },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates/abc-123/versions`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('listVersions calls GET /templates/:id/versions', async () => {
    await apiService.listVersions('abc-123');
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates/abc-123/versions`,
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('publishVersion calls POST /templates/:id/publish', async () => {
    await apiService.publishVersion('abc-123', 'ver-1');
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/templates/abc-123/publish`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ versionId: 'ver-1' }),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Not found' }, 404));
    await expect(apiService.getTemplate('missing')).rejects.toThrow('API error: 404');
  });
});
