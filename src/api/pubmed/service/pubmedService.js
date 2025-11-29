import axios from 'axios';
import loggerHelper from '../../../infra/logger.js';

export class PubMedService {
  constructor() {
    this.baseUrl = process.env.PUBMED_URL;
  }

  async searchIds(query) {
    try {
      const url = `${this.baseUrl}/esearch.fcgi`;
      const response = await axios.get(url, {
        params: {
          db: 'pubmed',
          term: query,
          retmode: 'json'
        }
      });

      return response.data.esearchresult.idlist || [];
    } catch (err) {
      loggerHelper.error('Erro ao buscar IDs no PubMed', err);
      return [];
    }
  }

  async fetchArticleDetails(ids) {
    if (!ids.length) return [];

    try {
      const url = `${this.baseUrl}/efetch.fcgi`;

      const response = await axios.get(url, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          rettype: 'abstract',
          retmode: 'xml'
        }
      });

      const xml = response.data;

      const articles = xml.split('<PubMedArticle>').slice(1);

      return articles.map((articleXml) => {
        const getBetween = (a, b) => {
          const start = articleXml.indexOf(a);
          if (start === -1) return '';
          const end = articleXml.indexOf(b, start + a.length);
          return end === -1
            ? ''
            : articleXml.substring(start + a.length, end).trim();
        };

        const id = getBetween('<PMID', '</PMID>').replace(/.*?>/, '');
        const title = getBetween('<ArticleTitle>', '</ArticleTitle>');
        const journal = getBetween('<Title>', '</Title>');
        const pubdate = getBetween('<PubDate>', '</PubDate>').replaceAll(
          /<[^>]+>/g,
          ''
        );
        const abstract = getBetween('<AbstractText>', '</AbstractText>');

        const authorsChunk = articleXml.split('<Author>').slice(1);
        const authors = authorsChunk.map((chunk) => {
          const last = chunk.match(/<LastName>(.*?)<\/LastName>/);
          const fore = chunk.match(/<ForeName>(.*?)<\/ForeName>/);
          return `${fore ? fore[1] : ''} ${last ? last[1] : ''}`.trim();
        });

        return {
          id,
          title,
          journal,
          pubdate,
          authors,
          abstract: abstract || 'Resumo não disponível',
          link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        };
      });
    } catch (err) {
      loggerHelper.error('Erro ao buscar detalhes no PubMed', err);
      return [];
    }
  }

  async searchArticles(query) {
    const ids = await this.searchIds(query);
    return await this.fetchArticleDetails(ids);
  }
}

export default new PubMedService();
