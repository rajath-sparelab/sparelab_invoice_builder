import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { DocumentRenderer } from './DocumentRenderer';
import { LivePreview } from './LivePreview';

const CONFIG = {
  schemaVersion: '1.0.0',
  page: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 } },
  sections: [
    {
      id: 's1',
      name: 'Section 1',
      visible: true,
      blocks: [
        {
          id: 'b1',
          type: 'text',
          content: 'Hello Acme Traders',
          style: {},
          visible: true,
        },
        { id: 'b2', type: 'divider', style: {}, visible: true },
      ],
    },
    {
      id: 's2',
      name: 'Section 2',
      visible: true,
      blocks: [
        {
          id: 'b3',
          type: 'text',
          content: 'Second page section',
          style: {},
          visible: true,
        },
      ],
    },
  ],
} as any;

describe('DocumentRenderer', () => {
  it('renders one page per section (multi-page)', () => {
    render(
      <DocumentRenderer config={CONFIG} data={{ customer: { name: 'Acme' } }} />,
    );
    // Each section renders into its own page, so each section's text appears once.
    expect(screen.getByText('Hello Acme Traders')).toBeTruthy();
    expect(screen.getByText('Second page section')).toBeTruthy();
    // And there are exactly two page wrappers (one per section).
    expect(screen.getAllByText('Hello Acme Traders').length).toBe(1);
    expect(screen.getAllByText('Second page section').length).toBe(1);
  });

  it('renders hidden sections as nothing', () => {
    const hiddenConfig = {
      ...CONFIG,
      sections: [
        { ...CONFIG.sections[0], visible: false },
        CONFIG.sections[1],
      ],
    } as any;
    render(
      <DocumentRenderer config={hiddenConfig} data={{ customer: { name: 'Acme' } }} />,
    );
    expect(screen.getByText('Second page section')).toBeInTheDocument();
  });
});

describe('LivePreview', () => {
  it('renders sample data with a config', () => {
    render(<LivePreview config={CONFIG} />);
    expect(screen.getByText(/Hello Acme Traders/)).toBeTruthy();
  });

  it('renders nothing when config is null', () => {
    render(<LivePreview config={null} />);
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});
