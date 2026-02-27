import os
from groq import Groq
from typing import List
from ..models.tarot import Card
from .tarot import format_cards_for_llm


def get_llm_client() -> Groq:
    """Retorna o cliente Groq"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY não está definida nas variáveis de ambiente")
    return Groq(api_key=api_key)


def generate_tarot_interpretation(question: str, cards: List[Card]) -> str:
    """
    Gera uma interpretação de tarot usando o LLM Groq baseada na pergunta e nas cartas sorteadas
    """
    client = get_llm_client()
    
    cards_text = format_cards_for_llm(cards)
    
    prompt = f"""Você é um tarólogo experiente e compassivo. Um cliente fez a seguinte pergunta:

"{question}"

Foram sorteadas as seguintes 9 cartas de tarot:
{cards_text}

Por favor, forneça uma interpretação detalhada e personalizada dessas cartas em relação à pergunta do cliente. Siga EXATAMENTE esta estrutura:

**Visão Geral da Tiragem**
[Parágrafo inicial com a visão geral e tema principal da tiragem]

**Interpretação de Cada Carta**
1. **[Nome da Carta 1]**: [Interpretação detalhada]
2. **[Nome da Carta 2]**: [Interpretação detalhada]
[Continue para todas as 9 cartas]

**Como as Cartas Trabalham Juntas**
[Parágrafo explicando a sinergia entre as cartas e a mensagem unificada]

**Insights Práticos e Orientação**
• [Insight prático 1]
• [Insight prático 2]
• [Insight prático 3]

Use **negrito** para títulos, **números** para cartas e **bullet points (•)** para insights.
Seja específico, compassivo e inspirador. Responda em português brasileiro.
"""

    # Lista de modelos para tentar (em ordem de preferência)
    models_to_try = [
        "llama-3.3-70b-versatile",  # Modelo mais recente
        "llama-3.1-70b-versatile",   # Fallback
        "llama-3.1-8b-instant",      # Alternativa mais rápida
        "mixtral-8x7b-32768",        # Alternativa para textos longos
    ]
    
    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "Você é um tarólogo experiente e compassivo que ajuda pessoas através da interpretação de cartas de tarot."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            # Se não for erro de modelo descontinuado, retorna o erro
            error_str = str(e)
            if "decommissioned" not in error_str.lower() and "model" not in error_str.lower():
                return f"Erro ao gerar interpretação: {error_str}. Por favor, tente novamente."
            # Se for erro de modelo, tenta o próximo
            continue
    
    # Se nenhum modelo funcionou
    return f"Erro: Nenhum modelo disponível. Verifique os modelos disponíveis no Groq: https://console.groq.com/docs/models"
