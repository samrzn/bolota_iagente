import intentDetector from './intentDetector.js';
import stateManager from './stateManager.js';
import toolsRegistry from './toolsRegistry.js';

export class BolotaAgent {
  async handle(sessionId, message) {
    const intent = intentDetector.detect(message);

    switch (intent) {
      case 'GREETINGS':
        return this._handleGreetings();

      case 'GOODBYE':
        return this._handleGoodbye();

      case 'HELP':
        return this._handleHelp();

      case 'NEGATE':
        return this._handleNegate();

      case 'ASK_FOR_MED_NAME':
        return this._handleAskForMedName();

      case 'MEDICINE_INFO':
        return this._handleMedicineInfo(sessionId, message);

      case 'CHECK_AVAILABILITY':
      case 'CONFIRM':
        return this._handleAvailability(sessionId);

      default:
        return this._handleUnknown();
    }
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
        '• buscar estudos científicos no PubMed sobre um medicamento;\n' +
        '• verificar preço e estoque no nosso sistema local;\n' +
        '• sempre lembrar da importância da prescrição veterinária.\n\n' +
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
        'Claro, posso te ajudar com isso! Me diga o nome do medicamento que você quer saber mais. 🐶📘\n\n'
    };
  }

  _handleUnknown() {
    return {
      reply:
        'Desculpe, não entendi muito bem. Pode reformular a frase ou mencionar o nome do medicamento? 🐾\n\n'
    };
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
          `Não encontrei artigos recentes sobre **${med}** no PubMed.\n\n` +
          'Mesmo assim, o uso de qualquer medicamento deve ser avaliado por um médico veterinário. 🩺🐾\n\n' +
          'Deseja que eu verifique **preço e estoque** desse medicamento no sistema local?'
      };
    }

    const a = articles[0];

    const summary =
      a.abstract && a.abstract.length > 300
        ? `${a.abstract.slice(0, 300)}...`
        : a.abstract || 'Resumo não disponível.';

    const reply = `
Encontrei informações interessantes sobre **${med}**! 🧪🐾

**• Título:** ${a.title}
**• Revista:** ${a.journal || 'Não informado'}
**• Autores:** ${a.authors?.join(', ') || 'Não informados'}
**• Resumo:** ${summary}
**• Link para leitura completa:** ${a.link}

⚠️ Lembre-se: qualquer uso de medicamentos em animais deve ser orientado por um médico veterinário.

Deseja ver **preço e estoque** desse medicamento no nosso sistema local?
    `.trim();

    return { reply };
  }

  async _handleAvailability(sessionId) {
    const med = stateManager.getLastMedication(sessionId);

    if (!med) {
      return {
        reply:
          'Posso consultar preço e estoque, sim! Me diga primeiro o nome do medicamento que você quer verificar. 🐾\n\n'
      };
    }

    const meds = await toolsRegistry.findMedication(med);

    if (!meds.length) {
      return {
        reply:
          `Não encontrei **${med}** no nosso inventário local.\n\n` +
          '⚠️ Mesmo assim, converse com um veterinário para avaliar alternativas e tratamento adequado.'
      };
    }

    const item = meds[0];

    if (item.stock === 0) {
      return {
        reply: `
O medicamento **${item.description}** está cadastrado no sistema, mas atualmente está **fora de estoque**. ❌

⚠️ Uso somente com prescrição veterinária. Fale com o médico veterinário sobre opções e disponibilidade.
        `.trim()
      };
    }

    return {
      reply: `
Aqui está o que encontrei sobre **${item.description}**:

💵 **Preço:** R$ ${item.price.toFixed(2)}
📦 **Estoque disponível:** ${item.stock} unidade(s)
📊 **Status:** ${item.status === 'available' ? 'disponível' : 'indisponível'}

⚠️ Lembre-se: este medicamento deve ser utilizado **somente com prescrição veterinária**.
      `.trim()
    };
  }
}

export default new BolotaAgent();
