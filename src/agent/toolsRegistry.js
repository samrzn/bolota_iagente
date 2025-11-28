import axios from 'axios';
import loggerHelper from '../infra/logger.js';

class ToolsRegistry {
  constructor({
    pubmedUrl = process.env.PUBMED_URL,
    medsUrl = process.env.MEDS_URL,
    timeout = 5000
  } = {}) {
    this.pubmedUrl = pubmedUrl;
    this.medsUrl = medsUrl;
    this.client = axios.create({ timeout });
  }

  async findArticles(term) {
    try {
      const res = await this.client.get(`${this.pubmedUrl}/esearch.fcgi`, {
        params: { db: 'pubmed', retmode: 'json', retmax: 3, term }
      });
      const ids = res.data?.esearchresult?.idlist || [];
      if (!ids.length) return [];
      const sumRes = await this.client.get(`${this.pubmedUrl}/esummary.fcgi`, {
        params: { db: 'pubmed', retmode: 'json', id: ids.join(',') }
      });
      const result = sumRes.data?.result || {};
      return ids.map((id) => {
        const item = result[id] || {};
        return {
          id,
          title: item.title,
          authors: (item.authors || []).map((a) => a.name),
          pubdate: item.pubdate,
          link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        };
      });
    } catch (err) {
      loggerHelper.warn('ToolsRegistry.findArticles failed: %s', err.message);
      return [];
    }
  }

  async findMedication(term) {
    try {
      const res = await this.client.get(this.medsUrl, {
        params: { query: term }
      });
      return res.data?.items || [];
    } catch (err) {
      loggerHelper.warn('ToolsRegistry.findMedication failed: %s', err.message);
      return [];
    }
  }
}

export default new ToolsRegistry();
