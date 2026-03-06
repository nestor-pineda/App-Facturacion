import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCloseFn, mockPdfFn, mockSetContentFn, mockSetViewportFn, mockNewPageFn, mockLaunchFn } =
  vi.hoisted(() => {
    const mockCloseFn = vi.fn().mockResolvedValue(undefined);
    const mockPdfFn = vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake pdf content'));
    const mockSetContentFn = vi.fn().mockResolvedValue(undefined);
    const mockSetViewportFn = vi.fn().mockResolvedValue(undefined);
    const mockNewPageFn = vi.fn().mockResolvedValue({
      setViewport: mockSetViewportFn,
      setContent: mockSetContentFn,
      pdf: mockPdfFn,
    });
    const mockLaunchFn = vi.fn().mockResolvedValue({
      newPage: mockNewPageFn,
      close: mockCloseFn,
    });
    return { mockCloseFn, mockPdfFn, mockSetContentFn, mockSetViewportFn, mockNewPageFn, mockLaunchFn };
  });

vi.mock('puppeteer', () => ({
  default: { launch: mockLaunchFn },
}));

import { generatePDF } from '../../../src/services/pdf.service';

const SIMPLE_HTML = '<html><body><p>Test</p></body></html>';

describe('generatePDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfFn.mockResolvedValue(Buffer.from('%PDF-1.4 fake pdf content'));
    mockSetContentFn.mockResolvedValue(undefined);
    mockSetViewportFn.mockResolvedValue(undefined);
    mockCloseFn.mockResolvedValue(undefined);
    mockNewPageFn.mockResolvedValue({
      setViewport: mockSetViewportFn,
      setContent: mockSetContentFn,
      pdf: mockPdfFn,
    });
    mockLaunchFn.mockResolvedValue({
      newPage: mockNewPageFn,
      close: mockCloseFn,
    });
  });

  it('should return a Buffer from valid HTML', async () => {
    const result = await generatePDF(SIMPLE_HTML);

    expect(result).toBeInstanceOf(Buffer);
  });

  it('should start the returned buffer with %PDF', async () => {
    const result = await generatePDF(SIMPLE_HTML);

    expect(result.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('should launch puppeteer with sandbox disabled args', async () => {
    await generatePDF(SIMPLE_HTML);

    expect(mockLaunchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox']),
      }),
    );
  });

  it('should set page content with networkidle0', async () => {
    await generatePDF(SIMPLE_HTML);

    expect(mockSetContentFn).toHaveBeenCalledWith(
      SIMPLE_HTML,
      expect.objectContaining({ waitUntil: 'networkidle0' }),
    );
  });

  it('should generate PDF with A4 format and printBackground', async () => {
    await generatePDF(SIMPLE_HTML);

    expect(mockPdfFn).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'A4', printBackground: true }),
    );
  });

  it('should close the browser even if page.pdf throws', async () => {
    mockPdfFn.mockRejectedValueOnce(new Error('Puppeteer crash'));

    await expect(generatePDF(SIMPLE_HTML)).rejects.toThrow('Puppeteer crash');

    expect(mockCloseFn).toHaveBeenCalledOnce();
  });

  it('should close the browser after successful generation', async () => {
    await generatePDF(SIMPLE_HTML);

    expect(mockCloseFn).toHaveBeenCalledOnce();
  });
});
