import axios from 'axios';
import loggerHelper from '../infra/logger.js';

export class ToolsRegistry {
  constructor() {
    this.medsApiUrl = process.env.MEDS_URL;
    this.pubmedApiUrl = process.env.PUBMED_INTERNAL_URL;
  }

  async findArticles(query) {
    try {
      loggerHelper.info('ToolsRegistry.findArticles called', {
        query,
        url: this.pubmedApiUrl
      });

      const response = await axios.get(this.pubmedApiUrl, {
        params: { query }
      });

      const rawItems = response.data.items || [];

      const items = rawItems.map((item) => {
        const abstractFromItem =
          typeof item.abstract === 'string' && item.abstract.trim().length > 0
            ? item.abstract
            : null;

        const summaryFromItem =
          typeof item.summary === 'string' && item.summary.trim().length > 0
            ? item.summary
            : null;

        let finalAbstract = '';

        if (abstractFromItem) {
          finalAbstract = abstractFromItem;
        } else if (summaryFromItem) {
          finalAbstract = summaryFromItem;
        }

        return {
          ...item,
          abstract: finalAbstract
        };
      });

      loggerHelper.info('ToolsRegistry.findArticles success', {
        query,
        count: items.length
      });

      return items;
    } catch (err) {
      loggerHelper.error('Erro ao buscar artigos', {
        query,
        url: this.pubmedApiUrl,
        error: err.message || String(err)
      });
      return [];
    }
  }

  async findMedication(query) {
    try {
      loggerHelper.info('ToolsRegistry.findMedication called', {
        query,
        url: this.medsApiUrl
      });

      const response = await axios.get(this.medsApiUrl, {
        params: { query }
      });

      const items = response.data.items || [];

      loggerHelper.info('ToolsRegistry.findMedication success', {
        query,
        count: items.length
      });

      return items;
    } catch (err) {
      loggerHelper.error('Erro ao buscar medicamento na base de dados local', {
        query,
        url: this.medsApiUrl,
        error: err.message || String(err)
      });
      return [];
    }
  }
}

export default new ToolsRegistry();
