class IntentDetector {
  constructor() {
    this.intents = {
      MEDICINE_INFO: {
        keywords: [
          'falar sobre',
          'me fale',
          'informação',
          'explicar',
          'para que serve',
          'indicação',
          'uso',
          'efeito',
          'o que é',
          'sobre'
        ],
        stems: ['medic', 'remed', 'tratament', 'us', 'indic']
      },

      CHECK_AVAILABILITY: {
        keywords: [
          'estoque',
          'preço',
          'valor',
          'tem disponível',
          'tem ai',
          'disponível'
        ],
        stems: ['estoq', 'prec', 'val', 'cust']
      },

      CONFIRM: {
        keywords: ['sim', 'claro', 'quero', 'pode', 'ok', 'manda'],
        stems: ['sim', 'confirm']
      },

      NEGATE: {
        keywords: [
          'não',
          'nao',
          'negativo',
          'prefiro que não',
          'deixa pra depois'
        ],
        stems: ['nao', 'n']
      },

      GREETINGS: {
        keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'],
        stems: ['oi', 'ola']
      },

      GOODBYE: {
        keywords: ['tchau', 'até mais', 'valeu', 'obrigado', 'agradeço'],
        stems: ['tch', 'brig']
      },

      HELP: {
        keywords: [
          'ajuda',
          'como funciona',
          'o que você faz',
          'o que pode fazer'
        ],
        stems: ['ajud', 'func']
      }
    };
  }

  normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .replaceAll(/[^\w\s]/g, '')
      .trim();
  }

  tokenize(text) {
    return this.normalize(text).split(/\s+/g);
  }

  stem(word) {
    return word.slice(0, 4);
  }

  scoreIntent(tokens, intent) {
    const cfg = this.intents[intent];
    let score = 0;

    for (const token of tokens) {
      const stem = this.stem(token);

      if (cfg.keywords.some((k) => token.includes(k))) score += 2;

      if (cfg.stems.some((s) => stem.startsWith(s))) score += 1;
    }

    return score;
  }

  detect(text) {
    const tokens = this.tokenize(text);

    let bestIntent = 'UNKNOWN';
    let bestScore = 0;

    for (const intent of Object.keys(this.intents)) {
      const score = this.scoreIntent(tokens, intent);
      if (score > bestScore) {
        bestIntent = intent;
        bestScore = score;
      }
    }

    if (bestIntent === 'MEDICINE_INFO') {
      const match = text.match(/sobre\s+(.+)/i);
      if (!match) {
        return 'ASK_FOR_MED_NAME';
      }
    }

    if (bestScore === 0) return 'UNKNOWN';

    return bestIntent;
  }
}

export default new IntentDetector();
