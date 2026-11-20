import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(@Body() dto: CreateDocumentDto) {
    return { data: await this.documentsService.createDocument(dto) };
  }

  @Get()
  async list(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const p = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const l = Math.max(Math.min(parseInt(limit ?? '20', 10) || 20, 100), 1);
    return this.documentsService.findAll(p, l);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return { data: await this.documentsService.findOne(id) };
  }
}
