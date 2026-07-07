import { test, expect } from '@playwright/test';
import { fulfillJson, loginAs, mockCards, mockInterpretation } from './mocks';

test.describe('Chat de tarot', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('tela de boas-vindas com preço', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Bem-vindo ao QuickTarot')).toBeVisible();
    await expect(page.getByText(/Cada consulta custa/)).toBeVisible();
  });

  test('pergunta revela 9 cartas, interpretação e atualiza saldo', async ({ page }) => {
    await page.route('**/api/chat/tarot-question', (route) =>
      fulfillJson(route, {
        cards: mockCards,
        interpretation: mockInterpretation,
        question: 'Vou ser feliz?',
        balance: 4,
      })
    );

    await page.goto('/');
    const input = page.getByPlaceholder('Faça sua pergunta ao oráculo...');
    await input.fill('Vou ser feliz?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    // Mensagem do usuário aparece
    await expect(page.getByText('Vou ser feliz?').first()).toBeVisible();

    // 9 cartas renderizadas (frente com imagem tem alt = nome da carta)
    for (const card of mockCards) {
      await expect(page.getByAltText(card.name)).toBeVisible({ timeout: 15_000 });
    }

    // Interpretação chega após o flip das cartas (sequência restaurada)
    await expect(page.getByText('Visão Geral da Tiragem')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/profunda transformação/)).toBeVisible({ timeout: 20_000 });

    // Saldo atualizado no header
    await expect(page.getByTestId('balance')).toContainText('4,00');
  });

  test('saldo insuficiente mostra mensagem de erro do servidor', async ({ page }) => {
    await page.route('**/api/chat/tarot-question', (route) =>
      fulfillJson(route, { detail: 'Saldo insuficiente. Cada pergunta custa R$ 1.00' }, 402)
    );

    await page.goto('/');
    await page.getByPlaceholder('Faça sua pergunta ao oráculo...').fill('E agora?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText(/Saldo insuficiente/)).toBeVisible();
  });

  test('erro 500 não quebra a interface', async ({ page }) => {
    await page.route('**/api/chat/tarot-question', (route) =>
      fulfillJson(route, { detail: 'Erro interno do servidor' }, 500)
    );

    await page.goto('/');
    await page.getByPlaceholder('Faça sua pergunta ao oráculo...').fill('Quebra?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText('Erro interno do servidor')).toBeVisible();
    // Input volta a ficar utilizável
    await expect(page.getByPlaceholder('Faça sua pergunta ao oráculo...')).toBeEnabled();
  });

  test('não envia pergunta vazia', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });
});
