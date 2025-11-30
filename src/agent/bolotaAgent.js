import intentDetector from './intentDetector.js';
import stateManager from './stateManager.js';
import toolsRegistry from './toolsRegistry.js';

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
        payload = await this._handleAvailability(sessionId);
        break;

      default:
        payload = this._handleUnknown();
        break;
    }

    return {
      ...payload,
      intent
    };
  }

  _handleGreetings() {
    return {
      reply:
        'Oi! Eu sou o Bolota, seu agente de apoio em medicamentos veterinários. 🐾\n' +
        'Você pode me perguntar, por exemplo: "Me fale sobre amoxicilina para cães".\n\n' +
        '⚠️ Lembre-se: qualquer medicamento para animais deve ser usado somente com orientação de um médico veterinário.'
    };
  }

  _handleGoodbye() {
    return {
      reply:
        'Obrigado pela conversa! 🐶💊\n' +
        'Se tiver mais dúvidas sobre medicamentos veterinários, é só chamar.\n\n' +
        '⚠️ E não esqueça: sempre consulte um veterinário antes de medicar um animal.'
    };
  }

  _handleHelp() {
    return {
      reply:
        'Eu sou o Bolota, um agente focado em medicamentos veterinários. 🐾\n' +
        'Consigo:\n' +
        '- Buscar estudos científicos no PubMed sobre um medicamento.\n' +
        '- Verificar preço e estoque no nosso sistema local.\n' +
        '- Sempre lembrar da importância da prescrição veterinária.\n\n' +
        'Você pode começar com algo como: "Me fale sobre Simparic para cães".'
    };
  }

  _handleNegate() {
    return {
      reply:
        'Tudo bem, não vou mostrar preço e estoque por enquanto. 😊\n\n' +
        '⚠️ Reforçando: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.'
    };
  }

  _handleAskForMedName() {
    return {
      reply:
        'Claro, posso te ajudar com isso! Me diga o nome do medicamento que você quer saber mais. 🐶📘'
    };
  }

  _handleUnknown() {
    return {
      reply:
        'Desculpe, não entendi muito bem. Pode reformular a frase ou mencionar o nome do medicamento? 🐾'
    };
  }

  async _handleMedicineNameOnly(sessionId, message) {
    const med = message.trim();

    stateManager.setLastMedication(sessionId, med);

    const { step } = stateManager.get(sessionId);

    if (step === 'AWAITING_MED_FOR_AVAILABILITY') {
      stateManager.set(sessionId, { step: null });
      return this._handleAvailability(sessionId);
    }

    const articles = await toolsRegistry.findArticles(med);

    if (!articles.length) {
      return {
        reply:
          `Não encontrei artigos recentes sobre ${med} no PubMed.\n\n` +
          'Mesmo assim, o uso de qualquer medicamento deve ser avaliado por um médico veterinário. 🩺🐾\n\n' +
          'Deseja que eu verifique preço e estoque desse medicamento no sistema local?'
      };
    }

    const a = articles[0];

    const summary =
      a.abstract && a.abstract.length > 300
        ? `${a.abstract.slice(0, 300)}...`
        : a.abstract || 'Resumo não disponível.';

    const reply = [
      `Encontrei informações interessantes sobre ${med}! 🧪🐾`,
      '',
      `Título: ${a.title}`,
      `Revista: ${a.journal || 'Não informado'}`,
      `Autores: ${a.authors?.join(', ') || 'Não informados'}`,
      `Resumo: ${summary}`,
      `Link para leitura completa: ${a.link}`,
      '',
      '⚠️ Lembre-se: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.',
      '',
      'Deseja ver preço e estoque desse medicamento no nosso sistema local?'
    ].join('\n');

    return { reply };
  }

  async _handleMedicineInfo(sessionId, message) {
    const medMatch = message.toLowerCase().match(/sobre\s+(.+)/);
    const med = medMatch ? medMatch[1].trim() : null;

    if (!med) {
      return this._handleAskForMedName();
    }

    stateManager.setLastMedication(sessionId, med);

    const articles = await toolsRegistry.findArticles(med);

    if (!articles.length) {
      return {
        reply:
          `Não encontrei artigos recentes sobre ${med} no PubMed.\n\n` +
          'Mesmo assim, o uso de qualquer medicamento deve ser avaliado por um médico veterinário. 🩺🐾\n\n' +
          'Deseja que eu verifique preço e estoque desse medicamento no sistema local?'
      };
    }

    const a = articles[0];

    const summary =
      a.abstract && a.abstract.length > 300
        ? `${a.abstract.slice(0, 300)}...`
        : a.abstract || 'Resumo não disponível.';

    const reply = [
      `Encontrei informações interessantes sobre ${med}! 🧪🐾`,
      '',
      `Título: ${a.title}`,
      `Revista: ${a.journal || 'Não informado'}`,
      `Autores: ${a.authors?.join(', ') || 'Não informados'}`,
      `Resumo: ${summary}`,
      `Link para leitura completa: ${a.link}`,
      '',
      '⚠️ Lembre-se: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.',
      '',
      'Deseja ver preço e estoque desse medicamento no nosso sistema local?'
    ].join('\n');

    return { reply };
  }

  async _handleAvailability(sessionId) {
    const med = stateManager.getLastMedication(sessionId);

    if (!med) {
      stateManager.set(sessionId, { step: 'AWAITING_MED_FOR_AVAILABILITY' });

      return {
        reply:
          'Posso consultar preço e estoque, sim! Me diga primeiro o nome do medicamento que você quer verificar. 🐾\n\n' +
          '⚠️ E lembre-se: a decisão de uso é sempre do médico veterinário.'
      };
    }

    stateManager.set(sessionId, { step: null });

    const meds = await toolsRegistry.findMedication(med);

    if (!meds.length) {
      return {
        reply: `Não encontrei **${med}** no nosso inventário local.`
      };
    }

    const item = meds[0];

    if (item.stock === 0) {
      return {
        reply:
          `O medicamento ${item.description} está cadastrado no sistema, mas atualmente está sem estoque. ❌\n\n` +
          '⚠️ Uso somente com prescrição veterinária. Fale com o médico veterinário sobre opções e disponibilidade.'
      };
    }

    const reply = [
      `Aqui está o que encontrei sobre ${item.description}:`,
      '',
      `Preço: R$ ${item.price.toFixed(2)}`,
      `Estoque disponível: ${item.stock} unidade(s)`,
      `Status: ${item.status === 'available' ? 'disponível' : 'indisponível'}`,
      '',
      '⚠️ Lembre-se: este medicamento deve ser utilizado somente com prescrição veterinária.'
    ].join('\n');

    return { reply };
  }
}

export default new BolotaAgent();
