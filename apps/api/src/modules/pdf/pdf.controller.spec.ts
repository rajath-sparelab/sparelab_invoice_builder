import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { validateTemplateConfiguration } from '@sparelab/contracts';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

const mockPage = {
  setViewport: jest.fn(),
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake pdf content')),
  close: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

const baseConfig = validateTemplateConfiguration({
  schemaVersion: '1.0.0',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  sections: [
    {
      id: 's1',
      blocks: [{ id: 'b1', type: 'text', content: 'Invoice', style: {} }],
    },
  ],
});

const DATA = { title: 'INV-001' };

describe('PdfController', () => {
  let controller: PdfController;
  let service: PdfService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [
        {
          provide: PdfService,
          useValue: {
            generatePdf: jest.fn().mockResolvedValue({
              pdf: Buffer.from('%PDF-1.4 fake pdf content'),
              filename: 'document.pdf',
              size: 23,
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            documentTemplate: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'tpl-1',
                currentVersionId: 'ver-1',
              }),
            },
            documentTemplateVersion: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'ver-1',
                configuration: baseConfig,
              }),
            },
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    controller = module.get(PdfController);
    service = module.get(PdfService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('generates and returns a PDF', async () => {
    const res: any = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.generatePdf('tpl-1', { data: DATA }, res);

    expect(service.generatePdf).toHaveBeenCalledWith(baseConfig, DATA, undefined);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      }),
    );
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('throws 404 for a missing template', async () => {
    (prisma.documentTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    const res: any = { set: jest.fn().mockReturnThis(), send: jest.fn() };
    await expect(
      controller.generatePdf('missing', { data: DATA }, res),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws 404 when template has no version', async () => {
    (prisma.documentTemplate.findUnique as jest.Mock).mockResolvedValue({
      id: 'tpl-1',
      currentVersionId: null,
    } as any);
    const res: any = { set: jest.fn().mockReturnThis(), send: jest.fn() };
    await expect(
      controller.generatePdf('tpl-1', { data: DATA }, res),
    ).rejects.toThrow(NotFoundException);
  });

  it('uses provided configuration when given', async () => {
    const customConfig = validateTemplateConfiguration({
      ...baseConfig,
      sections: [{ id: 's1', blocks: [{ id: 'b1', type: 'text', content: 'Custom', style: {} }] }],
    });
    const res: any = { set: jest.fn().mockReturnThis(), send: jest.fn() };
    await controller.generatePdf(
      'tpl-1',
      { data: DATA, configuration: customConfig },
      res,
    );
    expect(service.generatePdf).toHaveBeenCalledWith(customConfig, DATA, undefined);
  });
});
