import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  createTemplateRequestSchema,
  createTemplateVersionRequestSchema,
  paginationQuerySchema,
  publishTemplateVersionRequestSchema,
  updateTemplateRequestSchema,
  type CreateTemplateRequest,
  type CreateTemplateVersionRequest,
  type PaginationQuery,
  type PublishTemplateVersionRequest,
  type UpdateTemplateRequest,
} from '@sparelab/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createTemplateRequestSchema))
    dto: CreateTemplateRequest,
  ) {
    return { data: await this.templatesService.createTemplate(dto) };
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.templatesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const template = await this.templatesService.findOne(id);
    if (!template) {
      throw new NotFoundException(`Template with id "${id}" not found`);
    }
    return { data: template };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTemplateRequestSchema))
    dto: UpdateTemplateRequest,
  ) {
    return { data: await this.templatesService.updateTemplate(id, dto) };
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createTemplateVersionRequestSchema))
    dto: CreateTemplateVersionRequest,
  ) {
    return { data: await this.templatesService.createVersion(id, dto) };
  }

  @Get(':id/versions')
  async listVersions(@Param('id') id: string) {
    return { data: await this.templatesService.listVersions(id) };
  }

  @Get(':id/versions/:versionId')
  async getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return { data: await this.templatesService.getVersion(id, versionId) };
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(publishTemplateVersionRequestSchema))
    dto: PublishTemplateVersionRequest,
  ) {
    return { data: await this.templatesService.publishVersion(id, dto) };
  }
}
