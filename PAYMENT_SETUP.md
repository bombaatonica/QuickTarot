# Integração de Pagamento Pix com Oasyfy - QuickTarot

## Visão Geral

Este documento descreve como configurar e usar o sistema de pagamento Pix integrado ao QuickTarot através da API Oasyfy.

## Pré-requisitos

1. **Conta Oasyfy**: Você precisa ter uma conta ativa no Oasyfy
2. **Chave API Oasyfy**: Obtenha sua chave de API no painel do Oasyfy
3. **MongoDB**: Banco de dados MongoDB rodando localmente ou remoto

## Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/quicktarot

# Oasyfy
OASYF_API_KEY=sua-chave-da-api-oasyfy-aqui
OASYF_WEBHOOK_URL=https://seusite.com/api/payment/webhook
```

### 2. Instalação de Dependências

```bash
# Backend
cd backend
python setup.py

# Frontend
cd frontend
npm install
```

### 3. Inicialização do Banco de Dados

```bash
cd backend
python -c "from api.db.init import init_database; init_database()"
```

## Fluxo de Pagamento

1. **Usuário clica em "Adicionar Crédito"**
2. **Sistema cria cobrança Pix via Oasyfy**
3. **QR Code e código Pix são mostrados na modal**
4. **Usuário escaneia QR Code ou copia código**
5. **Sistema faz polling para verificar status**
6. **Quando pago, saldo é atualizado automaticamente**

## Rotas da API

### Criar Cobrança Pix
```
POST /api/payment/create-pix
Body: { "amount": 10.00 }
Response: {
  "success": true,
  "transaction_id": "id-da-transacao",
  "amount": 10.00,
  "pix_code": "codigo-pix",
  "qr_code": "data:image/png;base64,...",
  "status": "pending"
}
```

### Verificar Status
```
GET /api/payment/check-status/{transaction_id}
Response: {
  "status": "pending|paid|expired",
  "amount": 10.00
}
```

### Webhook (Recebido pelo Oasyfy)
```
POST /api/payment/webhook
Body: {
  "event": "charge.paid",
  "data": {
    "id": "id-da-cobranca",
    "amount": 10.00
  }
}
```

## Componentes Frontend

### PixPaymentModal
- Mostra QR Code Pix
- Exibe código Pix para cópia
- Verifica status automaticamente
- Feedback visual do status

### BuyQuestionButton
- Botão "Adicionar Crédito"
- Modal de seleção de valor
- Integração com PixPaymentModal

## Valores Mínimos

- **Valor mínimo por recarga**: R$ 2,00
- **Valor máximo**: Definido pelo usuário

## Segurança

- Todas as rotas protegidas por autenticação
- Validação de valores de pagamento
- Verificação de webhooks do Oasyfy
- Tratamento de expiração de cobranças

## Testando a Integração

1. Inicie o backend: `python backend/api/main.py`
2. Inicie o frontend: `cd frontend && npm run dev`
3. Acesse `http://localhost:3000`
4. Faça login ou crie uma conta
5. Clique em "Adicionar Crédito"
6. Teste com valores diferentes (mínimo R$ 2,00)

## Troubleshooting

### Erro: "MONGODB_URI não está definida"
- Verifique se o arquivo .env está configurado corretamente
- Certifique-se de que o MongoDB está rodando

### Erro: "OASYF_API_KEY não está definida"
- Configure sua chave da API Oasyfy no .env

### Erro: "Valor mínimo é R$ 2,00"
- O valor mínimo para recarga é R$ 2,00

## Próximos Passos

1. Configure sua chave da API Oasyfy
2. Teste o fluxo de pagamento
3. Monitore as transações no banco de dados
4. Implemente notificações por email (opcional)