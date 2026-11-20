import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateVersionDto,
  PublishVersionDto,
} from './dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(dto);
  }

  @Get()
  async list(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const p = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const l = Math.max(Math.min(parseInt(limit ?? '20', 10) || 20, 100), 1);
    return this.templatesService.findAll(p, l);
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
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return { data: await this.templatesService.updateTemplate(id, dto) };
  }

  @Post(':id/versions')
  async createVersion(@Param('id') id: string, @Body() dto: CreateVersionDto) {
    return { data: await this.templatesService.createVersion(id, dto) };
  }

  @Get(':id/versions')
  async listVersions(@Param('id') id: string) {
    return { data: await this.templatesService.listVersions(id) };
  }

  @Get(':id/versions/:versionId')
  async getVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    return { data: await this.templatesService.getVersion(id, versionId) };
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Body() dto: PublishVersionDto) {
    return { data: await this.templatesService.publishVersion(id, dto) };
  }
}
