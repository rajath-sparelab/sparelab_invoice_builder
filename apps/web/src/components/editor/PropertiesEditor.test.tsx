import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertiesEditor } from './PropertiesEditor';

const blocks = {
  'block-1': {
    id: 'block-1',
    type: 'text' as const,
    content: 'Hello world',
    binding: undefined,
    style: {},
    visible: true,
  },
};

const sections = {
  'section-1': {
    id: 'section-1',
    name: 'Section 1',
    blocks: [],
    style: {},
    visible: true,
  },
};

const page = { size: 'A4' as const, orientation: 'portrait' as const, margins: { top: 20, right: 20, bottom: 20, left: 20 } };

describe('PropertiesEditor', () => {
  it('renders section properties when nothing is selected', () => {
    render(
      <PropertiesEditor
        selectedBlockId={null}
        selectedSectionId={'section-1'}
        blocks={blocks}
        sections={sections}
        page={page}
        onBlockUpdate={jest.fn()}
        onSectionUpdate={jest.fn()}
        onPageUpdate={jest.fn()}
      />,
    );

    expect(screen.getByText('Section properties')).toBeInTheDocument();
  });

  it('renders text block properties when a block is selected', () => {
    render(
      <PropertiesEditor
        selectedBlockId={'block-1'}
        selectedSectionId={null}
        blocks={blocks}
        sections={sections}
        page={page}
        onBlockUpdate={jest.fn()}
        onSectionUpdate={jest.fn()}
        onPageUpdate={jest.fn()}
      />,
    );

    expect(screen.getByText('Text block')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /content/i })).toBeInTheDocument();
  });

  it('calls onBlockUpdate when text content changes', () => {
    const onBlockUpdate = jest.fn();
    render(
      <PropertiesEditor
        selectedBlockId={'block-1'}
        selectedSectionId={null}
        blocks={blocks}
        sections={sections}
        page={page}
        onBlockUpdate={onBlockUpdate}
        onSectionUpdate={jest.fn()}
        onPageUpdate={jest.fn()}
      />,
    );

    const input = screen.getByRole('textbox', { name: /content/i });
    fireEvent.change(input, { target: { value: 'New content' } });

    expect(onBlockUpdate).toHaveBeenCalledWith('block-1', { content: 'New content' });
  });
});
