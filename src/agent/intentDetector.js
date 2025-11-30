class IntentDetector {
  constructor() {
    this.config = {
      MEDICINE_INFO: {
        keywords: [
          'me fale sobre',
          'falar sobre',
          'informação',
          'explicar',
          'para que serve',
          'o que é',
          'sobre',
          'indicação',
          'indicações de uso',
          'preciso saber',
          'uso'
        ],
        stems: ['medic', 'remed', 'trat', 'us', 'indic']
      },
      CHECK_AVAILABILITY: {
        keywords: [
          'estoque',
          'preço',
          'preco',
          'valor',
          'tem disponível',
          'tem disponivel',
          'tem ai',
          'disponível',
          'disponivel'
        ],
        stems: ['estoq', 'prec', 'val', 'dispon']
      }
    };
  }

  normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .replaceAll(/[^\w\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  tokenize(text) {
    const norm = this.normalize(text);
    if (!norm) return [];
    return norm.split(' ');
  }

  stem(word) {
    return word.slice(0, 4);
  }

  isGreetings(norm) {
    return /^(oi|ola|olá|bom dia|boa tarde|boa noite)\b/.test(norm);
  }

  isGoodbye(norm) {
    return /(tchau|ate mais|até mais|valeu|obrigado|brigado)$/.test(norm);
  }

  isHelp(norm) {
    return /(ajuda|como funciona|o que voce faz|o que você faz|o q vc faz)/.test(
      norm
    );
  }

  isNegate(norm) {
    return /^(nao|não|prefiro que nao|prefiro que não|deixa pra depois)/.test(
      norm
    );
  }

  isConfirm(norm) {
    const trimmed = norm.trim();
    return /^(sim|claro|ok|pode|yes|isso|quero|por favor)\b/.test(trimmed);
  }

  scoreIntent(tokens, cfg) {
    let score = 0;

    const joined = tokens.join(' ');

    for (const kw of cfg.keywords) {
      if (joined.includes(kw)) {
        score += 3;
      }
    }

    for (const token of tokens) {
      const st = this.stem(token);
      if (cfg.stems.some((s) => st.startsWith(s))) {
        score += 1;
      }
    }

    return score;
  }

  detect(text) {
    const norm = this.normalize(text);
    const tokens = this.tokenize(text);

    if (!tokens.length) return 'UNKNOWN';

    if (this.isGreetings(norm)) return 'GREETINGS';
    if (this.isGoodbye(norm)) return 'GOODBYE';
    if (this.isHelp(norm)) return 'HELP';
    if (this.isNegate(norm)) return 'NEGATE';
    if (this.isConfirm(norm)) return 'CONFIRM';

    let bestIntent = 'UNKNOWN';
    let bestScore = 0;

    const candidates = ['MEDICINE_INFO', 'CHECK_AVAILABILITY'];

    for (const intent of candidates) {
      const cfg = this.config[intent];
      const score = this.scoreIntent(tokens, cfg);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    if (bestScore > 0) {
      return bestIntent;
    }

    if (tokens.length <= 2) {
      return 'MEDICINE_NAME_ONLY';
    }

    return 'UNKNOWN';
  }
}

export default new IntentDetector();
