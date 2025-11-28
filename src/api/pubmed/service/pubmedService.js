const axios = require('axios');
const loggerInfo = require('../infra/logger.js');

class PubMedService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.PUBMED_URL;
  }

  async search(term, maxResults = 3) {
    if (!term) return [];
    try {
      const esearch = `${this.baseUrl}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(term)}`;
      const sRes = await axios.get(esearch);
      const ids = sRes.data?.esearchresult?.idlist || [];
      if (!ids.length) return [];

      const summary = `${this.baseUrl}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
      const sumRes = await axios.get(summary);
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
      loggerInfo.error('PubMedService.search error: %s', err.message);
      return [];
    }
  }
}

module.exports = PubMedService;
