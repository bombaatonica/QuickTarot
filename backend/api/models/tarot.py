from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class Suit(str, Enum):
    WANDS = "Paus"
    CUPS = "Copas"
    SWORDS = "Espadas"
    PENTACLES = "Ouros"


class Card(BaseModel):
    name: str
    suit: Optional[Suit] = None  # None para Arcanos Maiores
    number: Optional[int] = None  # Para Arcanos Menores
    meaning: str
    is_major: bool  # True para Arcanos Maiores


class TarotReading(BaseModel):
    cards: List[Card]
    interpretation: str
    question: str


# Deck completo de 78 cartas de tarot
TAROT_DECK = [
    # Arcanos Maiores (22 cartas)
    Card(name="O Louco", meaning="Novos começos, espontaneidade, liberdade", is_major=True),
    Card(name="O Mago", meaning="Vontade, poder, manifestação", is_major=True),
    Card(name="A Sacerdotisa", meaning="Intuição, mistério, conhecimento oculto", is_major=True),
    Card(name="A Imperatriz", meaning="Fertilidade, natureza, abundância", is_major=True),
    Card(name="O Imperador", meaning="Autoridade, estrutura, controle", is_major=True),
    Card(name="O Hierofante", meaning="Tradição, espiritualidade, ensinamentos", is_major=True),
    Card(name="Os Amantes", meaning="Amor, relacionamentos, escolhas", is_major=True),
    Card(name="O Carro", meaning="Determinação, controle, vitória", is_major=True),
    Card(name="A Força", meaning="Força interior, paciência, compaixão", is_major=True),
    Card(name="O Eremita", meaning="Introspecção, busca interior, orientação", is_major=True),
    Card(name="A Roda da Fortuna", meaning="Ciclos, mudanças, destino", is_major=True),
    Card(name="A Justiça", meaning="Equilíbrio, verdade, responsabilidade", is_major=True),
    Card(name="O Enforcado", meaning="Sacrifício, nova perspectiva, rendição", is_major=True),
    Card(name="A Morte", meaning="Transformação, fim de ciclos, renovação", is_major=True),
    Card(name="A Temperança", meaning="Equilíbrio, moderação, cura", is_major=True),
    Card(name="O Diabo", meaning="Tentação, vício, limitações", is_major=True),
    Card(name="A Torre", meaning="Mudança brusca, libertação, revelação", is_major=True),
    Card(name="A Estrela", meaning="Esperança, inspiração, serenidade", is_major=True),
    Card(name="A Lua", meaning="Ilusão, medos, intuição", is_major=True),
    Card(name="O Sol", meaning="Alegria, sucesso, vitalidade", is_major=True),
    Card(name="O Julgamento", meaning="Reflexão, avaliação, renascimento", is_major=True),
    Card(name="O Mundo", meaning="Completude, realização, jornada concluída", is_major=True),
    
    # Arcanos Menores - Paus (14 cartas: Ás + 2-10 + Página, Cavaleiro, Rainha, Rei)
    Card(name="Ás de Paus", suit=Suit.WANDS, number=1, meaning="Novos projetos, inspiração, potencial", is_major=False),
    Card(name="Dois de Paus", suit=Suit.WANDS, number=2, meaning="Planejamento, futuro, progresso", is_major=False),
    Card(name="Três de Paus", suit=Suit.WANDS, number=3, meaning="Exploração, expansão, liderança", is_major=False),
    Card(name="Quatro de Paus", suit=Suit.WANDS, number=4, meaning="Celebração, harmonia, comunidade", is_major=False),
    Card(name="Cinco de Paus", suit=Suit.WANDS, number=5, meaning="Competição, conflito, desafios", is_major=False),
    Card(name="Seis de Paus", suit=Suit.WANDS, number=6, meaning="Vitória, reconhecimento, sucesso", is_major=False),
    Card(name="Sete de Paus", suit=Suit.WANDS, number=7, meaning="Desafio, competição, perseverança", is_major=False),
    Card(name="Oito de Paus", suit=Suit.WANDS, number=8, meaning="Ação rápida, progresso, movimento", is_major=False),
    Card(name="Nove de Paus", suit=Suit.WANDS, number=9, meaning="Resiliência, persistência, força interior", is_major=False),
    Card(name="Dez de Paus", suit=Suit.WANDS, number=10, meaning="Sobrecarga, responsabilidades, pressão", is_major=False),
    Card(name="Página de Paus", suit=Suit.WANDS, number=11, meaning="Mensagens, novas ideias, entusiasmo", is_major=False),
    Card(name="Cavaleiro de Paus", suit=Suit.WANDS, number=12, meaning="Ação, aventura, impulso", is_major=False),
    Card(name="Rainha de Paus", suit=Suit.WANDS, number=13, meaning="Confiança, independência, determinação", is_major=False),
    Card(name="Rei de Paus", suit=Suit.WANDS, number=14, meaning="Liderança, visão, inspiração", is_major=False),
    
    # Arcanos Menores - Copas (14 cartas)
    Card(name="Ás de Copas", suit=Suit.CUPS, number=1, meaning="Novos sentimentos, amor, emoções", is_major=False),
    Card(name="Dois de Copas", suit=Suit.CUPS, number=2, meaning="União, parceria, conexão", is_major=False),
    Card(name="Três de Copas", suit=Suit.CUPS, number=3, meaning="Amizade, celebração, comunidade", is_major=False),
    Card(name="Quatro de Copas", suit=Suit.CUPS, number=4, meaning="Apatia, contemplação, introspecção", is_major=False),
    Card(name="Cinco de Copas", suit=Suit.CUPS, number=5, meaning="Perda, pesar, foco no negativo", is_major=False),
    Card(name="Seis de Copas", suit=Suit.CUPS, number=6, meaning="Nostalgia, memórias, inocência", is_major=False),
    Card(name="Sete de Copas", suit=Suit.CUPS, number=7, meaning="Ilusões, escolhas, fantasias", is_major=False),
    Card(name="Oito de Copas", suit=Suit.CUPS, number=8, meaning="Abandono, busca interior, desapego", is_major=False),
    Card(name="Nove de Copas", suit=Suit.CUPS, number=9, meaning="Satisfação, gratidão, contentamento", is_major=False),
    Card(name="Dez de Copas", suit=Suit.CUPS, number=10, meaning="Felicidade, harmonia, completude", is_major=False),
    Card(name="Página de Copas", suit=Suit.CUPS, number=11, meaning="Criatividade, intuição, novos sentimentos", is_major=False),
    Card(name="Cavaleiro de Copas", suit=Suit.CUPS, number=12, meaning="Romance, charme, idealismo", is_major=False),
    Card(name="Rainha de Copas", suit=Suit.CUPS, number=13, meaning="Compaixão, empatia, intuição emocional", is_major=False),
    Card(name="Rei de Copas", suit=Suit.CUPS, number=14, meaning="Sabedoria emocional, controle, diplomacia", is_major=False),
    
    # Arcanos Menores - Espadas (14 cartas)
    Card(name="Ás de Espadas", suit=Suit.SWORDS, number=1, meaning="Clareza mental, verdade, novos pensamentos", is_major=False),
    Card(name="Dois de Espadas", suit=Suit.SWORDS, number=2, meaning="Decisão difícil, equilíbrio, escolha", is_major=False),
    Card(name="Três de Espadas", suit=Suit.SWORDS, number=3, meaning="Coração partido, tristeza, dor emocional", is_major=False),
    Card(name="Quatro de Espadas", suit=Suit.SWORDS, number=4, meaning="Descanso, recuperação, reflexão", is_major=False),
    Card(name="Cinco de Espadas", suit=Suit.SWORDS, number=5, meaning="Conflito, traição, derrota", is_major=False),
    Card(name="Seis de Espadas", suit=Suit.SWORDS, number=6, meaning="Transição, mudança, viagem", is_major=False),
    Card(name="Sete de Espadas", suit=Suit.SWORDS, number=7, meaning="Engano, estratégia, cautela", is_major=False),
    Card(name="Oito de Espadas", suit=Suit.SWORDS, number=8, meaning="Restrições, limitações, prisão mental", is_major=False),
    Card(name="Nove de Espadas", suit=Suit.SWORDS, number=9, meaning="Ansiedade, pesadelos, preocupação", is_major=False),
    Card(name="Dez de Espadas", suit=Suit.SWORDS, number=10, meaning="Traição, fim doloroso, derrota", is_major=False),
    Card(name="Página de Espadas", suit=Suit.SWORDS, number=11, meaning="Curiosidade, novas ideias, comunicação", is_major=False),
    Card(name="Cavaleiro de Espadas", suit=Suit.SWORDS, number=12, meaning="Ação rápida, impulso, decisão", is_major=False),
    Card(name="Rainha de Espadas", suit=Suit.SWORDS, number=13, meaning="Clareza, independência, comunicação direta", is_major=False),
    Card(name="Rei de Espadas", suit=Suit.SWORDS, number=14, meaning="Autoridade, lógica, verdade", is_major=False),
    
    # Arcanos Menores - Ouros (14 cartas)
    Card(name="Ás de Ouros", suit=Suit.PENTACLES, number=1, meaning="Novas oportunidades, prosperidade, potencial", is_major=False),
    Card(name="Dois de Ouros", suit=Suit.PENTACLES, number=2, meaning="Equilíbrio, prioridades, multitarefa", is_major=False),
    Card(name="Três de Ouros", suit=Suit.PENTACLES, number=3, meaning="Colaboração, trabalho em equipe, habilidade", is_major=False),
    Card(name="Quatro de Ouros", suit=Suit.PENTACLES, number=4, meaning="Segurança, controle, apego material", is_major=False),
    Card(name="Cinco de Ouros", suit=Suit.PENTACLES, number=5, meaning="Preocupação material, pobreza, isolamento", is_major=False),
    Card(name="Seis de Ouros", suit=Suit.PENTACLES, number=6, meaning="Generosidade, compartilhamento, caridade", is_major=False),
    Card(name="Sete de Ouros", suit=Suit.PENTACLES, number=7, meaning="Trabalho duro, perseverança, investimento", is_major=False),
    Card(name="Oito de Ouros", suit=Suit.PENTACLES, number=8, meaning="Habilidade, mestria, dedicação", is_major=False),
    Card(name="Nove de Ouros", suit=Suit.PENTACLES, number=9, meaning="Independência, autossuficiência, luxo", is_major=False),
    Card(name="Dez de Ouros", suit=Suit.PENTACLES, number=10, meaning="Riqueza, família, legado", is_major=False),
    Card(name="Página de Ouros", suit=Suit.PENTACLES, number=11, meaning="Novas oportunidades, aprendizado, manifestação", is_major=False),
    Card(name="Cavaleiro de Ouros", suit=Suit.PENTACLES, number=12, meaning="Trabalho, responsabilidade, eficiência", is_major=False),
    Card(name="Rainha de Ouros", suit=Suit.PENTACLES, number=13, meaning="Pragmatismo, segurança, generosidade", is_major=False),
    Card(name="Rei de Ouros", suit=Suit.PENTACLES, number=14, meaning="Abundância, negócios, segurança financeira", is_major=False),
]
