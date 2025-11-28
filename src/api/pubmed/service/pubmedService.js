import axios from 'axios';
import loggerHelper from '../../../infra/logger.js';

export default class PubMedService {
  constructor(baseUrl = process.env.PUBMED_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({ timeout: 5000 });
  }

  async search(term, maxResults = 3) {
    if (!term) return [];
    try {
      const esearch = `${this.baseUrl}/esearch.fcgi`;
      const sRes = await this.client.get(esearch, {
        params: { db: 'pubmed', retmode: 'json', retmax: maxResults, term }
      });
      const ids = sRes.data?.esearchresult?.idlist || [];
      if (!ids.length) return [];
      const summary = `${this.baseUrl}/esummary.fcgi`;
      const sumRes = await this.client.get(summary, {
        params: { db: 'pubmed', retmode: 'json', id: ids.join(',') }
      });
      const result = sumRes.data?.result || {};
      return ids.map((id) => {
        const item = result[id] || {};
        return {
          id,
          title: item.title,
          authors: (item.authors || []).map((a) => a.name),
          source: item.source,
          pubdate: item.pubdate,
          link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        };
      });
    } catch (err) {
      loggerHelper.warn('PubMedService.search failed: %s', err.message);
      return [];
    }
  }
}
