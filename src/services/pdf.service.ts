import puppeteer from 'puppeteer';

/**
 * Generates a PDF buffer from a complete HTML string using Puppeteer.
 * The browser is always closed after generation, even if an error occurs.
 *
 * @param html - Full HTML document string including styles
 * @returns Buffer containing the generated PDF bytes
 * @throws Error if Puppeteer fails to launch or render the page
 */
export const generatePDF = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 1600 });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};