import { render, screen } from '@testing-library/react';
import { DocumentOverview } from './DocumentOverview';

describe('DocumentOverview', () => {
  it('renders the document management overview statistics', () => {
    render(<DocumentOverview />);

    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Total Documents')).toBeTruthy();
    expect(screen.getByText('Pending Review')).toBeTruthy();
    expect(screen.getByText('Templates')).toBeTruthy();
    expect(screen.getByText('Collaborators')).toBeTruthy();
  });
});
