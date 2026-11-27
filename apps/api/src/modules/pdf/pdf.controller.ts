import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  generatePdfRequestSchema,
  type GeneratePdfRequest,
} from './dto/generate-pdf.dto';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Response } from 'express';
import type { TemplateConfiguration } from '@sparelab/contracts';

/**
 * PDF generation endpoint.
 *
 * POST /templates/:id/pdf
 *
 * Body: { data: DocumentData, filename?: string }
 *
 * Returns the generated PDF as application/pdf with a Content-Disposition
 * attachment header so the browser downloads it.
 */
@Controller('templates')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/pdf')
  async generatePdf(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(generatePdfRequestSchema))
    dto: GeneratePdfRequest,
    @Res() res: Response,
  ) {
    // Verify template access.
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with id "${id}" not found`);
    }

    // Use the provided configuration (e.g. unsaved editor draft) or fall back
    // to the template's current version configuration as the source of truth.
    let config = dto.configuration;
    if (!config) {
      if (!template.currentVersionId) {
        throw new NotFoundException(
          `Template "${id}" has no version to generate a PDF from`,
        );
      }
      const version = await this.prisma.documentTemplateVersion.findUnique({
        where: { id: template.currentVersionId },
      });

      if (!version) {
        throw new NotFoundException(
          `Version "${template.currentVersionId}" not found for template "${id}"`,
        );
      }
      config = version.configuration as unknown as TemplateConfiguration;
    }

    const { pdf, filename, size } = await this.pdfService.generatePdf(
      config,
      dto.data,
      dto.filename,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(size),
    });
    res.send(pdf);
  }
}
