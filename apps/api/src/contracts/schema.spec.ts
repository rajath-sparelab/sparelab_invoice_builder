import { validateTemplateConfiguration, TemplateDocumentTypeSchema } from '@sparelab/contracts';

describe('Template configuration Zod schema', () => {
  const validConfig = {
    schemaVersion: '1.0.0',
    page: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 } },
    sections: [
      {
        id: 's1',
        name: 'Header',
        blocks: [
          { id: 'b1', type: 'text', content: 'Invoice', binding: '{{title}}' },
          { id: 'b2', type: 'image', src: 'https://example.com/logo.png', alt: 'Logo' },
          {
            id: 'b3',
            type: 'table',
            columns: [{ id: 'c1', header: 'Item', key: 'item' }],
            rows: [['{{item}}']],
          },
        ],
      },
    ],
  };

  it('accepts a valid template configuration', () => {
    const result = validateTemplateConfiguration(validConfig);
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.sections.length).toBe(1);
    expect(result.sections[0].blocks.length).toBe(3);
  });

  it('defaults schemaVersion when omitted', () => {
    const { schemaVersion, ...rest } = validConfig;
    const result = validateTemplateConfiguration(rest);
    expect(result.schemaVersion).toBe('1.0.0');
  });

  it('rejects a configuration without sections', () => {
    const { sections, ...rest } = validConfig;
    expect(() => validateTemplateConfiguration(rest)).toThrow();
  });

  it('rejects a text block without content', () => {
    const config = structuredClone(validConfig);
    config.sections[0].blocks[0] = { id: 'b1', type: 'text' } as any;
    expect(() => validateTemplateConfiguration(config)).toThrow();
  });

  it('rejects an image src that is neither a URL nor a binding', () => {
    const config = structuredClone(validConfig);
    config.sections[0].blocks[1] = { id: 'b2', type: 'image', src: 'javascript:alert(1)' } as any;
    expect(() => validateTemplateConfiguration(config)).toThrow();
  });

  it('accepts an image src that is a binding', () => {
    const config = structuredClone(validConfig);
    config.sections[0].blocks[1] = { id: 'b2', type: 'image', src: '{{logoUrl}}' } as any;
    const result = validateTemplateConfiguration(config);
    expect((result.sections[0].blocks[1] as any).src).toBe('{{logoUrl}}');
  });

  it('accepts a table block with columns and rows', () => {
    const config = structuredClone(validConfig);
    const result = validateTemplateConfiguration(config);
    const table = result.sections[0].blocks[2] as any;
    expect(table.type).toBe('table');
    expect(table.columns.length).toBe(1);
    expect(table.rows.length).toBe(1);
  });

  it('validates TemplateDocumentType values', () => {
    expect(TemplateDocumentTypeSchema.parse('INVOICE')).toBe('INVOICE');
    expect(TemplateDocumentTypeSchema.parse('PURCHASE_ORDER')).toBe('PURCHASE_ORDER');
    expect(() => TemplateDocumentTypeSchema.parse('NOT_A_TYPE')).toThrow();
  });
});
