import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const E2E_PASSWORD = 'e2e-test-password-123';

/** Register button: Crear cuenta | Create account */
const REGISTER_SUBMIT = /Crear cuenta|Create account/i;
/** Login button: Iniciar sesión | Sign in */
const LOGIN_SUBMIT = /Iniciar sesión|Sign in/i;

export interface E2EUser {
  email: string;
  password: string;
}

/**
 * Registers a new user with a unique email and navigates to /login (or stays on login page).
 * Returns the credentials for later login.
 */
export async function registerNewUser(page: Page): Promise<E2EUser> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
  await page.goto('/register');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(E2E_PASSWORD);
  await page.locator('#nombreComercial').fill('E2E Test Business');
  await page.locator('#nif').fill('12345678A');
  await page.locator('#direccionFiscal').fill('Calle Test 1, Madrid');
  await page.getByRole('button', { name: REGISTER_SUBMIT }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  return { email, password: E2E_PASSWORD };
}

/**
 * Logs in with the given credentials. Expects to be on /login (or navigates there).
 * After success, leaves the app on the dashboard (/).
 */
export async function loginAsUser(page: Page, user: E2EUser): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: LOGIN_SUBMIT }).click();
  await expect(page).toHaveURL('/', { timeout: 30_000 });
}

/**
 * Registers a new user and logs in. Leaves the app on the dashboard with a valid session.
 * Returns the credentials in case other tests need them.
 */
export async function registerAndLogin(page: Page): Promise<E2EUser> {
  const user = await registerNewUser(page);
  await loginAsUser(page, user);
  return user;
}
