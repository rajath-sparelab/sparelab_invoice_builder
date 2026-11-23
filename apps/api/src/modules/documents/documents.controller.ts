import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  createDocumentRequestSchema,
  paginationQuerySchema,
  type CreateDocumentRequest,
  type PaginationQuery,
} from '@sparelab/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(createDocumentRequestSchema))
    dto: CreateDocumentRequest,
  ) {
    return { data: await this.documentsService.createDocument(dto) };
  }

  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.documentsService.findAll(query.page, query.limit);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return { data: await this.documentsService.findOne(id) };
  }
}
