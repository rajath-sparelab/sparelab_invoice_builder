import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  validateTemplateConfiguration,
  validateDocumentData,
  renderDocumentHtml,
  type TemplateConfiguration,
  type DocumentData,
} from '@sparelab/contracts';
import { launch } from 'puppeteer';
import type { Page as PuppeteerPage, Browser as PuppeteerBrowser } from 'puppeteer';

const DEFAULT_FILENAME = 'document.pdf';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_HTML_SIZE_KB = 500;

/**
 * PDF generation service.
 *
 * Pipeline:
 *   template config + document data -> validate -> renderDocumentHtml (shared
 *   renderer from @sparelab/contracts) -> Puppeteer page -> PDF buffer.
 *
 * The same shared renderer used by the frontend LivePreview produces the HTML,
 * so the PDF visually matches the preview. A single Puppeteer browser instance
 * is reused across requests (lazily launched, kept alive for the app lifetime).
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: PuppeteerBrowser | null = null;
  private launchPromise: Promise<PuppeteerBrowser> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async generatePdf(
    config: unknown,
    data: unknown,
    filename?: string,
  ): Promise<{ pdf: Buffer; filename: string; size: number }> {
    const validatedConfig = this.validateConfig(config);
    const validatedData = this.validateData(data);

    const html = renderDocumentHtml(validatedConfig, validatedData);

    if (Buffer.byteLength(html) > MAX_HTML_SIZE_KB * 1024) {
      throw new BadRequestException('Document too large to render');
    }

    const pdf = await this.htmlToPdf(html);
    const outFilename = filename ?? DEFAULT_FILENAME;

    return {
      pdf,
      filename: outFilename,
      size: pdf.length,
    };
  }

  private validateConfig(config: unknown): TemplateConfiguration {
    try {
      return validateTemplateConfiguration(config);
    } catch (error) {
      const issues: Array<{ path: string; message: string }> = [];
      if (
        error &&
        typeof error === 'object' &&
        'issues' in error &&
        Array.isArray((error as any).issues)
      ) {
        for (const issue of (error as any).issues) {
          issues.push({
            path: issue.path?.join('.') ?? '',
            message: issue.message,
          });
        }
      }
      throw new BadRequestException({
        message: 'Invalid template configuration',
        errors: issues,
      });
    }
  }

  private validateData(data: unknown): DocumentData {
    try {
      return validateDocumentData(data);
    } catch {
      throw new BadRequestException('Document data must be a JSON object');
    }
  }

  private async getBrowser(): Promise<PuppeteerBrowser> {
    if (this.browser) return this.browser;
    if (this.launchPromise) return this.launchPromise;

    this.launchPromise = this.launchBrowser();
    this.browser = await this.launchPromise;
    return this.browser;
  }

  private async launchBrowser(): Promise<PuppeteerBrowser> {
    const executablePath = this.configService.get<string>(
      'PUPPETEER_EXECUTABLE_PATH',
    );
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--font-render-hinting=none',
    ];

    const browser = await launch({
      executablePath: executablePath || undefined,
      headless: true,
      args,
    });

    this.logger.log('Puppeteer browser launched');
    return browser;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    let page: PuppeteerPage | null = null;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'load' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`PDF generation failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to generate PDF');
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.logger.log('Puppeteer browser closed');
      } catch {
        // ignore
      }
    }
  }
}
