import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { validateDocumentData } from '@sparelab/contracts';
import { CreateDocumentDto } from './dto';

const ENTITY_DOCUMENT = 'GeneratedDocument';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createDocument(dto: CreateDocumentDto) {
    const version = await this.prisma.documentTemplateVersion.findUnique({
      where: { id: dto.templateVersionId },
      include: { template: true },
    });

    if (!version) {
      throw new NotFoundException(
        `Template version "${dto.templateVersionId}" not found`,
      );
    }

    if (version.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Template version "${dto.templateVersionId}" is not published; only published versions can be used to generate documents`,
      );
    }

    let validatedData: Record<string, unknown>;
    try {
      validatedData = validateDocumentData(dto.data);
    } catch (error: any) {
      throw new BadRequestException('Document data must be a JSON object');
    }

    const actor = dto.createdBy ?? null;

    const document = await this.prisma.generatedDocument.create({
      data: {
        templateId: version.templateId,
        templateVersionId: version.id,
        documentType: dto.documentType,
        externalReferenceId: dto.externalReferenceId ?? null,
        data: validatedData as any,
        status: 'GENERATED',
      },
    });

    await this.audit.record({
      entityType: ENTITY_DOCUMENT,
      entityId: document.id,
      action: 'document.created',
      actorId: actor,
      metadata: {
        templateId: version.templateId,
        templateVersionId: version.id,
        documentType: dto.documentType,
      },
    });

    return document;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [documents, total] = await this.prisma.$transaction([
      this.prisma.generatedDocument.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { templateVersion: true },
      }),
      this.prisma.generatedDocument.count(),
    ]);

    return {
      data: documents,
      meta: { page, limit, total },
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.generatedDocument.findUnique({
      where: { id },
      include: { templateVersion: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with id "${id}" not found`);
    }

    return document;
  }
}
