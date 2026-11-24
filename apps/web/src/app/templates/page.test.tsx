import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplatesPage from './page';
import { apiService } from '@/services/api';

const mockPush = jest.fn();

jest.mock('@/services/api', () => ({
  apiService: {
    getTemplates: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockGetTemplates = apiService.getTemplates as jest.Mock;

describe('Templates dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetTemplates.mockImplementation(() => new Promise(() => {}));
    render(<TemplatesPage />);
    expect(screen.getByText(/loading templates/i)).toBeTruthy();
  });

  it('renders an empty state when no templates exist', async () => {
    mockGetTemplates.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0 },
    });
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getByText(/no templates/i)).toBeTruthy());
  });

  it('renders a list of templates and navigates to detail', async () => {
    const templates = [
      {
        id: 't1',
        name: 'Standard Invoice',
        description: 'Monthly billing',
        documentType: 'INVOICE',
        status: 'DRAFT',
        currentVersionId: 'v1',
        currentVersion: {
          id: 'v1',
          versionNumber: 1,
          schemaVersion: '1.0.0',
          status: 'DRAFT',
          createdBy: null,
          createdAt: '2026-01-01',
          templateId: 't1',
          configuration: {},
        },
        createdBy: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      },
      {
        id: 't2',
        name: 'Quote',
        description: null,
        documentType: 'QUOTATION',
        status: 'PUBLISHED',
        currentVersionId: 'v2',
        currentVersion: {
          id: 'v2',
          versionNumber: 2,
          schemaVersion: '1.0.0',
          status: 'PUBLISHED',
          createdBy: null,
          createdAt: '2026-01-01',
          templateId: 't2',
          configuration: {},
        },
        createdBy: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-03',
      },
    ];
    mockGetTemplates.mockResolvedValue({
      data: templates,
      meta: { page: 1, limit: 20, total: 2 },
    });
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getByText('Standard Invoice')).toBeTruthy());
    expect(screen.getByText('Quote')).toBeTruthy();
    expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(1);

    const link = screen.getByText('Standard Invoice').closest('a');
    expect(link?.getAttribute('href')).toBe('/templates/t1');
  });

  it('filters templates by search text', async () => {
    const templates = [
      {
        id: 't1',
        name: 'Standard Invoice',
        description: null,
        documentType: 'INVOICE',
        status: 'DRAFT',
        currentVersionId: 'v1',
        currentVersion: {
          id: 'v1',
          versionNumber: 1,
          schemaVersion: '1.0.0',
          status: 'DRAFT',
          createdBy: null,
          createdAt: '2026-01-01',
          templateId: 't1',
          configuration: {},
        },
        createdBy: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      },
      {
        id: 't2',
        name: 'Quote',
        description: null,
        documentType: 'QUOTATION',
        status: 'PUBLISHED',
        currentVersionId: 'v2',
        currentVersion: {
          id: 'v2',
          versionNumber: 2,
          schemaVersion: '1.0.0',
          status: 'PUBLISHED',
          createdBy: null,
          createdAt: '2026-01-01',
          templateId: 't2',
          configuration: {},
        },
        createdBy: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-03',
      },
    ];
    mockGetTemplates.mockResolvedValue({
      data: templates,
      meta: { page: 1, limit: 20, total: 2 },
    });
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getByText('Standard Invoice')).toBeTruthy());

    const search = screen.getByPlaceholderText('Search by name');
    fireEvent.change(search, { target: { value: 'Quote' } });
    await waitFor(() => expect(screen.getByText('Quote')).toBeTruthy());
    await waitFor(() => expect(screen.queryByText('Standard Invoice')).toBeNull());
  });

  it('shows error state when fetch fails', async () => {
    mockGetTemplates.mockRejectedValue(new Error('boom'));
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getByText(/boom/i)).toBeTruthy());
  });
});
