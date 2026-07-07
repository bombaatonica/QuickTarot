# Guia de Instalação - QuickTarot

## Problemas Comuns e Soluções

### 1. Conflito de Dependências Python (pydantic)

Se você encontrar erros como:
```
realtime 2.7.0 requires pydantic<3.0.0,>=2.11.7, but you have pydantic 2.5.0
```

**Solução:**
1. Primeiro, atualize manualmente o pydantic:
```bash
cd backend
pip install --upgrade "pydantic>=2.11.7,<3.0.0" "pydantic-settings>=2.3.0"
```

2. Depois instale as outras dependências:
```bash
pip install -r requirements.txt
```

### 2. Vulnerabilidade de Segurança do Next.js

O Next.js 14.0.4 tem uma vulnerabilidade conhecida. O `package.json` já foi atualizado para usar `^14.2.0`.

**Solução:**
```bash
cd frontend
npm install
```

Se houver conflitos, limpe o cache do npm:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. Erro EPERM no Windows (npm)

Erros como `EPERM: operation not permitted` são comuns no Windows e geralmente não impedem a instalação.

**Soluções:**
1. Execute o PowerShell/CMD como Administrador
2. Ou feche todos os processos Node.js antes de instalar:
```bash
taskkill /f /im node.exe
npm install
```

3. Se persistir, tente limpar e reinstalar:
```bash
npm cache clean --force
rd /s /q node_modules
del package-lock.json
npm install
```

## Instalação Completa (Passo a Passo)

### Backend

```bash
# 1. Entre no diretório
cd backend

# 2. (Opcional) Crie um ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Atualize pip
python -m pip install --upgrade pip

# 4. Instale pydantic primeiro (para evitar conflitos)
pip install "pydantic>=2.11.7,<3.0.0" "pydantic-settings>=2.3.0"

# 5. Instale as outras dependências
pip install -r requirements.txt

# 6. Crie arquivo .env
# Copie as variáveis do .env.example e configure
```

### Frontend

```bash
# 1. Entre no diretório
cd frontend

# 2. Limpe cache (se necessário)
npm cache clean --force

# 3. Instale dependências
npm install

# 4. Crie arquivo .env.local
# Configure NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Verificação

### Verificar versões instaladas

**Python:**
```bash
python -c "import pydantic; print(f'Pydantic: {pydantic.__version__}')"
python -c "import pydantic_settings; print(f'Pydantic-settings: {pydantic_settings.__version__}')"
```

**Node:**
```bash
cd frontend
npm list next
```

## Executando o Projeto

### Backend
```bash
cd backend
python -m flask --app api.main:app run --port 8000 --debug
```

### Frontend
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:3000
