import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsModule } from './documents.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const baseConfig = {
  schemaVersion: '1.0.0',
  page: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 } },
  sections: [
    {
      id: 's1',
      name: 'Body',
      blocks: [
        { id: 'b1', type: 'text', content: 'Invoice', binding: '{{title}}' },
      ],
    },
  ],
};

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createPublishedTemplateVersion(prisma: PrismaService, documentType = 'INVOICE') {
  const template = await prisma.documentTemplate.create({
    data: {
      name: uniqueName('Doc Template'),
      documentType,
      status: 'PUBLISHED',
    },
  });
  const version = await prisma.documentTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNumber: 1,
      schemaVersion: '1.0.0',
      configuration: baseConfig as any,
      status: 'PUBLISHED',
    },
  });
  await prisma.documentTemplate.update({
    where: { id: template.id },
    data: { currentVersionId: version.id },
  });
  return { template, version };
}

describe('DocumentsService (integration)', () => {
  let service: DocumentsService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DocumentsModule],
    }).compile();
    service = module.get(DocumentsService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.documentAuditEvent.deleteMany({});
    await prisma.documentRenderJob.deleteMany({});
    await prisma.generatedDocument.deleteMany({});
    await prisma.documentTemplateVersion.deleteMany({});
    await prisma.documentTemplate.deleteMany({});
    await module.close();
  });

  it('creates a document using a published template version', async () => {
    const { version } = await createPublishedTemplateVersion(prisma);

    const document = await service.createDocument({
      templateVersionId: version.id,
      documentType: 'INVOICE',
      data: { title: 'INV-001', customer: 'Acme' },
    });

    expect(document.id).toBeDefined();
    expect(document.templateVersionId).toBe(version.id);
    expect(document.templateId).toBe(version.templateId);
    expect(document.documentType).toBe('INVOICE');
    expect(document.data).toEqual({ title: 'INV-001', customer: 'Acme' });
    expect(document.status).toBe('GENERATED');
  });

  it('rejects document data that is not a JSON object', async () => {
    const { version } = await createPublishedTemplateVersion(prisma);

    await expect(
      service.createDocument({
        templateVersionId: version.id,
        documentType: 'INVOICE',
        data: 'not-an-object' as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a reference to a draft template version', async () => {
    const template = await prisma.documentTemplate.create({
      data: { name: uniqueName('Draft Template'), documentType: 'QUOTATION', status: 'DRAFT' },
    });
    const draftVersion = await prisma.documentTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        schemaVersion: '1.0.0',
        configuration: baseConfig as any,
        status: 'DRAFT',
      },
    });

    await expect(
      service.createDocument({
        templateVersionId: draftVersion.id,
        documentType: 'INVOICE',
        data: { title: 'X' },
      }),
    ).rejects.toThrow(BadRequestException);

    await prisma.documentTemplateVersion.delete({ where: { id: draftVersion.id } });
    await prisma.documentTemplate.delete({ where: { id: template.id } });
  });

  it('rejects a reference to an invalid template version', async () => {
    await expect(
      service.createDocument({
        templateVersionId: '00000000-0000-0000-0000-000000000000',
        documentType: 'INVOICE',
        data: { title: 'X' },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists generated documents with pagination', async () => {
    const { version } = await createPublishedTemplateVersion(prisma);

    await service.createDocument({ templateVersionId: version.id, documentType: 'INVOICE', data: { a: 1 } });
    await service.createDocument({ templateVersionId: version.id, documentType: 'INVOICE', data: { a: 2 } });

    const result = await service.findAll(1, 10);

    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('gets a document with its template version reference', async () => {
    const { version } = await createPublishedTemplateVersion(prisma);
    const document = await service.createDocument({
      templateVersionId: version.id,
      documentType: 'INVOICE',
      data: { title: 'X' },
    });

    const fetched = await service.findOne(document.id);

    expect(fetched.id).toBe(document.id);
    expect(fetched.templateVersion.id).toBe(version.id);
    expect(fetched.templateVersion.versionNumber).toBe(1);
    expect(fetched.templateVersion.status).toBe('PUBLISHED');
  });

  it('throws 404 for a missing document', async () => {
    await expect(service.findOne('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      NotFoundException,
    );
  });
});
