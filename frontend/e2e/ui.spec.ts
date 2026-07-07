import { test, expect } from '@playwright/test';
import { fulfillJson, loginAs, mockCards, mockInterpretation } from './mocks';

// PNG 1x1 para QR
const FAKE_QR =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const shot = (name: string, project: string) => `e2e/screenshots/${project}-${name}.png`;

test.describe('Screenshots de UI', () => {
  test('tela de login', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'QuickTarot' })).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('01-login', testInfo.project.name), fullPage: true });
  });

  test('tela de cadastro', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.getByText('Cadastre-se').click();
    await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('02-registro', testInfo.project.name), fullPage: true });
  });

  test('chat vazio (boas-vindas)', async ({ page }, testInfo) => {
    await loginAs(page);
    await page.goto('/');
    await expect(page.getByText('Bem-vindo ao QuickTarot')).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('03-chat-vazio', testInfo.project.name), fullPage: true });
  });

  test('tiragem completa com cartas e interpretação', async ({ page }, testInfo) => {
    await loginAs(page);
    await page.route('**/api/chat/tarot-question', (route) =>
      fulfillJson(route, {
        cards: mockCards,
        interpretation: mockInterpretation,
        question: 'Como será meu futuro?',
        balance: 4,
      })
    );

    await page.goto('/');
    await page.getByPlaceholder('Faça sua pergunta ao oráculo...').fill('Como será meu futuro?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    // Espera cartas + typewriter terminar (último trecho do texto visível)
    await expect(page.getByText(/razão e emoção/)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500);
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('04-tiragem', testInfo.project.name), fullPage: true });
  });

  test('modal de pagamento Pix', async ({ page }, testInfo) => {
    await loginAs(page);
    await page.route('**/api/payment/create-pix', (route) =>
      fulfillJson(route, {
        success: true,
        transaction_id: 'tx-shot',
        amount: 10,
        pix_code: '00020126360014BR.GOV.BCB.PIX-EXEMPLO-6304ABCD',
        qr_code: FAKE_QR,
        status: 'pending',
      })
    );
    await page.route('**/api/payment/check-status/**', (route) =>
      fulfillJson(route, { status: 'pending', amount: 10 })
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();
    await expect(page.getByRole('heading', { name: /Pagar com Pix/ })).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('05-modal-valor', testInfo.project.name) });

    await page.getByRole('button', { name: 'Pagar com Pix' }).click();
    await expect(page.getByAltText('QR Code Pix')).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('06-modal-qrcode', testInfo.project.name) });
  });

  test('erro de login (estado visual)', async ({ page }, testInfo) => {
    await page.route('**/api/auth/login', (route) =>
      fulfillJson(route, { detail: 'Email ou senha incorretos' }, 401)
    );
    await page.goto('/');
    await page.getByLabel('Email').fill('user@test.com');
    await page.getByLabel('Senha').fill('errada123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Email ou senha incorretos' })).toBeVisible();
    await page.waitForTimeout(700); // deixa o fade-in terminar
    await page.screenshot({ path: shot('07-login-erro', testInfo.project.name), fullPage: true });
  });
});
