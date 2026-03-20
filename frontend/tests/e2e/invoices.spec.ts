import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('full flow: create client, service, invoice, send, verify number, download PDF, immutability', async ({
    page,
  }) => {
    const clientName = 'E2E Invoice Client';
    const serviceName = 'E2E Service';

    await page.goto('/clients');
    await page.getByRole('button', { name: /Nuevo cliente|New client/i }).click();
    await page.locator('#nombre').fill(clientName);
    await page.locator('#email').fill(`client-${Date.now()}@test.com`);
    await page.locator('#cifNif').fill('B12345678');
    await page.locator('#direccion').fill('Calle Client 1');
    await page.getByRole('button', { name: /Crear cliente|Create client/i }).click();
    await expect(page.getByText(clientName)).toBeVisible({ timeout: 10_000 });

    await page.goto('/services');
    await page.getByRole('button', { name: /Nuevo servicio|New service/i }).click();
    await page.locator('#nombre').fill(serviceName);
    await page.locator('#precioBase').fill('100');
    await page.getByRole('button', { name: /Crear servicio|Create service/i }).click();
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10_000 });

    await page.goto('/invoices/new');
    await page.getByRole('combobox', { name: /Cliente|Client/i }).click();
    await page.getByRole('option', { name: clientName }).click();
    await page.getByRole('combobox', { name: /Desde catálogo|From catalog/i }).first().click();
    await page.getByRole('option', { name: serviceName }).click();
    await page.locator('input[type="number"]').first().fill('1');
    await page.getByRole('button', { name: /Crear factura|Create invoice/i }).click();
    await expect(page).toHaveURL(/\/invoices/, { timeout: 15_000 });

    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+/);

    await page.getByRole('button', { name: /Enviar|Send/i }).first().click();
    await page.getByRole('alertdialog').getByRole('button', { name: /Enviar factura|Send invoice/i }).click();
    await expect(page.getByText(/^Enviada$|^Sent$/i)).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await page.getByRole('button', { name: /Descargar|Download/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^factura-.+\.pdf$/);

    await expect(page.getByRole('button', { name: /Editar|Edit/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Eliminar|Delete/i })).not.toBeVisible();
  });
});
