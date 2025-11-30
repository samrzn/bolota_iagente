import intentDetector from './intentDetector.js';
import stateManager from './stateManager.js';
import toolsRegistry from './toolsRegistry.js';

const GENERIC_INFO_TOKENS = new Set([
  'me',
  'fale',
  'falar',
  'sobre',
  'informacao',
  'informações',
  'informacoes',
  'informação',
  'para',
  'que',
  'serve',
  'indicacoes',
  'indicações',
  'de',
  'do',
  'da',
  'uso',
  'o',
  'voce',
  'vc',
  'sabe',
  'saber'
]);

export class BolotaAgent {
  async handle(sessionId, message) {
    const intent = intentDetector.detect(message);

    let payload;

    switch (intent) {
      case 'GREETINGS':
        payload = this._handleGreetings();
        break;

      case 'GOODBYE':
        payload = this._handleGoodbye();
        break;

      case 'HELP':
        payload = this._handleHelp();
        break;

      case 'NEGATE':
        payload = this._handleNegate();
        break;

      case 'ASK_FOR_MED_NAME':
        payload = this._handleAskForMedName();
        break;

      case 'MEDICINE_NAME_ONLY':
        payload = await this._handleMedicineNameOnly(sessionId, message);
        break;

      case 'MEDICINE_INFO':
        payload = await this._handleMedicineInfo(sessionId, message);
        break;

      case 'CHECK_AVAILABILITY':
      case 'CONFIRM':
        payload = await this._handleAvailability(sessionId, message);
        break;

      default:
        payload = this._handleUnknown();
        break;
    }

    const reply = Array.isArray(payload.reply)
      ? payload.reply.join('')
      : payload.reply;

    return {
      ...payload,
      reply,
      intent
    };
  }

