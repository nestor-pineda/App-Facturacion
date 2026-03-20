import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Quotes', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('full flow: create client, service, quote, send, convert to invoice', async ({ page }) => {
    const clientName = 'E2E Quote Client';
    const serviceName = 'E2E Quote Service';

    await page.goto('/clients');
    await page.getByRole('button', { name: /Nuevo cliente|New client/i }).click();
    await page.locator('#nombre').fill(clientName);
    await page.locator('#email').fill(`quote-client-${Date.now()}@test.com`);
    await page.locator('#cifNif').fill('B87654321');
    await page.locator('#direccion').fill('Calle Quote 1');
    await page.getByRole('button', { name: /Crear cliente|Create client/i }).click();
    await expect(page.getByText(clientName)).toBeVisible({ timeout: 10_000 });

    await page.goto('/services');
    await page.getByRole('button', { name: /Nuevo servicio|New service/i }).click();
    await page.locator('#nombre').fill(serviceName);
    await page.locator('#precioBase').fill('50');
    await page.getByRole('button', { name: /Crear servicio|Create service/i }).click();
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10_000 });

    await page.goto('/quotes/new');
    await page.getByRole('combobox', { name: /Cliente|Client/i }).click();
    await page.getByRole('option', { name: clientName }).click();
    await page.getByRole('combobox', { name: /Desde catálogo|From catalog/i }).first().click();
    await page.getByRole('option', { name: serviceName }).click();
    await page.locator('input[type="number"]').first().fill('2');
    await page.getByRole('button', { name: /Crear presupuesto|Create quote/i }).click();
    await expect(page).toHaveURL(/\/quotes/, { timeout: 15_000 });

    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+/);

    await page.getByRole('button', { name: /^Enviar$|^Send$/i }).first().click();
    await page.getByRole('alertdialog').getByRole('button', { name: /^Enviar$|^Send$/i }).click();
    await expect(page.getByText(/Enviado|Sent/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Convertir a factura|Convert to invoice/i }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: /Convertir|Convert/i }).click();
    await expect(page).toHaveURL(/\/invoices/, { timeout: 15_000 });
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 10_000 });
  });
});
