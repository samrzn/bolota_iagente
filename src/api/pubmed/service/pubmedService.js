import axios from 'axios';
import loggerHelper from '../../../infra/logger.js';

export class PubMedService {
  constructor(baseUrl = process.env.PUBMED_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({ timeout: 8000 });
  }

  async searchIds(query, maxResults = 5) {
    if (!query) return [];

    if (!this.baseUrl) {
      loggerHelper.error(
        'PUBMED_URL não configurada. Verifique seu arquivo .env.'
      );
      return [];
    }

    try {
      const url = `${this.baseUrl}/esearch.fcgi`;
      const response = await this.client.get(url, {
        params: {
          db: 'pubmed',
          term: query,
          retmode: 'json',
          retmax: maxResults
        }
      });

      const ids = response?.data?.esearchresult?.idlist;
      return Array.isArray(ids) ? ids : [];
    } catch (err) {
      loggerHelper.error(
        'Erro ao buscar IDs no PubMed: %s',
        err.message || String(err)
      );
      return [];
    }
  }

  async fetchArticleDetails(ids) {
    if (!ids.length) return [];

    if (!this.baseUrl) {
      loggerHelper.error(
        'PUBMED_URL não configurada. Verifique seu arquivo .env.'
      );
      return [];
    }

    try {
      const url = `${this.baseUrl}/efetch.fcgi`;

      const response = await this.client.get(url, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          rettype: 'abstract',
          retmode: 'xml'
        }
      });

      const xml = response.data || '';

      const articles = xml.split('<PubmedArticle>').slice(1);

      return articles.map((articleXml) => {
        const getBetween = (a, b) => {
          const start = articleXml.indexOf(a);
          if (start === -1) return '';
          const end = articleXml.indexOf(b, start + a.length);
          if (end === -1) return '';
          return articleXml.substring(start + a.length, end).trim();
        };

        const idRaw = getBetween('<PMID', '</PMID>');
        const id = idRaw.replace(/.*?>/, '').trim();

        const title = getBetween('<ArticleTitle>', '</ArticleTitle>');
        const journal = getBetween('<Title>', '</Title>');

        const pubdateRaw = getBetween('<PubDate>', '</PubDate>');
        const pubdate = pubdateRaw.replaceAll(/<[^>]+>/g, '').trim();

        const abstractText = getBetween('<AbstractText>', '</AbstractText>');

        const authorsChunks = articleXml.split('<Author>').slice(1);
        const authors = authorsChunks
          .map((chunk) => {
            const last = chunk.match(/<LastName>(.*?)<\/LastName>/);
            const fore = chunk.match(/<ForeName>(.*?)<\/ForeName>/);
            const full = `${fore ? fore[1] : ''} ${last ? last[1] : ''}`.trim();
            return full || null;
          })
          .filter(Boolean);

        return {
          id,
          title: title || 'Título não disponível',
          journal: journal || 'Periódico não informado',
          pubdate: pubdate || '',
          authors,
          abstract: abstractText || 'Resumo não disponível',
          link: id ? `https://pubmed.ncbi.nlm.nih.gov/${id}/` : ''
        };
      });
    } catch (err) {
      loggerHelper.error(
        'Erro ao buscar detalhes no PubMed: %s',
        err.message || String(err)
      );
      return [];
    }
  }

  async searchArticles(query, maxResults = 5) {
    const ids = await this.searchIds(query, maxResults);
    return this.fetchArticleDetails(ids);
  }
}

export default new PubMedService();