  _cleanMedicationName(raw = '') {
    return raw
      .replaceAll(/[^\wÀ-ÿ\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  _getImportantTokens(message = '') {
    const normalized = message
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '');

    const tokens = normalized
      .replaceAll(/[^\w\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);

    return tokens.filter((t) => !GENERIC_INFO_TOKENS.has(t));
  }

  _extractMedicationFromQuestion(message = '') {
    const original = message;
    const lower = original.toLowerCase();

    const importantTokens = this._getImportantTokens(message);
    if (!importantTokens.length) {
      return null;
    }

    const patterns = [
      /sobre\s+(.+)/i,
      /indicac(?:oes|ões) de uso (?:da|de|do|para)?\s+(.+)/i,
      /para que serve\s+[ao]?\s+(.+)/i
    ];

    for (const regex of patterns) {
      const match = regex.exec(lower);
      if (match?.[1]) {
        return this._cleanMedicationName(match[1]);
      }
    }

    const cleaned = original
      .replaceAll(/[^\wÀ-ÿ\s]/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();

    if (!cleaned) return null;

    const tokens = cleaned.split(' ');
    const lastToken = tokens.at(-1);
    return this._cleanMedicationName(lastToken || '');
  }

  _extractMedicationFromAvailabilityQuestion(message = '') {
    if (!message) return null;

    const original = message;
    const lower = original.toLowerCase();

    const patterns = [
      /estoque (?:de|do|da)?\s+(.+)/i,
      /no estoque (?:de|do|da)?\s+(.+)/i,
      /tem no estoque (?:de|do|da)?\s+(.+)/i,
      /pre[cç]o (?:de|do|da)?\s+(.+)/i,
      /qual o pre[cç]o (?:de|do|da)?\s+(.+)/i,
      /valor (?:de|do|da)?\s+(.+)/i,
      /quanto (?:custa|e|é)\s+(?:o|a)?\s+(.+)/i
    ];

    for (const regex of patterns) {
      const match = regex.exec(lower);
      if (match?.[1]) {
        return this._cleanMedicationName(match[1]);
      }
    }

    const importantTokens = this._getImportantTokens(message);
    if (!importantTokens.length) {
      return null;
    }

    const lastImportant = importantTokens.at(-1);
    return this._cleanMedicationName(lastImportant || '');
  }

  _handleGreetings() {
    return {
      reply:
        'Oi! Eu sou o Bolota, seu agente de apoio em medicamentos veterinários. 🐾' +
        "Você pode me perguntar, por exemplo: 'Me fale sobre amoxicilina para cães'." +
        ' ⚠️Lembre-se: qualquer medicamento para animais deve ser usado somente com orientação de um médico veterinário.'
    };
  }

  _handleGoodbye() {
    return {
      reply:
        'Obrigado pela conversa! 🐶💊' +
        'Se tiver mais dúvidas sobre medicamentos veterinários, é só chamar.'
    };
  }

  _handleHelp() {
    return {
      reply:
        'Eu sou o Bolota, um agente focado em medicamentos veterinários. 🐾' +
        ' Buscar estudos científicos no PubMed sobre um medicamento;' +
        ' Verificar preço e estoque no nosso sistema local;' +
        ' Sempre lembrar da importância da prescrição veterinária;' +
        " Você pode começar com algo como: 'Me fale sobre Simparic para cães'."
    };
  }

  _handleNegate() {
    return {
      reply:
        'Tudo bem, não vou mostrar preço e estoque por enquanto. 😊' +
        '⚠️ Reforçando: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.'
    };
  }

  _handleAskForMedName() {
    return {
      reply:
        'Claro, posso te ajudar com isso! Me diga o nome do medicamento que você quer saber mais. 🐶📘' +
        '⚠️ E lembre-se: nunca medique um animal sem orientação de um veterinário.'
    };
  }

  _handleUnknown() {
    return {
      reply:
        'Desculpe, não entendi muito bem. Pode reformular a frase ou mencionar o nome do medicamento? 🐾' +
        '⚠️ E lembre-se: medicamentos veterinários devem ser usados apenas com prescrição de um médico veterinário.'
    };
  }

  async _handleMedicineNameOnly(sessionId, message) {
    const importantTokens = this._getImportantTokens(message);

    if (!importantTokens.length) {
      return this._handleAskForMedName();
    }

    const medRaw = message.trim();
    const med = this._cleanMedicationName(medRaw);

    stateManager.setLastMedication(sessionId, med);

    const { step } = stateManager.get(sessionId);

    if (step === 'AWAITING_MED_FOR_AVAILABILITY') {
      stateManager.set(sessionId, { step: null });
      return this._handleAvailability(sessionId, med);
    }

    const articles = await toolsRegistry.findArticles(med);

    if (!articles.length) {
      return {
        reply:
          `Não encontrei artigos recentes sobre ${med} no PubMed. ` +
          'Mesmo assim, o uso de qualquer medicamento deve ser avaliado por um médico veterinário. 🩺🐾' +
          ' Deseja que eu verifique preço e estoque desse medicamento no sistema local?'
      };
    }

    const a = articles[0];

    const summary =
      a.abstract && a.abstract.length > 300
        ? `${a.abstract.slice(0, 300)}...`
        : a.abstract || 'Resumo não disponível.';

    const replyLines = [
      `Encontrei informações interessantes sobre ${med}! 🧪🐾`,
      '',
      `Título: ${a.title}`,
      ` Revista: ${a.journal + '.' || 'Não informado'}`,
      ` Autores: ${a.authors?.join(', ') + '.' || 'Não informados'}`,
      ` Resumo: ${summary}`,
      ` Link para leitura completa: ${a.link} `,
      '',
      ' ⚠️Lembre-se: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.',
      '',
      ' Deseja ver preço e estoque desse medicamento no nosso sistema local?'
    ];

    return { reply: replyLines.join('') };
  }

  async _handleMedicineInfo(sessionId, message) {
    const med = this._extractMedicationFromQuestion(message);

    if (!med) {
      return this._handleAskForMedName();
    }

    stateManager.setLastMedication(sessionId, med);

    const articles = await toolsRegistry.findArticles(med);

    if (!articles.length) {
      return {
        reply:
          `Não encontrei artigos recentes sobre ${med} no PubMed. ` +
          'Mesmo assim, o uso de qualquer medicamento deve ser avaliado por um médico veterinário. 🩺🐾' +
          ' Deseja que eu verifique preço e estoque desse medicamento no sistema local?'
      };
    }

    const a = articles[0];

    const summary =
      a.abstract && a.abstract.length > 300
        ? `${a.abstract.slice(0, 300)}...`
        : a.abstract || 'Resumo não disponível.';

    const replyLines = [
      `Encontrei informações interessantes sobre ${med}! 🧪🐾`,
      '',
      `Título: ${a.title}`,
      ` Revista: ${a.journal + '.' || 'Não informado'}`,
      ` Autores: ${a.authors?.join(', ') + '.' || 'Não informados'}`,
      ` Resumo: ${summary}`,
      ` Link para leitura completa: ${a.link} `,
      '',
      ' ⚠️Lembre-se: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.',
      '',
      ' Deseja ver preço e estoque desse medicamento no nosso sistema local?'
    ];

    return { reply: replyLines.join('') };
  }

  async _handleAvailability(sessionId, message = '') {
    let med = null;

    const medFromQuestion =
      this._extractMedicationFromAvailabilityQuestion(message);

    if (medFromQuestion) {
      med = medFromQuestion;
      stateManager.setLastMedication(sessionId, medFromQuestion);
    } else {
      med = stateManager.getLastMedication(sessionId);
    }

    if (!med) {
      stateManager.set(sessionId, { step: 'AWAITING_MED_FOR_AVAILABILITY' });

      return {
        reply:
          'Posso consultar preço e estoque, sim! Me diga primeiro o nome do medicamento que você quer verificar. 🐾' +
          '⚠️ E lembre-se: a decisão de uso é sempre do médico veterinário.'
      };
    }

    stateManager.set(sessionId, { step: null });

    const meds = await toolsRegistry.findMedication(med);

    if (!meds.length) {
      return {
        reply:
          `Não encontrei ${med} no nosso inventário local.` +
          '⚠️ Mesmo assim, converse com um veterinário para avaliar alternativas e o tratamento mais adequado.'
      };
    }

    const item = meds[0];

    if (item.stock === 0) {
      return {
        reply:
          `O medicamento ${item.description} está cadastrado no sistema, mas atualmente está sem estoque. ❌` +
          '⚠️ Uso somente com prescrição veterinária. Fale com o médico veterinário sobre opções e disponibilidade.'
      };
    }

    const replyLines = [
      `Aqui está o que encontrei sobre ${item.description}:`,
      '',
      ` Preço: R$ ${item.price.toFixed(2)}.`,
      ` Estoque disponível: ${item.stock} unidade(s).`,
      ` Status: ${item.status === 'available' ? 'disponível' : 'indisponível'}`,
      '',
      ' ⚠️Lembre-se: este medicamento deve ser utilizado somente com prescrição veterinária.'
    ];

    return { reply: replyLines.join('') };
  }
}

export default new BolotaAgent();
