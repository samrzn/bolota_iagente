import intentDetector from './intentDetector.js';
import stateManager from './stateManager.js';
import toolsRegistry from './toolsRegistry.js';

export class BolotaAgent {
  async handle(sessionId, message) {
    const intent = intentDetector.detect(message);

    switch (intent) {
      case 'MEDICINE_INFO':
        return this._handleMedicineInfo(sessionId, message);

      case 'CONFIRM':
        return this._handleConfirm(sessionId);

      default:
        return {
          reply:
            'Desculpe, não entendi muito bem. Pode repetir de outra maneira? 🐾\n\n⚠️ Lembre-se: medicamentos para animais devem ser usados somente com prescrição e orientação de um médico veterinário.'
        };
    }
  }

  async _handleMedicineInfo(sessionId, message) {
    const medMatch = message.toLowerCase().match(/sobre\s+(.+)/);
    const med = medMatch ? medMatch[1] : null;

    if (!med) {
      return {
        reply:
          'Claro! Pode me dizer qual medicamento você gostaria de saber mais? 🐶📘\n\n⚠️ Sempre consulte um veterinário antes de medicar o seu animalzinho.'
      };
    }

    stateManager.setLastMedication(sessionId, med);

    const articles = await toolsRegistry.findArticles(med);

    if (!articles.length) {
      return {
        reply: `Não encontrei artigos recentes sobre **${med}** no PubMed.\n\nQuer verificar preço e estoque no sistema local?`
      };
    }

    const a = articles[0];

    const reply = `
Encontrei informações interessantes sobre **${med}**! 🧪🐾

**• Título:** ${a.title}
**• Revista:** ${a.journal || 'Não informado'}
**• Autores:** ${a.authors.join(', ') || 'Não informado'}
**• Resumo:** ${a.abstract.slice(0, 300)}${a.abstract.length > 300 ? '...' : ''}
**• Link para leitura completa:** ${a.link}

Antes de prosseguirmos, ⚠️ *lembre-se*: qualquer uso de medicamentos em animais deve ser prescrito e orientado por um médico veterinário.

Deseja ver **preço e estoque** no nosso sistema local?
    `.trim();

    return { reply };
  }

  async _handleConfirm(sessionId) {
    const med = stateManager.getLastMedication(sessionId);

    if (!med) {
      return {
        reply: 'Claro! Qual medicamento você deseja consultar? 🐾'
      };
    }

    const meds = await toolsRegistry.findMedication(med);

    if (!meds.length) {
      return {
        reply: `Não encontrei **${med}** no nosso inventário local.⚠️`
      };
    }

    const item = meds[0];

    if (item.stock === 0) {
      return {
        reply: `
O medicamento **${item.description}** está cadastrado no sistema, mas atualmente está **fora de estoque**. ❌

⚠️ Uso somente com indicação e prescrição veterinária.
        `.trim()
      };
    }

    return {
      reply: `
Aqui está o que encontrei sobre **${item.description}**:

💵 **Preço:** R$ ${item.price.toFixed(2)}
📦 **Estoque disponível:** ${item.stock} unidade(s)

⚠️ *Lembre-se:* este medicamento deve ser utilizado **somente com prescrição de profissional veterinário**.
      `.trim()
    };
  }
}

export default new BolotaAgent();
