import { describe, it, expect } from '@jest/globals';
import {
  getBindingPath,
  resolveBinding,
  resolveBindingText,
  evaluateVisibility,
  contentBox,
  PAGE_SIZES,
  DEFAULT_MARGINS,
  renderDocumentHtml,
} from '@sparelab/contracts';

describe('getBindingPath', () => {
  it('extracts a simple path', () => {
    expect(getBindingPath('{{customerName}}')).toBe('customerName');
  });

  it('extracts a nested path', () => {
    expect(getBindingPath('{{seller.address}}')).toBe('seller.address');
  });

  it('returns null for non-bindings', () => {
    expect(getBindingPath('plain text')).toBeNull();
    expect(getBindingPath('{{ }')).toBeNull();
    expect(getBindingPath('{{}}')).toBeNull();
  });
});

describe('resolveBinding', () => {
  const data = {
    documentNumber: 'INV-2026-001',
    seller: { name: 'Acme', address: '123 Main St' },
    items: [{ item: 'Widget', quantity: 2 }],
    showHeader: true,
  };

  it('resolves a top-level scalar binding', () => {
    expect(resolveBinding(data, '{{documentNumber}}')).toBe('INV-2026-001');
  });

  it('resolves a nested binding', () => {
    expect(resolveBinding(data, '{{seller.name}}')).toBe('Acme');
  });

  it('returns undefined for a missing path', () => {
    expect(resolveBinding(data, '{{seller.phone}}')).toBeUndefined();
    expect(resolveBinding(data, '{{missing}}')).toBeUndefined();
  });

  it('returns undefined for invalid bindings', () => {
    expect(resolveBinding(data, 'not a binding')).toBeUndefined();
    expect(resolveBinding(data, '{{}}')).toBeUndefined();
  });

  it('blocks prototype-pollution paths', () => {
    expect(resolveBinding(data, '{{__proto__.foo}}')).toBeUndefined();
    expect(resolveBinding(data, '{{constructor.foo}}')).toBeUndefined();
    expect(resolveBinding(data, '{{prototype.foo}}')).toBeUndefined();
  });

  it('resolves boolean and number values', () => {
    expect(resolveBinding(data, '{{showHeader}}')).toBe(true);
  });
});

describe('resolveBindingText', () => {
  const data = { name: 'Acme', count: 3, active: true, nested: { x: 1 } };

  it('returns a string for scalars', () => {
    expect(resolveBindingText(data, '{{name}}')).toBe('Acme');
    expect(resolveBindingText(data, '{{count}}')).toBe('3');
    expect(resolveBindingText(data, '{{active}}')).toBe('true');
  });

  it('returns an empty string for missing bindings', () => {
    expect(resolveBindingText(data, '{{missing}}')).toBe('');
    expect(resolveBindingText(data, undefined)).toBe('');
    expect(resolveBindingText(data, '')).toBe('');
  });

  it('returns an empty string for objects (never renders objects as text)', () => {
    expect(resolveBindingText(data, '{{nested}}')).toBe('');
  });
});

describe('evaluateVisibility', () => {
  const data = {
    showHeader: true,
    showLogo: false,
    count: 5,
    tier: 'gold',
    tags: ['a', 'b'],
  };

  it('supports eq', () => {
    expect(
      evaluateVisibility(data, { field: 'showHeader', operator: 'eq', value: true }),
    ).toBe(true);
    expect(
      evaluateVisibility(data, { field: 'tier', operator: 'eq', value: 'silver' }),
    ).toBe(false);
  });

  it('supports ne', () => {
    expect(
      evaluateVisibility(data, { field: 'tier', operator: 'ne', value: 'silver' }),
    ).toBe(true);
  });

  it('supports gt/gte/lt/lte', () => {
    expect(
      evaluateVisibility(data, { field: 'count', operator: 'gt', value: 3 }),
    ).toBe(true);
    expect(
      evaluateVisibility(data, { field: 'count', operator: 'lt', value: 3 }),
    ).toBe(false);
  });

  it('supports in/notIn', () => {
    expect(
      evaluateVisibility(data, { field: 'tier', operator: 'in', value: ['bronze'] }),
    ).toBe(false);
  });

  it('supports exists/notExists', () => {
    expect(
      evaluateVisibility(data, { field: 'missing', operator: 'exists' }),
    ).toBe(false);
    expect(
      evaluateVisibility(data, { field: 'missing', operator: 'notExists' }),
    ).toBe(true);
  });

  it('blocks prototype-pollution field paths', () => {
    expect(
      evaluateVisibility(data, { field: '__proto__.foo', operator: 'exists' }),
    ).toBe(false);
  });
});

