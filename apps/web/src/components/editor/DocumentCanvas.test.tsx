import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentCanvas } from './DocumentCanvas';

const sections = [
  {
    id: 'section-1',
    name: 'Section 1',
    blocks: [
      { id: 'block-1', type: 'text', content: 'Hello', style: {} },
      { id: 'block-2', type: 'image', src: 'https://example.com/img.png', style: {} },
    ],
    style: {},
    visible: true,
  },
];

describe('DocumentCanvas', () => {
  it('renders sections and blocks', () => {
    render(
      <DocumentCanvas
        sections={sections}
        selectedBlockId={null}
        selectedSectionId={null}
        onBlockSelect={jest.fn()}
        onAddBlock={jest.fn()}
        onDeleteBlock={jest.fn()}
        onDuplicateBlock={jest.fn()}
        onAddSection={jest.fn()}
        onDeleteSection={jest.fn()}
        onSectionReorder={jest.fn()}
        onBlockReorder={jest.fn()}
        onLibraryDrop={jest.fn()}
      />,
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onBlockSelect when clicking a block', () => {
    const onBlockSelect = jest.fn();
    render(
      <DocumentCanvas
        sections={sections}
        selectedBlockId={null}
        selectedSectionId={null}
        onBlockSelect={onBlockSelect}
        onAddBlock={jest.fn()}
        onDeleteBlock={jest.fn()}
        onDuplicateBlock={jest.fn()}
        onAddSection={jest.fn()}
        onDeleteSection={jest.fn()}
        onSectionReorder={jest.fn()}
        onBlockReorder={jest.fn()}
        onLibraryDrop={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Hello'));
    expect(onBlockSelect).toHaveBeenCalledWith(null, 'section-1');
  });

  it('calls onDeleteBlock when clicking delete on a block', () => {
    const onDeleteBlock = jest.fn();
    render(
      <DocumentCanvas
        sections={sections}
        selectedBlockId={null}
        selectedSectionId={null}
        onBlockSelect={jest.fn()}
        onAddBlock={jest.fn()}
        onDeleteBlock={onDeleteBlock}
        onDuplicateBlock={jest.fn()}
        onAddSection={jest.fn()}
        onDeleteSection={jest.fn()}
        onSectionReorder={jest.fn()}
        onBlockReorder={jest.fn()}
        onLibraryDrop={jest.fn()}
      />,
    );

    const deleteButtons = screen.getAllByLabelText('Delete block');
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteBlock).toHaveBeenCalled();
  });
});
