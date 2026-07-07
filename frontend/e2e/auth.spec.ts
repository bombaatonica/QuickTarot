import { test, expect } from '@playwright/test';
import { fulfillJson, loginAs, mockUser } from './mocks';

test.describe('Autenticação', () => {
  test('mostra tela de login sem token', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'QuickTarot' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByText('Cadastre-se')).toBeVisible();
  });

  test('login com sucesso leva ao chat', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      fulfillJson(route, { access_token: 'tok', token_type: 'bearer', user: mockUser })
    );
    await page.route('**/api/auth/me', (route) => fulfillJson(route, mockUser));

    await page.goto('/');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Senha').fill('senha12345');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByPlaceholder('Faça sua pergunta ao oráculo...')).toBeVisible();
    await expect(page.getByText('Bem-vindo ao QuickTarot')).toBeVisible();
  });

  test('credencial errada mostra erro inline (sem alert)', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      fulfillJson(route, { detail: 'Email ou senha incorretos' }, 401)
    );

    await page.goto('/');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Senha').fill('errada123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Email ou senha incorretos' })).toBeVisible();
    // Continua na tela de login
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('cadastro com sucesso leva ao chat', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      fulfillJson(route, { access_token: 'tok', token_type: 'bearer', user: { ...mockUser, balance: 0 } })
    );
    await page.route('**/api/auth/me', (route) => fulfillJson(route, { ...mockUser, balance: 0 }));

    await page.goto('/');
    await page.getByText('Cadastre-se').click();
    await page.getByLabel('Nome (opcional)').fill('Novo Usuário');
    await page.getByLabel('Email').fill('novo@test.com');
    await page.getByLabel(/Senha/).fill('senha12345');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByPlaceholder('Faça sua pergunta ao oráculo...')).toBeVisible();
  });

  test('token inválido volta para login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'token-podre');
    });
    await page.route('**/api/auth/me', (route) =>
      fulfillJson(route, { detail: 'Token inválido' }, 401)
    );

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('sessão válida vai direto ao chat', async ({ page }) => {
    await loginAs(page);
    await page.goto('/');
    await expect(page.getByPlaceholder('Faça sua pergunta ao oráculo...')).toBeVisible();
    await expect(page.getByTestId('balance')).toContainText('5,00');
  });
});
