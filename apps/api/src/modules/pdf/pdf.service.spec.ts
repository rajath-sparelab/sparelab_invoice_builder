import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { validateTemplateConfiguration } from '@sparelab/contracts';
import { PdfService } from './pdf.service';

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

import { launch } from 'puppeteer';

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

describe('PdfService', () => {
  let service: PdfService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(launch).mockResolvedValue(mockBrowser as any);

    module = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
      ],
    }).compile();

    service = module.get(PdfService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('generates a PDF buffer from a valid config and data', async () => {
    const result = await service.generatePdf(baseConfig, DATA, 'invoice.pdf');

    expect(launch).toHaveBeenCalled();
    expect(mockBrowser.newPage).toHaveBeenCalled();
    expect(mockPage.setContent).toHaveBeenCalledWith(
      expect.stringContaining('Invoice'),
      { waitUntil: 'load' },
    );
    expect(mockPage.pdf).toHaveBeenCalled();
    expect(result.pdf).toBeInstanceOf(Buffer);
    expect(result.filename).toBe('invoice.pdf');
    expect(result.size).toBeGreaterThan(0);
    expect(mockPage.close).toHaveBeenCalled();
  });

  it('defaults filename to document.pdf', async () => {
    const result = await service.generatePdf(baseConfig, DATA);
    expect(result.filename).toBe('document.pdf');
  });

  it('rejects an invalid template configuration', async () => {
    await expect(
      service.generatePdf({ notValid: true } as any, DATA),
    ).rejects.toThrow(BadRequestException);
    expect(mockBrowser.newPage).not.toHaveBeenCalled();
  });

  it('rejects non-JSON document data', async () => {
    await expect(
      service.generatePdf(baseConfig, 'not-an-object' as any),
    ).rejects.toThrow(BadRequestException);
    expect(mockBrowser.newPage).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException when Puppeteer fails', async () => {
    jest.mocked(mockPage.pdf).mockRejectedValue(new Error('puppeteer boom'));
    await expect(
      service.generatePdf(baseConfig, DATA),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
