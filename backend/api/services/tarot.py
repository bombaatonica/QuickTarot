import random
from typing import List
from ..models.tarot import Card, TAROT_DECK


def draw_cards(count: int = 9) -> List[Card]:
    """
    Sorteia 'count' cartas aleatórias do deck de tarot
    """
    if count > len(TAROT_DECK):
        count = len(TAROT_DECK)
    
    drawn_cards = random.sample(TAROT_DECK, count)
    return drawn_cards


def format_cards_for_llm(cards: List[Card]) -> str:
    """
    Formata as cartas em uma string legível para o LLM
    """
    formatted = []
    for i, card in enumerate(cards, 1):
        card_info = f"{i}. {card.name}"
        if card.suit:
            card_info += f" ({card.suit.value})"
        card_info += f" - {card.meaning}"
        formatted.append(card_info)
    
    return "\n".join(formatted)
