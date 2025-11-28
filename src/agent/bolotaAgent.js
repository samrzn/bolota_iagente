const intentDetector = require('./intentDetector.js');
const stateManager = require('./stateManager.js');
const tools = require('./toolsRegistry.js');

class BolotaAgent {
  async handle(sessionId, message) {
    const intent = intentDetector.detect(message);
    //const session = stateManager.get(sessionId);

    switch (intent) {
      case 'MEDICINE_INFO':
        return this._handleMedicineInfo(sessionId, message);
      case 'CHECK_AVAILABILITY':
        return this._handleCheckAvailability(sessionId, message);
      case 'CONFIRM':
        return this._handleConfirm(sessionId);
      default:
        return {
          text: "Posso ajudar com medicamentos veterinários. Pergunte, por exemplo: 'Me fale sobre Amoxicilina'."
        };
    }
  }

  async _handleMedicineInfo(sessionId, message) {
    const match = message.match(/sobre\s+([\w-]+)/i);
    const med = match?.[1] ? match[1].toLowerCase() : message.split(' ')[1];
    stateManager.set(sessionId, {
      lastMedication: med,
      step: 'awaiting_confirmation'
    });

    const articles = await tools.findArticles(med);
    const summary = articles.length
      ? articles.map((a) => `- ${a.title} (${a.pubdate})`).join('\n')
      : 'Nenhum estudo encontrado.';
    const text = `A ${med} é um medicamento veterinário. Aqui estão alguns estudos recentes:\n${summary}\nDeseja ver preço e estoque?`;
    return { text, articles };
  }

  async _handleCheckAvailability(sessionId, message) {
    const session = stateManager.get(sessionId);
    const med = session.lastMedication || (message || '').trim();
    if (!med) {
      return {
        text: 'Qual medicamento você deseja consultar (ex: Amoxicilina)?'
      };
    }
    const items = await tools.findMedication(med);
    if (!items || items.length === 0) {
      return { text: `Não encontrei ${med} no inventário local.` };
    }
    const item = items[0];
    const text = `Produto: ${item.description}\nPreço: R$ ${item.price}\nEstoque: ${item.stock}\n⚠️ Uso somente com prescrição veterinária.`;
    return { text, item };
  }

  async _handleConfirm(sessionId) {
    const session = stateManager.get(sessionId);
    if (!session.lastMedication) {
      return { text: 'Sobre qual medicamento você quer a confirmação?' };
    }
    const items = await tools.findMedication(session.lastMedication);
    if (!items || items.length === 0) {
      return {
        text: `Não encontrei ${session.lastMedication} no inventário local.`
      };
    }
    const item = items[0];
    const text = `Produto: ${item.description}\nPreço: R$ ${item.price}\nEstoque: ${item.stock}\n⚠️ Uso somente com prescrição veterinária.`;
    return { text, item };
  }
}

module.exports = new BolotaAgent();
