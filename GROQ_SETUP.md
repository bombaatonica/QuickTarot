# Configuração do Groq - QuickTarot

## O que é Groq?

Groq é uma plataforma que oferece API gratuita para modelos de IA como LLaMA, Mixtral e outros. É muito rápida e tem limites generosos para uso gratuito.

## Como obter a chave API do Groq

1. **Acesse o site do Groq:**
   - https://console.groq.com/

2. **Crie uma conta:**
   - Clique em "Sign Up"
   - Use seu email ou Google/GitHub
   - É completamente gratuito!

3. **Gere uma API Key:**
   - Após fazer login, vá em "API Keys"
   - Clique em "Create API Key"
   - Dê um nome (ex: "QuickTarot")
   - Copie a chave gerada (começa com `gsk_`)

4. **Configure no projeto:**
   - Adicione a chave no arquivo `.env` do backend:
   ```env
   GROQ_API_KEY=gsk_sua-chave-aqui
   ```

## Limites Gratuitos do Groq

- **14.400 requisições/minuto** (muito generoso!)
- **30.000 requisições/dia**
- Modelos disponíveis: LLaMA 3, Mixtral, Gemma, etc.
- Sem custo enquanto estiver dentro dos limites

## Modelos Disponíveis

O projeto está configurado para usar `llama-3.3-70b-versatile`, que é um dos melhores modelos gratuitos disponíveis.

Outros modelos que você pode tentar (no arquivo `llm.py`):
- `llama-3.3-70b-versatile` (atual, recomendado)
- `llama-3.1-8b-instant` (mais rápido, menor)
- `mixtral-8x7b-32768` (muito bom para textos longos)
- `gemma-7b-it` (compacto e eficiente)

## Testando a API

Você pode testar se sua chave está funcionando:

```python
from groq import Groq

client = Groq(api_key="sua-chave-aqui")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "user", "content": "Olá! Como você está?"}
    ]
)

print(response.choices[0].message.content)
```

## Suporte

- Documentação: https://console.groq.com/docs
- Status: https://status.groq.com/
- Discord: https://discord.gg/groq
