import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewTemplatePage from './page';
import { apiService } from '@/services/api';

const mockPush = jest.fn();

jest.mock('@/services/api', () => ({
  apiService: {
    createTemplate: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockCreateTemplate = apiService.createTemplate as jest.Mock;

describe('Create template page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form fields', () => {
    render(<NewTemplatePage />);
    expect(screen.getByLabelText(/template name/i)).toBeTruthy();
    expect(screen.getByLabelText(/description/i)).toBeTruthy();
    expect(screen.getByLabelText(/document type/i)).toBeTruthy();
  });

  it('shows validation errors when submitting an empty form', () => {
    render(<NewTemplatePage />);
    fireEvent.click(screen.getByRole('button', { name: /create template/i }));
    expect(screen.getByText(/template name is required/i)).toBeTruthy();
    expect(screen.getByText(/select a valid document type/i)).toBeTruthy();
    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });

  it('creates a template and redirects to its detail page', async () => {
    mockCreateTemplate.mockResolvedValue({
      data: {
        template: {
          id: 't-1',
          name: 'Invoice',
          description: null,
          documentType: 'INVOICE',
          status: 'DRAFT',
          currentVersionId: 'v-1',
          currentVersion: null,
          createdBy: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        version: null,
      },
    });
    render(<NewTemplatePage />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: 'Invoice' },
    });
    fireEvent.change(screen.getByLabelText(/document type/i), {
      target: { value: 'INVOICE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create template/i }));

    await waitFor(() => expect(mockCreateTemplate).toHaveBeenCalled());
    expect(mockCreateTemplate).toHaveBeenCalledWith({
      name: 'Invoice',
      description: undefined,
      documentType: 'INVOICE',
      configuration: expect.any(Object),
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/templates/t-1'));
  });

  it('shows an error when creation fails', async () => {
    mockCreateTemplate.mockRejectedValue(new Error('server error'));
    render(<NewTemplatePage />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: 'Invoice' },
    });
    fireEvent.change(screen.getByLabelText(/document type/i), {
      target: { value: 'INVOICE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create template/i }));

    await waitFor(() =>
      expect(screen.getByText(/server error/i)).toBeTruthy(),
    );
  });
});
