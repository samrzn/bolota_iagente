import axios from 'axios';
import querystring from 'node:querystring';
import loggerHelper from '../../../infra/logger.js';

const PUBMED_BASE_URL = process.env.PUBMED_URL;

class PubMedService {
  constructor() {
    this.baseUrl = PUBMED_BASE_URL;
  }

  async searchIds(query, maxResults = 5) {
    try {
      const url = `${this.baseUrl}/esearch.fcgi`;

      const response = await axios.get(url, {
        params: {
          db: 'pubmed',
          term: query,
          retmode: 'json',
          retmax: maxResults
        },
        paramsSerializer: (params) => querystring.stringify(params)
      });

      const ids = response?.data?.esearchresult?.idlist;
      return Array.isArray(ids) ? ids : [];
    } catch (err) {
      loggerHelper.error('Erro ao buscar IDs no PubMed: %s', err.message, {
        isAxiosError: axios.isAxiosError(err),
        name: err.name,
        stack: err.stack
      });
      return [];
    }
  }

  async fetchDetails(ids = []) {
    if (!ids.length) return [];

    try {
      const url = `${this.baseUrl}/efetch.fcgi`;

      const response = await axios.get(url, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          rettype: 'abstract',
          retmode: 'xml'
        },
        paramsSerializer: (params) => querystring.stringify(params)
      });

      const xml = response.data || '';

      const articles = xml.split('<PubmedArticle>').slice(1);

      return articles.map((articleXml) => ({
        pmid: this.parsePmid(articleXml),
        title: this.parseTitle(articleXml),
        journal: this.parseJournal(articleXml),
        authors: this.parseAuthors(articleXml),
        abstract: this.parseAbstract(articleXml),
        link: this.buildPubMedLink(this.parsePmid(articleXml))
      }));
    } catch (err) {
      loggerHelper.error('Erro ao buscar detalhes no PubMed: %s', err.message, {
        isAxiosError: axios.isAxiosError(err),
        name: err.name,
        stack: err.stack
      });
      return [];
    }
  }
}

const pubMedService = new PubMedService();
export default pubMedService;
