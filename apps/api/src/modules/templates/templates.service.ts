import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { validateTemplateConfiguration } from '@sparelab/contracts';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateVersionDto,
  PublishVersionDto,
} from './dto';

const ENTITY_TEMPLATE = 'DocumentTemplate';
const ENTITY_VERSION = 'DocumentTemplateVersion';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private validateConfig(configuration: unknown) {
    try {
      return validateTemplateConfiguration(configuration);
    } catch (error: any) {
      if (error && Array.isArray(error.errors)) {
        throw new BadRequestException(
          `Invalid template configuration: ${error.errors
            .map((e: any) => e.message)
            .join(', ')}`,
        );
      }
      throw error;
    }
  }

  async createTemplate(dto: CreateTemplateDto) {
    this.validateConfig(dto.configuration);

    const schemaVersion = '1.0.0';
    const actor = dto.createdBy ?? null;

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.documentTemplate.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          documentType: dto.documentType,
          status: 'DRAFT',
          createdBy: actor,
        },
      });

      const version = await tx.documentTemplateVersion.create({
        data: {
          templateId: template.id,
          versionNumber: 1,
          schemaVersion,
          configuration: dto.configuration as any,
          status: 'DRAFT',
          createdBy: actor,
        },
      });

      const updated = await tx.documentTemplate.update({
        where: { id: template.id },
        data: { currentVersionId: version.id },
      });

      await tx.documentAuditEvent.create({
        data: {
          entityType: ENTITY_TEMPLATE,
          entityId: template.id,
          action: 'template.created',
          actorId: actor,
          metadata: { documentType: dto.documentType },
        },
      });

      await tx.documentAuditEvent.create({
        data: {
          entityType: ENTITY_VERSION,
          entityId: version.id,
          action: 'template.version.created',
          actorId: actor,
          metadata: { templateId: template.id, versionNumber: version.versionNumber },
        },
      });

      return {
        template: this.mapTemplateWithCurrentVersion(updated, version),
        version,
      };
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [templates, total] = await this.prisma.$transaction([
      this.prisma.documentTemplate.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.documentTemplate.count(),
    ]);

    return {
      data: templates,
      meta: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${id}" not found`);
    }

    let currentVersion = null;
    if (template.currentVersionId) {
      currentVersion = await this.prisma.documentTemplateVersion.findUnique({
        where: { id: template.currentVersionId },
      });
    }

    return this.mapTemplateWithCurrentVersion(template, currentVersion);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${id}" not found`);
    }

    const updated = await this.prisma.documentTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        documentType: dto.documentType ?? undefined,
      },
    });

    await this.audit.record({
      entityType: ENTITY_TEMPLATE,
      entityId: id,
      action: 'template.updated',
      actorId: dto.createdBy ?? null,
      metadata: { changed: Object.keys(dto).filter((k) => k !== 'createdBy') },
    });

    return updated;
  }

  async createVersion(templateId: string, dto: CreateVersionDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${templateId}" not found`);
    }

    this.validateConfig(dto.configuration);

    const lastVersion = await this.prisma.documentTemplateVersion.findFirst({
      where: { templateId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;
    const schemaVersion = dto.schemaVersion ?? '1.0.0';
    const actor = dto.createdBy ?? null;

    const version = await this.prisma.documentTemplateVersion.create({
      data: {
        templateId,
        versionNumber,
        schemaVersion,
        configuration: dto.configuration as any,
        status: 'DRAFT',
        createdBy: actor,
      },
    });

    await this.audit.record({
      entityType: ENTITY_VERSION,
      entityId: version.id,
      action: 'template.version.created',
      actorId: actor,
      metadata: { templateId, versionNumber },
    });

    return version;
  }

  async listVersions(templateId: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${templateId}" not found`);
    }

    return this.prisma.documentTemplateVersion.findMany({
      where: { templateId },
      orderBy: { versionNumber: 'asc' },
    });
  }

  async getVersion(templateId: string, versionId: string) {
    const version = await this.prisma.documentTemplateVersion.findFirst({
      where: { id: versionId, templateId },
    });

    if (!version) {
      throw new NotFoundException(
        `Version "${versionId}" not found for template "${templateId}"`,
      );
    }

    return version;
  }

  async publishVersion(templateId: string, dto: PublishVersionDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${templateId}" not found`);
    }

    if (!template.currentVersionId) {
      throw new BadRequestException(
        `Template "${templateId}" has no current version to publish`,
      );
    }

    const versionId = template.currentVersionId;

    const version = await this.prisma.documentTemplateVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.templateId !== templateId) {
      throw new NotFoundException(
        `Current version "${versionId}" not found for template "${templateId}"`,
      );
    }

    if (version.status === 'PUBLISHED') {
      throw new ConflictException(`Version "${versionId}" is already published`);
    }

    // Validate configuration before publishing (published versions are immutable).
    this.validateConfig(version.configuration);

    const actor = dto.createdBy ?? null;

    const [updatedTemplate, updatedVersion] = await this.prisma.$transaction([
      this.prisma.documentTemplate.update({
        where: { id: templateId },
        data: {
          status: 'PUBLISHED',
          currentVersionId: versionId,
        },
      }),
      this.prisma.documentTemplateVersion.update({
        where: { id: versionId },
        data: { status: 'PUBLISHED' },
      }),
    ]);

    await this.audit.record({
      entityType: ENTITY_TEMPLATE,
      entityId: templateId,
      action: 'template.published',
      actorId: actor,
      metadata: { currentVersionId: versionId },
    });

    await this.audit.record({
      entityType: ENTITY_VERSION,
      entityId: versionId,
      action: 'template.version.published',
      actorId: actor,
      metadata: { templateId, versionNumber: version.versionNumber },
    });

    return {
      template: updatedTemplate,
      version: updatedVersion,
    };
  }

  private mapTemplateWithCurrentVersion(
    template: any,
    currentVersion: any | null,
  ) {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      documentType: template.documentType,
      status: template.status,
      currentVersionId: template.currentVersionId,
      currentVersion,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
