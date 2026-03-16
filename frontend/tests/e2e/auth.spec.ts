import { test, expect } from '@playwright/test';
import { registerNewUser, loginAsUser, registerAndLogin } from './helpers/auth';

test.describe('Auth', () => {
  test('register creates account and redirects to login', async ({ page }) => {
    const user = await registerNewUser(page);
    await expect(page).toHaveURL(/\/login/);
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /Iniciar sesión|Sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const user = await registerNewUser(page);
    await loginAsUser(page, user);
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 20_000 });
  });

  test('logout redirects to login', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: /Cerrar sesión|Log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/invoices');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });
});
