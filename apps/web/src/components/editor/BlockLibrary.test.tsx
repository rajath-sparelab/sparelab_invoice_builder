import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockLibrary } from './BlockLibrary';

describe('BlockLibrary', () => {
  it('renders all block categories', () => {
    render(<BlockLibrary onAddBlock={() => {}} />);
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Structure')).toBeInTheDocument();
  });

  it('renders all block types', () => {
    render(<BlockLibrary onAddBlock={() => {}} />);
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Repeating Table')).toBeInTheDocument();
    expect(screen.getByText('Divider')).toBeInTheDocument();
    expect(screen.getByText('Spacer')).toBeInTheDocument();
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('calls onAddBlock when a block is clicked', () => {
    const onAddBlock = jest.fn();
    render(<BlockLibrary onAddBlock={onAddBlock} />);
    fireEvent.click(screen.getByText('Text'));
    expect(onAddBlock).toHaveBeenCalledWith('text');
  });
});
