import axios from 'axios';
import loggerHelper from '../../../infra/logger.js';

function decodeHtmlEntities(str) {
  if (!str) return str;

  let result = str;

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );

  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );

  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return result;
}

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
        const id = decodeHtmlEntities(idRaw.replace(/.*?>/, '').trim());

        const rawTitle = getBetween('<ArticleTitle>', '</ArticleTitle>');
        const rawJournal = getBetween('<Title>', '</Title>');

        const pubdateRaw = getBetween('<PubDate>', '</PubDate>');
        const pubdateClean = pubdateRaw.replace(/<[^>]+>/g, '').trim();

        const rawAbstract = getBetween('<AbstractText>', '</AbstractText>');

        const authorBlocks =
          articleXml.match(/<Author\b[^>]*>[\s\S]*?<\/Author>/g) || [];

        const authors = authorBlocks
          .map((block) => {
            const last = block.match(/<LastName>([^<]+)<\/LastName>/);
            const fore = block.match(/<ForeName>([^<]+)<\/ForeName>/);
            const initials = block.match(/<Initials>([^<]+)<\/Initials>/);
            const collective = block.match(
              /<CollectiveName>([^<]+)<\/CollectiveName>/
            );

            if (fore && last)
              return decodeHtmlEntities(`${fore[1]} ${last[1]}`);
            if (last && initials)
              return decodeHtmlEntities(`${last[1]} ${initials[1]}`);
            if (last) return decodeHtmlEntities(last[1]);
            if (collective) return decodeHtmlEntities(collective[1]);

            return null;
          })
          .filter(Boolean);

        return {
          id,
          title: decodeHtmlEntities(rawTitle) || 'Título não disponível',
          journal: decodeHtmlEntities(rawJournal) || 'Periódico não informado',
          pubdate: decodeHtmlEntities(pubdateClean) || '',
          authors,
          abstract: decodeHtmlEntities(rawAbstract) || 'Resumo não disponível',
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
    loggerHelper.info('PubMedService.searchArticles called', {
      query,
      maxResults
    });

    const ids = await this.searchIds(query, maxResults);
    return this.fetchArticleDetails(ids);
  }
}

export default new PubMedService();