describe('contentBox', () => {
  it('computes A4 portrait content box', () => {
    const box = contentBox('A4', 'portrait', {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    });
    expect(box.pageWidth).toBe(794);
    expect(box.pageHeight).toBe(1123);
    expect(box.width).toBe(754);
    expect(box.height).toBe(1083);
  });

  it('swaps dimensions for landscape', () => {
    const portrait = contentBox('A4', 'portrait', {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    });
    const landscape = contentBox('A4', 'landscape', {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    });
    expect(landscape.pageWidth).toBe(portrait.pageHeight);
    expect(landscape.pageHeight).toBe(portrait.pageWidth);
  });

  it('has default margins', () => {
    expect(DEFAULT_MARGINS).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
  });

  it('defines page sizes with A3 larger than A4', () => {
    expect(PAGE_SIZES.A3.width).toBeGreaterThan(PAGE_SIZES.A4.width);
  });
});

describe('renderDocumentHtml', () => {
  const baseConfig = {
    schemaVersion: '1.0.0',
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    sections: [
      {
        id: 's1',
        name: 'Section 1',
        visible: true,
        blocks: [
          { id: 'b1', type: 'text', content: 'Hello {{customer.name}}', style: {} },
          { id: 'b2', type: 'divider', style: {} },
        ],
      },
      {
        id: 's2',
        name: 'Section 2',
        visible: true,
        blocks: [{ id: 'b3', type: 'text', content: 'Second page', style: {} }],
      },
    ],
  } as any;

  const DATA = { customer: { name: 'Acme' } };

  it('renders a full HTML document', () => {
    const html = renderDocumentHtml(baseConfig, DATA);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Document</title>');
    expect(html).toContain('Hello {{customer.name}}');
    expect(html).toContain('Second page');
  });

  it('renders one page per section (multi-page)', () => {
    const html = renderDocumentHtml(baseConfig, DATA);
    const pageCount = (html.match(/<div class="document-page"/g) || []).length;
    expect(pageCount).toBe(2);
  });

  it('escapes HTML in text content', () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          blocks: [{ id: 'b1', type: 'text', content: '<script>alert(1)</script>', style: {} }],
        },
      ],
    };
    const html = renderDocumentHtml(config, DATA);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('resolves bindings in text blocks', () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          blocks: [{ id: 'b1', type: 'text', content: 'doc', binding: '{{documentNumber}}', style: {} }],
        },
      ],
    };
    const html = renderDocumentHtml(config, { ...DATA, documentNumber: 'INV-001' });
    expect(html).toContain('INV-001');
    expect(html).not.toContain('{{documentNumber}}');
  });

  it('omits hidden sections', () => {
    const config = {
      ...baseConfig,
      sections: [
        { ...baseConfig.sections[0], visible: false },
        baseConfig.sections[1],
      ],
    };
    const html = renderDocumentHtml(config, DATA);
    expect(html).toContain('Second page');
    expect(html).not.toContain('Hello');
  });

  it('renders repeating table rows', () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          id: 's1',
          blocks: [
            {
              id: 't1',
              type: 'table',
              repeat: '{{items}}',
              columns: [
                { id: 'c1', header: 'Item', key: 'item' },
                { id: 'c2', header: 'Qty', key: 'quantity' },
              ],
              rows: [],
            },
          ],
        },
      ],
    };
    const html = renderDocumentHtml(config, { items: [{ item: 'Widget', quantity: 2 }] });
    expect(html).toContain('Widget');
    expect(html).toContain('2');
  });

  it('renders image block', () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          blocks: [{ id: 'b1', type: 'image', src: 'https://example.com/logo.png', alt: 'Logo', style: {} }],
        },
      ],
    };
    const html = renderDocumentHtml(config, DATA);
    expect(html).toContain('https://example.com/logo.png');
    expect(html).toContain('alt="Logo"');
  });
});

