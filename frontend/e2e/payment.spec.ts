import { test, expect } from '@playwright/test';
import { fulfillJson, loginAs, mockUser } from './mocks';

// PNG 1x1 transparente para o QR code
const FAKE_QR =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.describe('Pagamento Pix', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('input de valor é editável e valida mínimo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();

    const input = page.getByPlaceholder('10.00');
    await expect(input).toHaveValue('10.00');
    await input.fill('25.00');
    await expect(input).toHaveValue('25.00');

    // Valor abaixo do mínimo mostra erro inline
    await input.fill('1');
    await page.getByRole('button', { name: 'Pagar com Pix' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Valor mínimo é R$ 2,00' })).toBeVisible();
  });

  test('cria cobrança Pix e exibe QR code + código copia-e-cola', async ({ page }) => {
    await page.route('**/api/payment/create-pix', (route) =>
      fulfillJson(route, {
        success: true,
        transaction_id: 'tx1',
        amount: 10,
        pix_code: '00020126PIX-CODIGO-FAKE-E2E6304ABCD',
        qr_code: FAKE_QR,
        status: 'pending',
      })
    );
    await page.route('**/api/payment/check-status/**', (route) =>
      fulfillJson(route, { status: 'pending', amount: 10 })
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();
    await page.getByRole('button', { name: 'Pagar com Pix' }).click();

    await expect(page.getByAltText('QR Code Pix')).toBeVisible();
    await expect(page.getByText('00020126PIX-CODIGO-FAKE-E2E6304ABCD')).toBeVisible();
    await expect(page.getByText('Aguardando pagamento...')).toBeVisible();

    // Copiar código
    await page.getByRole('button', { name: 'Copiar código' }).click();
    await expect(page.getByRole('button', { name: /Copiado/ })).toBeVisible();
  });

  test('pagamento confirmado fecha modal e recarrega saldo', async ({ page }) => {
    let paid = false;
    await page.route('**/api/payment/create-pix', (route) =>
      fulfillJson(route, {
        success: true,
        transaction_id: 'tx2',
        amount: 10,
        pix_code: 'PIX-CODE',
        qr_code: FAKE_QR,
        status: 'pending',
      })
    );
    await page.route('**/api/payment/check-status/**', (route) => {
      const status = paid ? 'paid' : 'pending';
      paid = true; // primeiro poll: pending; segundo: paid
      return fulfillJson(route, { status, amount: 10 });
    });
    // Após pago, /me devolve saldo creditado pelo webhook
    await page.route('**/api/auth/me', (route) =>
      fulfillJson(route, { ...mockUser, balance: 15 })
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();
    await page.getByRole('button', { name: 'Pagar com Pix' }).click();
    await expect(page.getByAltText('QR Code Pix')).toBeVisible();

    // Polling roda a cada 5s; espera modal fechar e saldo atualizar
    await expect(page.getByAltText('QR Code Pix')).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId('balance')).toContainText('15,00', { timeout: 10_000 });
  });

  test('erro do provedor exibido inline', async ({ page }) => {
    await page.route('**/api/payment/create-pix', (route) =>
      fulfillJson(route, { success: false, error: 'Erro do provedor de pagamento' }, 502)
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();
    await page.getByRole('button', { name: 'Pagar com Pix' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Erro do provedor de pagamento' })).toBeVisible();
  });

  test('fechar modal reseta estado', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Adicionar Crédito' }).click();
    await expect(page.getByRole('heading', { name: /Pagar com Pix/ })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: /Pagar com Pix/ })).toBeHidden();
  });
});
