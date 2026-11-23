import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { validateTemplateConfiguration } from '@sparelab/contracts';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateVersionDto,
  PublishVersionDto,
} from './dto';

const ENTITY_TEMPLATE = 'DocumentTemplate';
const ENTITY_VERSION = 'DocumentTemplateVersion';

type ZodLikeError = {
  issues: Array<{ path?: Array<string | number>; message: string }>;
};

function isZodLikeError(error: unknown): error is ZodLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as ZodLikeError).issues)
  );
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private validateConfig(configuration: unknown) {
    try {
      return validateTemplateConfiguration(configuration);
    } catch (error) {
      if (isZodLikeError(error)) {
        throw new BadRequestException({
          message: 'Invalid template configuration',
          errors: error.issues.map((issue) => ({
            path: issue.path?.join('.') ?? '',
            message: issue.message,
          })),
        });
      }
      throw error;
    }
  }

  async createTemplate(dto: CreateTemplateDto) {
    const configuration = this.validateConfig(dto.configuration);
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
          schemaVersion: configuration.schemaVersion,
          configuration: configuration as any,
          status: 'DRAFT',
          createdBy: actor,
        },
      });

      const updated = await tx.documentTemplate.update({
        where: { id: template.id },
        data: { currentVersionId: version.id },
      });

      await this.audit.record(
        {
          entityType: ENTITY_TEMPLATE,
          entityId: template.id,
          action: 'template.created',
          actorId: actor,
          metadata: { documentType: dto.documentType },
        },
        tx,
      );

      await this.audit.record(
        {
          entityType: ENTITY_VERSION,
          entityId: version.id,
          action: 'template.version.created',
          actorId: actor,
          metadata: {
            templateId: template.id,
            versionNumber: version.versionNumber,
          },
        },
        tx,
      );

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

    const actor = dto.createdBy ?? null;
    const changed = Object.keys(dto).filter((key) => key !== 'createdBy');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.documentTemplate.update({
        where: { id },
        data: {
          name: dto.name ?? undefined,
          description: dto.description ?? undefined,
          documentType: dto.documentType ?? undefined,
        },
      });

      await this.audit.record(
        {
          entityType: ENTITY_TEMPLATE,
          entityId: id,
          action: 'template.updated',
          actorId: actor,
          metadata: { changed },
        },
        tx,
      );

      return updated;
    });
  }

  async createVersion(templateId: string, dto: CreateVersionDto) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${templateId}" not found`);
    }

    const configuration = this.validateConfig(dto.configuration);
    if (dto.schemaVersion && dto.schemaVersion !== configuration.schemaVersion) {
      throw new BadRequestException(
        'schemaVersion must match the configuration schemaVersion',
      );
    }

    const actor = dto.createdBy ?? null;

    return this.prisma.$transaction(async (tx) => {
      const lastVersion = await tx.documentTemplateVersion.aggregate({
        where: { templateId },
        _max: { versionNumber: true },
      });

      const version = await tx.documentTemplateVersion.create({
        data: {
          templateId,
          versionNumber: (lastVersion._max.versionNumber ?? 0) + 1,
          schemaVersion: configuration.schemaVersion,
          configuration: configuration as any,
          status: 'DRAFT',
          createdBy: actor,
        },
      });

      await this.audit.record(
        {
          entityType: ENTITY_VERSION,
          entityId: version.id,
          action: 'template.version.created',
          actorId: actor,
          metadata: { templateId, versionNumber: version.versionNumber },
        },
        tx,
      );

      return version;
    });
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

    const version = await this.prisma.documentTemplateVersion.findFirst({
      where: { id: dto.versionId, templateId },
    });

    if (!version) {
      throw new NotFoundException(
        `Version "${dto.versionId}" not found for template "${templateId}"`,
      );
    }

    if (version.status === 'PUBLISHED') {
      throw new ConflictException(`Version "${version.id}" is already published`);
    }

    this.validateConfig(version.configuration);
    const actor = dto.createdBy ?? null;

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.documentTemplateVersion.updateMany({
        where: { id: version.id, templateId, status: 'DRAFT' },
        data: { status: 'PUBLISHED' },
      });

      if (claimed.count !== 1) {
        throw new ConflictException(`Version "${version.id}" is already published`);
      }

      const updatedTemplate = await tx.documentTemplate.update({
        where: { id: templateId },
        data: {
          status: 'PUBLISHED',
          currentVersionId: version.id,
        },
      });

      const updatedVersion = await tx.documentTemplateVersion.findUniqueOrThrow({
        where: { id: version.id },
      });

      await this.audit.record(
        {
          entityType: ENTITY_TEMPLATE,
          entityId: templateId,
          action: 'template.published',
          actorId: actor,
          metadata: { currentVersionId: version.id },
        },
        tx,
      );

      await this.audit.record(
        {
          entityType: ENTITY_VERSION,
          entityId: version.id,
          action: 'template.version.published',
          actorId: actor,
          metadata: { templateId, versionNumber: version.versionNumber },
        },
        tx,
      );

      return {
        template: updatedTemplate,
        version: updatedVersion,
      };
    });
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
