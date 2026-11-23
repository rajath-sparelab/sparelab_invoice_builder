import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { templateConfigurationSchema } from '@sparelab/contracts';
import { TemplatesService } from './templates.service';
import { TemplatesModule } from './templates.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

const baseConfig = templateConfigurationSchema.parse({
  schemaVersion: '1.0.0',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  sections: [
    {
      id: 's1',
      name: 'Header',
      blocks: [{ id: 'b1', type: 'text', content: 'Invoice', binding: '{{title}}' }],
    },
  ],
});

const changedConfig = templateConfigurationSchema.parse({
  schemaVersion: '1.0.0',
  sections: [
    {
      id: 's1',
      blocks: [{ id: 'b1', type: 'text', content: 'Updated invoice' }],
    },
  ],
});

function makeDto(overrides: Partial<CreateTemplateDto> = {}): CreateTemplateDto {
  return {
    name: `Template ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    documentType: 'INVOICE',
    configuration: baseConfig,
    ...overrides,
  } as CreateTemplateDto;
}

describe('TemplatesService (integration)', () => {
  let service: TemplatesService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TemplatesModule],
    }).compile();
    service = module.get(TemplatesService);
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

  it('creates a template with an initial draft version', async () => {
    const input = makeDto();
    const { template, version } = await service.createTemplate(input);

    expect(template.id).toBeDefined();
    expect(template.name).toBe(input.name);
    expect(template.status).toBe('DRAFT');
    expect(template.currentVersionId).toBe(version.id);
    expect(version.versionNumber).toBe(1);
    expect(version.status).toBe('DRAFT');
    expect(version.configuration).toEqual(baseConfig);
  });

  it('rejects invalid template configuration', async () => {
    await expect(
      service.createTemplate({ ...makeDto(), configuration: { notValid: true } as any }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects executable content in template configuration', async () => {
    const config = structuredClone(baseConfig);
    (config.sections[0].blocks[0] as any).content = '<script>alert(1)</script>';

    await expect(
      service.createTemplate({ ...makeDto(), configuration: config as any }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists templates with pagination', async () => {
    await service.createTemplate(makeDto({ name: 'List Template A' }));
    await service.createTemplate(makeDto({ name: 'List Template B' }));

    const result = await service.findAll(1, 10);

    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('gets a template with its current version', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Get Template' }),
    );

    const fetched = await service.findOne(template.id);

    expect(fetched.id).toBe(template.id);
    expect(fetched.currentVersion).not.toBeNull();
    expect(fetched.currentVersion.versionNumber).toBe(1);
  });

  it('throws 404 for a missing template', async () => {
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates template metadata', async () => {
    const { template } = await service.createTemplate(makeDto({ name: 'Old Name' }));

    const updated = await service.updateTemplate(template.id, {
      name: 'New Name',
      description: 'Updated description',
    });

    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('Updated description');
  });

  it('creates a new draft version with incremented version number', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Version Template' }),
    );

    await service.createVersion(template.id, { configuration: baseConfig });
    const version = await service.createVersion(template.id, {
      configuration: baseConfig,
    });

    expect(version.versionNumber).toBe(3);
    expect(version.status).toBe('DRAFT');
  });

  it('lists template versions ordered by version number', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Versions Template' }),
    );

    await service.createVersion(template.id, { configuration: baseConfig });
    await service.createVersion(template.id, { configuration: baseConfig });

    const versions = await service.listVersions(template.id);

    expect(versions.length).toBe(3);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[2].versionNumber).toBe(3);
  });

  it('gets a specific version', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Specific Version' }),
    );
    const version = await service.createVersion(template.id, {
      configuration: baseConfig,
    });

    const fetched = await service.getVersion(template.id, version.id);

    expect(fetched.id).toBe(version.id);
    expect(fetched.versionNumber).toBe(2);
  });

  it('throws 404 for a version not belonging to the template', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Owner Template' }),
    );
    const { template: otherTemplate } = await service.createTemplate(
      makeDto({ name: 'Other Template' }),
    );
    const otherVersion = await service.createVersion(otherTemplate.id, {
      configuration: baseConfig,
    });

    await expect(
      service.getVersion(template.id, otherVersion.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('publishes a specific draft version and marks the template published', async () => {
    const { template, version } = await service.createTemplate(
      makeDto({ name: 'Publish Template' }),
    );

    const result = await service.publishVersion(template.id, {
      versionId: version.id,
    });

    expect(result.version.status).toBe('PUBLISHED');
    expect(result.template.status).toBe('PUBLISHED');
    expect(result.template.currentVersionId).toBe(result.version.id);
  });

  it('rejects publishing an already published version', async () => {
    const { template, version } = await service.createTemplate(
      makeDto({ name: 'Republish Template' }),
    );

    await service.publishVersion(template.id, { versionId: version.id });
    await expect(
      service.publishVersion(template.id, { versionId: version.id }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects publishing a version that belongs to another template', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Publish Owner Template' }),
    );
    const { version: otherVersion } = await service.createTemplate(
      makeDto({ name: 'Publish Other Template' }),
    );

    await expect(
      service.publishVersion(template.id, { versionId: otherVersion.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects publishing a missing version', async () => {
    const { template } = await service.createTemplate(
      makeDto({ name: 'Publish Missing Version' }),
    );

    await expect(
      service.publishVersion(template.id, {
        versionId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('editing a published template creates a new version without changing the published one', async () => {
    const { template, version: firstVersion } = await service.createTemplate(
      makeDto({ name: 'Edit Published Template' }),
    );

    await service.publishVersion(template.id, { versionId: firstVersion.id });
    const secondVersion = await service.createVersion(template.id, {
      configuration: changedConfig,
    });
    await service.publishVersion(template.id, { versionId: secondVersion.id });

    const storedFirst = await prisma.documentTemplateVersion.findUniqueOrThrow({
      where: { id: firstVersion.id },
    });
    const storedSecond = await prisma.documentTemplateVersion.findUniqueOrThrow({
      where: { id: secondVersion.id },
    });
    const storedTemplate = await prisma.documentTemplate.findUniqueOrThrow({
      where: { id: template.id },
    });

    expect(storedFirst.configuration).toEqual(baseConfig);
    expect(storedSecond.configuration).toEqual(changedConfig);
    expect(storedTemplate.currentVersionId).toBe(secondVersion.id);
    expect(secondVersion.versionNumber).toBe(2);
  });

  it('rejects mutation of an existing version configuration', async () => {
    const { version } = await service.createTemplate(
      makeDto({ name: 'Immutable Version' }),
    );

    await expect(
      prisma.documentTemplateVersion.update({
        where: { id: version.id },
        data: { configuration: changedConfig as any },
      }),
    ).rejects.toThrow();

    const stored = await prisma.documentTemplateVersion.findUniqueOrThrow({
      where: { id: version.id },
    });
    expect(stored.configuration).toEqual(baseConfig);
  });

  it('records audit events for template, version and publish operations', async () => {
    const { template, version } = await service.createTemplate(
      makeDto({ name: 'Audit Template' }),
    );
    await service.createVersion(template.id, { configuration: changedConfig });
    await service.updateTemplate(template.id, { name: 'Audit Template Renamed' });
    await service.publishVersion(template.id, { versionId: version.id });

    const templateActions = await prisma.documentAuditEvent.findMany({
      where: { entityType: 'DocumentTemplate', entityId: template.id },
      select: { action: true },
    });
    const versionActions = await prisma.documentAuditEvent.findMany({
      where: { entityType: 'DocumentTemplateVersion', entityId: version.id },
      select: { action: true },
    });

    expect(templateActions.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'template.created',
        'template.updated',
        'template.published',
      ]),
    );
    expect(versionActions.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'template.version.created',
        'template.version.published',
      ]),
    );
  });
});
