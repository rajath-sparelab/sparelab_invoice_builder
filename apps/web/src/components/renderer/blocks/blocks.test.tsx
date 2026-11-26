import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { TableBlock } from './TableBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';

const DATA = {
  customerName: 'Acme Traders',
  items: [{ item: 'Widget', quantity: 2, unitPrice: 750 }],
};

describe('TextBlock', () => {
  it('renders plain content', () => {
    render(
      <TextBlock block={{ id: 'b1', content: 'Hello' } as any} data={DATA} />,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders a resolved binding', () => {
    render(
      <TextBlock
        block={{ id: 'b1', binding: '{{customerName}}' } as any}
        data={DATA}
      />,
    );
    expect(screen.getByText('Acme Traders')).toBeInTheDocument();
  });

  it('renders nothing for a missing binding', () => {
    render(
      <TextBlock
        block={{ id: 'b1', binding: '{{missing}}' } as any}
        data={DATA}
      />,
    );
    expect(screen.queryByText('Acme Traders')).not.toBeInTheDocument();
  });

  it('honors visible=false', () => {
    render(
      <TextBlock
        block={{ id: 'b1', content: 'Hello', visible: false } as any}
        data={DATA}
      />,
    );
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});

describe('ImageBlock', () => {
  it('renders a valid image URL', () => {
    render(
      <ImageBlock
        block={{ id: 'b1', src: 'https://example.com/logo.png', alt: 'Logo' } as any}
        data={DATA}
      />,
    );
    const img = screen.getByAltText('Logo');
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders alt fallback for a non-http src', () => {
    render(
      <ImageBlock
        block={{ id: 'b1', src: 'not-a-url', alt: 'Logo' } as any}
        data={DATA}
      />,
    );
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.queryByAltText('Logo')).not.toBeInTheDocument();
  });
});

describe('DividerBlock', () => {
  it('renders a divider line', () => {
    const { container } = render(<DividerBlock block={{ id: 'b1' } as any} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('SpacerBlock', () => {
  it('renders a spacer', () => {
    const { container } = render(<SpacerBlock block={{ id: 'b1', height: 40 } as any} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('TableBlock', () => {
  it('renders static rows', () => {
    render(
      <TableBlock
        block={{
          id: 'b1',
          columns: [
            { id: 'c1', header: 'Item', key: 'item' },
            { id: 'c2', header: 'Price', key: 'price' },
          ],
          rows: [['Widget', '750']],
        } as any}
        data={DATA}
      />,
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
  });

  it('renders repeating rows from a collection binding', () => {
    render(
      <TableBlock
        block={{
          id: 'b1',
          repeat: '{{items}}',
          columns: [
            { id: 'c1', header: 'Item', key: 'item' },
            { id: 'c2', header: 'Qty', key: 'quantity' },
          ],
          rows: [],
        } as any}
        data={DATA}
      />,
    );
    expect(screen.getAllByText('Widget').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders no items message when the collection is empty', () => {
    render(
      <TableBlock
        block={{
          id: 'b1',
          repeat: '{{items}}',
          columns: [{ id: 'c1', header: 'Item', key: 'item' }],
          rows: [],
        } as any}
        data={{ items: [] }}
      />,
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
  });
});
