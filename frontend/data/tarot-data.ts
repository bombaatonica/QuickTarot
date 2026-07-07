// Dados das cartas Tarot baseados no repositório tarot-json
// Mapeamento para português e URLs das imagens

export interface TarotCardData {
  id: string;
  name: string;
  namePt: string;
  suit?: string;
  suitPt?: string;
  meaning: string;
  is_major: boolean;
  image_url: string;
}

// Mapeamento das cartas com nomes em português e inglês
export const tarotCardsData: TarotCardData[] = [
  // Arcanos Maiores (m00-m21)
  { id: '0', name: 'Fool', namePt: 'O Louco', is_major: true, meaning: 'Início, aventura, liberdade', image_url: '/tarot-cards/m00.jpg' },
  { id: '1', name: 'Magician', namePt: 'O Mago', is_major: true, meaning: 'Manifestação, poder, criação', image_url: '/tarot-cards/m01.jpg' },
  { id: '2', name: 'High Priestess', namePt: 'A Sacerdotisa', is_major: true, meaning: 'Intuição, mistério, sabedoria interior', image_url: '/tarot-cards/m02.jpg' },
  { id: '3', name: 'Empress', namePt: 'A Imperatriz', is_major: true, meaning: 'Abundância, fertilidade, criatividade', image_url: '/tarot-cards/m03.jpg' },
  { id: '4', name: 'Emperor', namePt: 'O Imperador', is_major: true, meaning: 'Autoridade, estrutura, controle', image_url: '/tarot-cards/m04.jpg' },
  { id: '5', name: 'Hierophant', namePt: 'O Hierofante', is_major: true, meaning: 'Tradição, espiritualidade, conformidade', image_url: '/tarot-cards/m05.jpg' },
  { id: '6', name: 'Lovers', namePt: 'Os Amantes', is_major: true, meaning: 'Escolha, relacionamento, harmonia', image_url: '/tarot-cards/m06.jpg' },
  { id: '7', name: 'Chariot', namePt: 'O Carro', is_major: true, meaning: 'Vontade, determinação, sucesso', image_url: '/tarot-cards/m07.jpg' },
  { id: '8', name: 'Strength', namePt: 'A Força', is_major: true, meaning: 'Coragem, compaixão, domínio próprio', image_url: '/tarot-cards/m08.jpg' },
  { id: '9', name: 'Hermit', namePt: 'O Eremita', is_major: true, meaning: 'Introspecção, sabedoria, solitude', image_url: '/tarot-cards/m09.jpg' },
  { id: '10', name: 'Wheel of Fortune', namePt: 'A Roda da Fortuna', is_major: true, meaning: 'Ciclos, destino, mudança', image_url: '/tarot-cards/m10.jpg' },
  { id: '11', name: 'Justice', namePt: 'A Justiça', is_major: true, meaning: 'Equilíbrio, verdade, causa e efeito', image_url: '/tarot-cards/m11.jpg' },
  { id: '12', name: 'Hanged Man', namePt: 'O Enforcado', is_major: true, meaning: 'Sacrifício, nova perspectiva, rendição', image_url: '/tarot-cards/m12.jpg' },
  { id: '13', name: 'Death', namePt: 'A Morte', is_major: true, meaning: 'Transformação, fim, renascimento', image_url: '/tarot-cards/m13.jpg' },
  { id: '14', name: 'Temperance', namePt: 'A Temperança', is_major: true, meaning: 'Equilíbrio, moderação, paciência', image_url: '/tarot-cards/m14.jpg' },
  { id: '15', name: 'Devil', namePt: 'O Diabo', is_major: true, meaning: 'Escravidão, materialismo, tentação', image_url: '/tarot-cards/m15.jpg' },
  { id: '16', name: 'Tower', namePt: 'A Torre', is_major: true, meaning: 'Catástrofe, revelação, mudança drástica', image_url: '/tarot-cards/m16.jpg' },
  { id: '17', name: 'Star', namePt: 'A Estrela', is_major: true, meaning: 'Esperança, inspiração, serenidade', image_url: '/tarot-cards/m17.jpg' },
  { id: '18', name: 'Moon', namePt: 'A Lua', is_major: true, meaning: 'Ilusão, inconsciente, medo', image_url: '/tarot-cards/m18.jpg' },
  { id: '19', name: 'Sun', namePt: 'O Sol', is_major: true, meaning: 'Alegria, sucesso, vitalidade', image_url: '/tarot-cards/m19.jpg' },
  { id: '20', name: 'Judgement', namePt: 'O Julgamento', is_major: true, meaning: 'Renascimento, avaliação, perdão', image_url: '/tarot-cards/m20.jpg' },
  { id: '21', name: 'World', namePt: 'O Mundo', is_major: true, meaning: 'Conclusão, integração, realização', image_url: '/tarot-cards/m21.jpg' },
  
  // Arcanos Menores - Copas (c01-c14)
  { id: 'c1', name: 'Ace of Cups', namePt: 'Ás de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Amor, novos começos, emoção', image_url: '/tarot-cards/c01.jpg' },
  { id: 'c2', name: 'Two of Cups', namePt: 'Dois de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Parceria, conexão, amor mútuo', image_url: '/tarot-cards/c02.jpg' },
  { id: 'c3', name: 'Three of Cups', namePt: 'Três de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Celebração, amizade, comunidade', image_url: '/tarot-cards/c03.jpg' },
  { id: 'c4', name: 'Four of Cups', namePt: 'Quatro de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Apatia, contemplação, reavaliação', image_url: '/tarot-cards/c04.jpg' },
  { id: 'c5', name: 'Five of Cups', namePt: 'Cinco de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Perda, arrependimento, decepção', image_url: '/tarot-cards/c05.jpg' },
  { id: 'c6', name: 'Six of Cups', namePt: 'Seis de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Nostalgia, inocência, memórias felizes', image_url: '/tarot-cards/c06.jpg' },
  { id: 'c7', name: 'Seven of Cups', namePt: 'Sete de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Ilusão, escolha, sonhos', image_url: '/tarot-cards/c07.jpg' },
  { id: 'c8', name: 'Eight of Cups', namePt: 'Oito de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Abandono, jornada, desapego', image_url: '/tarot-cards/c08.jpg' },
  { id: 'c9', name: 'Nine of Cups', namePt: 'Nove de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Satisfação, contentamento, realização', image_url: '/tarot-cards/c09.jpg' },
  { id: 'c10', name: 'Ten of Cups', namePt: 'Dez de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Felicidade, harmonia familiar, realização emocional', image_url: '/tarot-cards/c10.jpg' },
  { id: 'c11', name: 'Page of Cups', namePt: 'Pajem de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Curiosidade, criatividade, mensagens emocionais', image_url: '/tarot-cards/c11.jpg' },
  { id: 'c12', name: 'Knight of Cups', namePt: 'Cavaleiro de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Romance, gestos, aventura emocional', image_url: '/tarot-cards/c12.jpg' },
  { id: 'c13', name: 'Queen of Cups', namePt: 'Rainha de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Intuição, compaixão, controle emocional', image_url: '/tarot-cards/c13.jpg' },
  { id: 'c14', name: 'King of Cups', namePt: 'Rei de Copas', suit: 'Cups', suitPt: 'Copas', is_major: false, meaning: 'Maturidade emocional, controle, compaixão', image_url: '/tarot-cards/c14.jpg' },
  
  // Arcanos Menores - Espadas (s01-s14)
  { id: 's1', name: 'Ace of Swords', namePt: 'Ás de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Clareza, verdade, novo começo', image_url: '/tarot-cards/s01.jpg' },
  { id: 's2', name: 'Two of Swords', namePt: 'Dois de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Decisão difícil, impasse, estagnação', image_url: '/tarot-cards/s02.jpg' },
  { id: 's3', name: 'Three of Swords', namePt: 'Três de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Dor, tristeza, coração partido', image_url: '/tarot-cards/s03.jpg' },
  { id: 's4', name: 'Four of Swords', namePt: 'Quatro de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Descanso, meditação, recuperação', image_url: '/tarot-cards/s04.jpg' },
  { id: 's5', name: 'Five of Swords', namePt: 'Cinco de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Conflito, derrota, vitória vazia', image_url: '/tarot-cards/s05.jpg' },
  { id: 's6', name: 'Six of Swords', namePt: 'Seis de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Transição, jornada, distanciamento', image_url: '/tarot-cards/s06.jpg' },
  { id: 's7', name: 'Seven of Swords', namePt: 'Sete de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Engano, estratégia, fuga', image_url: '/tarot-cards/s07.jpg' },
  { id: 's8', name: 'Eight of Swords', namePt: 'Oito de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Restrição, poder limitado, vitimização', image_url: '/tarot-cards/s08.jpg' },
  { id: 's9', name: 'Nine of Swords', namePt: 'Nove de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Ansiedade, preocupação, pesadelos', image_url: '/tarot-cards/s09.jpg' },
  { id: 's10', name: 'Ten of Swords', namePt: 'Dez de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Fim, ruína, catástrofe', image_url: '/tarot-cards/s10.jpg' },
  { id: 's11', name: 'Page of Swords', namePt: 'Pajem de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Curiosidade, vigilância, novas ideias', image_url: '/tarot-cards/s11.jpg' },
  { id: 's12', name: 'Knight of Swords', namePt: 'Cavaleiro de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Ação, ambição, pressa', image_url: '/tarot-cards/s12.jpg' },
  { id: 's13', name: 'Queen of Swords', namePt: 'Rainha de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Inteligência, independência, verdade', image_url: '/tarot-cards/s13.jpg' },
  { id: 's14', name: 'King of Swords', namePt: 'Rei de Espadas', suit: 'Swords', suitPt: 'Espadas', is_major: false, meaning: 'Autoridade intelectual, comando, verdade', image_url: '/tarot-cards/s14.jpg' },
  
  // Arcanos Menores - Paus (w01-w14)
  { id: 'w1', name: 'Ace of Wands', namePt: 'Ás de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Inspiração, nova oportunidade, energia', image_url: '/tarot-cards/w01.jpg' },
  { id: 'w2', name: 'Two of Wands', namePt: 'Dois de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Planejamento, futuro, decisões', image_url: '/tarot-cards/w02.jpg' },
  { id: 'w3', name: 'Three of Wands', namePt: 'Três de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Progresso, expansão, foresight', image_url: '/tarot-cards/w03.jpg' },
  { id: 'w4', name: 'Four of Wands', namePt: 'Quatro de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Celebração, harmonia, comunidade', image_url: '/tarot-cards/w04.jpg' },
  { id: 'w5', name: 'Five of Wands', namePt: 'Cinco de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Conflito, competição, diversidade', image_url: '/tarot-cards/w05.jpg' },
  { id: 'w6', name: 'Six of Wands', namePt: 'Seis de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Vitória, reconhecimento, sucesso', image_url: '/tarot-cards/w06.jpg' },
  { id: 'w7', name: 'Seven of Wands', namePt: 'Sete de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Defesa, coragem, persistência', image_url: '/tarot-cards/w07.jpg' },
  { id: 'w8', name: 'Eight of Wands', namePt: 'Oito de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Ação rápida, mudança, alinhamento', image_url: '/tarot-cards/w08.jpg' },
  { id: 'w9', name: 'Nine of Wands', namePt: 'Nove de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Resiliência, coragem, persistência', image_url: '/tarot-cards/w09.jpg' },
  { id: 'w10', name: 'Ten of Wands', namePt: 'Dez de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Carga, responsabilidade, esgotamento', image_url: '/tarot-cards/w10.jpg' },
  { id: 'w11', name: 'Page of Wands', namePt: 'Pajem de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Exploração, entusiasmo, liberdade', image_url: '/tarot-cards/w11.jpg' },
  { id: 'w12', name: 'Knight of Wands', namePt: 'Cavaleiro de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Aventura, movimento, impulso', image_url: '/tarot-cards/w12.jpg' },
  { id: 'w13', name: 'Queen of Wands', namePt: 'Rainha de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Carisma, vitalidade, confiança', image_url: '/tarot-cards/w13.jpg' },
  { id: 'w14', name: 'King of Wands', namePt: 'Rei de Paus', suit: 'Wands', suitPt: 'Paus', is_major: false, meaning: 'Liderança, visão, criatividade', image_url: '/tarot-cards/w14.jpg' },
  
  // Arcanos Menores - Ouros (p01-p14)
  { id: 'p1', name: 'Ace of Pentacles', namePt: 'Ás de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Prosperidade, nova oportunidade, manifestação', image_url: '/tarot-cards/p01.jpg' },
  { id: 'p2', name: 'Two of Pentacles', namePt: 'Dois de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Adaptação, mudança, fluxo', image_url: '/tarot-cards/p02.jpg' },
  { id: 'p3', name: 'Three of Pentacles', namePt: 'Três de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Colaboração, trabalho inicial, maestria', image_url: '/tarot-cards/p03.jpg' },
  { id: 'p4', name: 'Four of Pentacles', namePt: 'Quatro de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Segurança, conservação, possessividade', image_url: '/tarot-cards/p04.jpg' },
  { id: 'p5', name: 'Five of Pentacles', namePt: 'Cinco de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Dificuldade, pobreza, isolamento', image_url: '/tarot-cards/p05.jpg' },
  { id: 'p6', name: 'Six of Pentacles', namePt: 'Seis de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Generosidade, caridade, partilha', image_url: '/tarot-cards/p06.jpg' },
  { id: 'p7', name: 'Seven of Pentacles', namePt: 'Sete de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Investimento, paciência, crescimento a longo prazo', image_url: '/tarot-cards/p07.jpg' },
  { id: 'p8', name: 'Eight of Pentacles', namePt: 'Oito de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Aprendizado, habilidade, trabalho artesanal', image_url: '/tarot-cards/p08.jpg' },
  { id: 'p9', name: 'Nine of Pentacles', namePt: 'Nove de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Abundância, independência, luxo', image_url: '/tarot-cards/p09.jpg' },
  { id: 'p10', name: 'Ten of Pentacles', namePt: 'Dez de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Legado, herança, riqueza familiar', image_url: '/tarot-cards/p10.jpg' },
  { id: 'p11', name: 'Page of Pentacles', namePt: 'Pajem de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Manifestação, estudo, aprendizado', image_url: '/tarot-cards/p11.jpg' },
  { id: 'p12', name: 'Knight of Pentacles', namePt: 'Cavaleiro de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Trabalho duro, rotina, eficiência', image_url: '/tarot-cards/p12.jpg' },
  { id: 'p13', name: 'Queen of Pentacles', namePt: 'Rainha de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Cuidado, nutrição, fertilidade', image_url: '/tarot-cards/p13.jpg' },
  { id: 'p14', name: 'King of Pentacles', namePt: 'Rei de Ouros', suit: 'Pentacles', suitPt: 'Ouros', is_major: false, meaning: 'Prosperidade, segurança, mestre do mundo material', image_url: '/tarot-cards/p14.jpg' }
];

// Índice por nome (lowercase) construído uma única vez — evita busca linear a cada carta renderizada
const cardsByNamePt = new Map<string, TarotCardData>(
  tarotCardsData.map(card => [card.namePt.toLowerCase(), card])
);

// Função para mapear nome da carta em português para os dados completos
export function getTarotCardByNamePt(namePt: string): TarotCardData | undefined {
  return cardsByNamePt.get(namePt.toLowerCase());
}

// Função para obter imagem da carta pelo nome em português
export function getTarotCardImageUrl(namePt: string): string {
  const card = getTarotCardByNamePt(namePt);
  return card ? card.image_url : '';
}
