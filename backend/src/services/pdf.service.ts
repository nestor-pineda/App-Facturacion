import puppeteer from 'puppeteer';

const PDF_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
] as const;

/**
 * Generates a PDF buffer from a complete HTML string using Puppeteer.
 * The browser is always closed after generation, even if an error occurs.
 *
 * @param html - Full HTML document string including styles
 * @returns Buffer containing the generated PDF bytes
 * @throws Error if Puppeteer fails to launch or render the page
 */
export const generatePDF = async (html: string): Promise<Buffer> => {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const browser = await puppeteer.launch({
    headless: true,
    args: [...PDF_CHROMIUM_ARGS],
    executablePath: executablePath || undefined,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 1600 });
    await page.emulateMediaType('screen');

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};