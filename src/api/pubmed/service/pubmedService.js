import axios from 'axios';
import loggerHelper from '../../../infra/logger.js';

const PUBMED_BASE_URL = process.env.PUBMED_URL;

class PubMedService {
  /**
   * @param {import('axios').AxiosInstance | typeof axios} httpClient
   */
  constructor(httpClient = axios) {
    this.http = httpClient;
  }

  /**
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<Array>}
   */
  async searchArticles(query, maxResults = 5) {
    loggerHelper.info('PubMedService.searchArticles called', {
      query,
      maxResults
    });

    const trimmedQuery = (query || '').trim();

    if (!trimmedQuery) {
      loggerHelper.warn('PubMedService.searchArticles called with empty query');
      return [];
    }

    try {
      const ids = await this.searchIds(trimmedQuery, maxResults);

      if (!ids.length) {
        loggerHelper.info('PubMedService.searchArticles: no IDs found', {
          query: trimmedQuery
        });
        return [];
      }

      const articles = await this.fetchDetails(ids);
      loggerHelper.info('PubMedService.searchArticles success', {
        query: trimmedQuery,
        count: articles.length
      });

      return articles;
    } catch (error) {
      loggerHelper.error('Erro ao buscar artigos no PubMed', {
        message: error.message,
        isAxiosError: !!error.isAxiosError,
        stack: error.stack
      });
      return [];
    }
  }

  /**
   * @private
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<string[]>}
   */
  async searchIds(query, maxResults) {
    loggerHelper.info('PubMedService.searchIds called', { query, maxResults });

    const params = {
      db: 'pubmed',
      term: query,
      retmode: 'json',
      retmax: maxResults,
      sort: 'pub+date'
    };

    const response = await this.http.get(`${PUBMED_BASE_URL}/esearch.fcgi`, {
      params
    });

    const idList =
      response?.data?.esearchresult?.idlist &&
      Array.isArray(response.data.esearchresult.idlist)
        ? response.data.esearchresult.idlist
        : [];

    const ids = idList
      .map((id) => String(id || '').trim())
      .filter((id) => id.length > 0);

    loggerHelper.info('PubMedService.searchIds success', {
      query,
      found: ids.length
    });

    return ids;
  }

  /**
   * @private
   * @param {string[]|string} idList
   * @returns {Promise<Array>}
   */
  async fetchDetails(idList) {
    const idsArray = Array.isArray(idList) ? idList : [idList];

    const pmids = idsArray
      .map((id) => String(id || '').trim())
      .filter((id) => id.length > 0);

    if (!pmids.length) {
      loggerHelper.warn('PubMedService.fetchDetails called with empty idList');
      return [];
    }

    loggerHelper.info('PubMedService.fetchDetails called', { pmids });

    const params = {
      db: 'pubmed',
      id: pmids.join(','),
      retmode: 'json',
      version: '2.0'
    };

    const response = await this.http.get(`${PUBMED_BASE_URL}/esummary.fcgi`, {
      params
    });

    const result = response?.data?.result;

    if (!result || !Array.isArray(result.uids)) {
      loggerHelper.warn(
        'PubMedService.fetchDetails: unexpected response structure',
        {
          hasResult: !!result
        }
      );
      return [];
    }

    const articles = result.uids
      .map((uid) => this._mapSummaryToArticle(uid, result[uid]))
      .filter(Boolean);

    loggerHelper.info('PubMedService.fetchDetails success', {
      requested: pmids.length,
      returned: articles.length
    });

    return articles;
  }

  /**
   * @private
   * @param {string} uid
   * @param {any} item
   * @returns {{
   *  pmid: string,
   *  title: string,
   *  journal: string,
   *  year: string,
   *  authors: string[],
   *  summary: string,
   *  link: string
   * } | null}
   */
  _mapSummaryToArticle(uid, item) {
    if (!item) return null;

    const pmid = String(uid || '').trim();
    const title = (item.title || '').trim() || 'Título não disponível';
    const journal =
      (item.fulljournalname || item.source || '').trim() ||
      'Revista não informada';

    let year = '';
    const pubdate = (item.pubdate || item.epubdate || '').trim();
    if (pubdate && /^\d{4}/.test(pubdate)) {
      year = pubdate.slice(0, 4);
    } else {
      year = 'N/A';
    }

    const authors =
      Array.isArray(item.authors) && item.authors.length
        ? item.authors
            .map((a) => (a && a.name ? String(a.name).trim() : ''))
            .filter((name) => name.length > 0)
        : [];

    const summaryCandidate = (item.summary || item.elocationid || '')
      .toString()
      .trim();

    const summary =
      summaryCandidate && summaryCandidate.length > 0
        ? summaryCandidate
        : 'Resumo não disponível neste registro do PubMed.';

    const link = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

    return {
      pmid,
      title,
      journal,
      year,
      authors,
      summary,
      link
    };
  }
}

const pubMedService = new PubMedService();

export default pubMedService;
export { PubMedService };
