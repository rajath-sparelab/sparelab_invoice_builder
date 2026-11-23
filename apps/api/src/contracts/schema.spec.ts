import {
  validateTemplateConfiguration,
  TemplateDocumentTypeSchema,
  createTemplateRequestSchema,
  updateTemplateRequestSchema,
  createTemplateVersionRequestSchema,
  publishTemplateVersionRequestSchema,
  createDocumentRequestSchema,
  documentDataSchema,
} from '@sparelab/contracts';

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

  it('rejects arbitrary HTML and JavaScript in text blocks', () => {
    const config = structuredClone(validConfig);
    (config.sections[0].blocks[0] as any).content = '<img src=x onerror=alert(1)>';
    expect(() => validateTemplateConfiguration(config)).toThrow();
  });

  it('rejects unsupported style properties', () => {
    const config = structuredClone(validConfig);
    (config.sections[0].blocks[0] as any).style = { onclick: 'alert(1)' };
    expect(() => validateTemplateConfiguration(config)).toThrow();
  });

  it('accepts conditional visibility and repeating table rows', () => {
    const config = structuredClone(validConfig);
    (config.sections[0] as any).visibleWhen = {
      field: 'showItems',
      operator: 'eq',
      value: true,
    };
    (config.sections[0].blocks[2] as any).repeat = '{{items}}';
    const result = validateTemplateConfiguration(config);
    expect((result.sections[0] as any).visibleWhen.value).toBe(true);
    expect((result.sections[0].blocks[2] as any).repeat).toBe('{{items}}');
  });

  it('rejects conditional visibility without a comparison value', () => {
    const config = structuredClone(validConfig);
    (config.sections[0] as any).visibleWhen = {
      field: 'showItems',
      operator: 'eq',
    };
    expect(() => validateTemplateConfiguration(config)).toThrow();
  });
});

describe('Request Zod schemas', () => {
  it('accepts a valid template creation request', () => {
    const result = createTemplateRequestSchema.parse({
      name: 'Invoice Template',
      documentType: 'INVOICE',
      configuration: {
        sections: [
          {
            id: 's1',
            blocks: [{ id: 'b1', type: 'text', content: 'Invoice' }],
          },
        ],
      },
    });
    expect(result.configuration.schemaVersion).toBe('1.0.0');
    expect(result.configuration.sections[0].blocks[0].type).toBe('text');
  });

  it('rejects unknown fields in requests', () => {
    expect(() =>
      createTemplateRequestSchema.parse({
        name: 'Template',
        documentType: 'INVOICE',
        configuration: {
          sections: [{ id: 's1', blocks: [{ id: 'b1', type: 'text', content: 'X' }] }],
        },
        isAdmin: true,
      }),
    ).toThrow();
    expect(() => updateTemplateRequestSchema.parse({})).toThrow();
    expect(() =>
      createTemplateVersionRequestSchema.parse({
        configuration: {
          sections: [{ id: 's1', blocks: [{ id: 'b1', type: 'text', content: 'X' }] }],
        },
        status: 'PUBLISHED',
      }),
    ).toThrow();
  });

  it('requires a UUID when publishing a version', () => {
    expect(() => publishTemplateVersionRequestSchema.parse({ versionId: 'v1' })).toThrow();
    expect(() =>
      publishTemplateVersionRequestSchema.parse({
        versionId: '00000000-0000-0000-0000-000000000000',
      }),
    ).not.toThrow();
  });

  it('validates document creation requests', () => {
    const valid = {
      templateVersionId: '00000000-0000-0000-0000-000000000000',
      documentType: 'INVOICE',
      data: { title: 'INV-001', lines: [{ amount: 10 }] },
    };
    expect(() => createDocumentRequestSchema.parse(valid)).not.toThrow();
    expect(() =>
      createDocumentRequestSchema.parse({ ...valid, templateVersionId: 'v1' }),
    ).toThrow();
    expect(() =>
      createDocumentRequestSchema.parse({ ...valid, data: { created: new Date() } }),
    ).toThrow();
  });

  it('accepts JSON values only in document data', () => {
    expect(() => documentDataSchema.parse({ a: 1, b: null, c: [true, 'x'] })).not.toThrow();
    expect(() => documentDataSchema.parse({ a: Number.NaN })).toThrow();
    expect(() => documentDataSchema.parse({ a: undefined })).toThrow();
  });
});
