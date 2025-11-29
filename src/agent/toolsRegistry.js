import axios from 'axios';
import loggerHelper from '../infra/logger.js';

export class ToolsRegistry {
  constructor() {
    this.medsApiUrl = process.env.MEDS_URL;
    this.pubmedApiUrl = process.env.PUBMED_INTERNAL_URL;
  }

  async findArticles(query) {
    try {
      const response = await axios.get(this.pubmedApiUrl, {
        params: { query }
      });
      return response.data.items || [];
    } catch (err) {
      loggerHelper.error('Erro ao buscar artigos no PubMed', err);
      return [];
    }
  }

  async findMedication(query) {
    try {
      const response = await axios.get(this.medsApiUrl, { params: { query } });
      return response.data.items || [];
    } catch (err) {
      loggerHelper.error(
        'Erro ao buscar medicamento na base de dados local',
        err
      );
      return [];
    }
  }
}

export default new ToolsRegistry();
