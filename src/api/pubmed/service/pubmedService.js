import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import loggerHelper from '../../../infra/logger.js';

class PubMedService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.PUBMED_URL,
      timeout: 10000
    });

    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: 'text',
      trimValues: true
    });
  }

  async searchArticles(term, maxResults = 5) {
    loggerHelper.info('PubMedService.searchArticles called', {
      term,
      maxResults
    });

    try {
      const ids = await this.searchIds(term, maxResults);

      if (!ids?.length) {
        loggerHelper.info('PubMedService.searchArticles no IDs found', {
          term
        });
        return [];
      }

      const articles = await this.fetchDetails(ids);

      loggerHelper.info('PubMedService.searchArticles success', {
        term,
        count: articles.length
      });

      return articles;
    } catch (err) {
      loggerHelper.error('Erro no searchArticles', {
        term,
        error: err?.message
      });

      throw err;
    }
  }

  async searchIds(term, maxResults) {
    loggerHelper.info('PubMedService.searchIds called', { term, maxResults });

    try {
      const response = await this.client.get('/esearch.fcgi', {
        params: {
          db: 'pubmed',
          term,
          retmode: 'xml',
          retmax: maxResults
        }
      });

      const json = this.parser.parse(response.data);
      const idList = json?.eSearchResult?.IdList?.Id || [];

      const ids = Array.isArray(idList) ? idList : [idList].filter(Boolean);

      loggerHelper.info('PubMedService.searchIds success', {
        term,
        idsCount: ids.length
      });

      return ids;
    } catch (err) {
      loggerHelper.error('Erro ao buscar IDs no PubMed', {
        term,
        status: err?.response?.status,
        url: err?.config?.url,
        error: err?.message
      });

      throw err;
    }
  }

  async fetchDetails(idList) {
    loggerHelper.info('PubMedService.fetchDetails called', {
      idsCount: idList.length
    });

    try {
      const response = await this.client.get('/efetch.fcgi', {
        params: {
          db: 'pubmed',
          id: idList.join(','),
          retmode: 'xml',
          rettype: 'abstract'
        }
      });

      const json = this.parser.parse(response.data);
      const node = json?.PubmedArticleSet?.PubmedArticle || [];
      const articles = Array.isArray(node) ? node : [node].filter(Boolean);

      const mapped = articles.map((raw) => this.mapArticle(raw));

      loggerHelper.info('PubMedService.fetchDetails success', {
        count: mapped.length
      });

      return mapped;
    } catch (err) {
      loggerHelper.error('Erro ao buscar detalhes no PubMed', {
        status: err?.response?.status,
        url: err?.config?.url,
        error: err?.message
      });

      throw err;
    }
  }

  mapArticle(article) {
    const medline = article?.MedlineCitation;
    const articleData = medline?.Article;

    const pmidNode = medline?.PMID;
    const pmid = typeof pmidNode === 'object' ? pmidNode.text : pmidNode;

    const title = articleData?.ArticleTitle || '';
    const journal = articleData?.Journal?.Title || '';

    const year =
      articleData?.Journal?.JournalIssue?.PubDate?.Year ||
      articleData?.Journal?.JournalIssue?.PubDate?.MedlineDate ||
      '';

    const authorsRaw = articleData?.AuthorList?.Author || [];
    const authors = this.extractAuthors(authorsRaw);

    const abstractText = this.extractAbstract(articleData?.Abstract);
    const summary = this.buildSummary(abstractText, medline);

    return {
      pmid,
      title,
      journal,
      year,
      authors,
      summary,
      link: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : undefined
    };
  }

  extractAuthors(authorsRaw) {
    const list = Array.isArray(authorsRaw)
      ? authorsRaw
      : [authorsRaw].filter(Boolean);

    return list
      .map((a) => {
        if (a?.LastName && a?.Initials) {
          return `${a.LastName} ${a.Initials}`;
        }
        if (a?.CollectiveName) {
          return a.CollectiveName;
        }
        return null;
      })
      .filter(Boolean);
  }

  extractAbstract(abstractNode) {
    if (!abstractNode) return '';

    const raw = abstractNode.AbstractText ?? abstractNode;

    if (typeof raw === 'string') return raw;

    const arr = Array.isArray(raw) ? raw : [raw];

    return arr
      .map((n) => (typeof n === 'string' ? n : n?.text || ''))
      .join(' ')
      .trim();
  }

  buildSummary(abstractText, medlineCitation) {
    const clean = abstractText.replaceAll(/\s+/g, ' ').trim();

    if (clean.length) {
      return clean.length > 300 ? `${clean.slice(0, 297)}...` : clean;
    }

    const articleIds = medlineCitation?.ArticleIdList?.ArticleId || [];
    const ids = Array.isArray(articleIds)
      ? articleIds
      : [articleIds].filter(Boolean);

    const doi = ids.find((i) => i.IdType === 'doi')?.text;

    if (doi) return `doi: ${doi}`;

    return 'Resumo não disponível para este artigo.';
  }
}

export default new PubMedService();
