import { Page, Route } from '@playwright/test';

export const mockUser = { id: 'u1', email: 'user@test.com', name: 'Testador', balance: 5 };

// Nomes precisam bater com namePt de data/tarot-data.ts para as imagens carregarem
export const mockCards = [
  { name: 'O Louco', suit: null, meaning: 'Início, aventura, liberdade', is_major: true },
  { name: 'O Mago', suit: null, meaning: 'Manifestação, poder, criação', is_major: true },
  { name: 'A Sacerdotisa', suit: null, meaning: 'Intuição, mistério, sabedoria interior', is_major: true },
  { name: 'A Imperatriz', suit: null, meaning: 'Abundância, fertilidade, criatividade', is_major: true },
  { name: 'O Imperador', suit: null, meaning: 'Autoridade, estrutura, controle', is_major: true },
  { name: 'Os Amantes', suit: null, meaning: 'Escolha, relacionamento, harmonia', is_major: true },
  { name: 'A Estrela', suit: null, meaning: 'Esperança, inspiração, serenidade', is_major: true },
  { name: 'A Lua', suit: null, meaning: 'Ilusão, inconsciente, medo', is_major: true },
  { name: 'O Sol', suit: null, meaning: 'Alegria, sucesso, vitalidade', is_major: true },
];

export const mockInterpretation = [
  '**Visão Geral da Tiragem**',
  '',
  'As cartas revelam um momento de profunda transformação e novos começos em sua jornada.',
  '',
  '**Interpretação de Cada Carta**',
  '1. **O Louco**: Um novo ciclo se abre diante de você, pedindo coragem.',
  '2. **O Mago**: Você tem todas as ferramentas necessárias para manifestar seus desejos.',
  '3. **A Sacerdotisa**: Confie na sua intuição neste momento.',
  '',
  '**Como as Cartas Trabalham Juntas**',
  'Juntas, as cartas apontam para crescimento pessoal e clareza de propósito.',
  '',
  '**Insights Práticos e Orientação**',
  '• Confie na sua intuição',
  '• Dê o primeiro passo sem medo',
  '• Mantenha o equilíbrio entre razão e emoção',
].join('\n');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/** Responde JSON com headers de CORS e trata o preflight OPTIONS. */
export async function fulfillJson(route: Route, data: unknown, status = 200) {
  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers: CORS_HEADERS });
  }
  return route.fulfill({
    status,
    headers: CORS_HEADERS,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

/** Prepara sessão autenticada: token no localStorage + mock de /api/auth/me. */
export async function loginAs(page: Page, user = mockUser) {
  await page.addInitScript((u) => {
    localStorage.setItem('token', 'fake-token-e2e');
    localStorage.setItem('user', JSON.stringify(u));
  }, user);
  await page.route('**/api/auth/me', (route) => fulfillJson(route, user));
}
