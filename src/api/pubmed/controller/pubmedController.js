import Joi from 'joi';
import PubMedService from '../service/pubmedService.js';
import loggerHelper from '../../../infra/logger.js';

const querySchema = Joi.object({
  query: Joi.string().trim().min(1).required()
});

const service = new PubMedService(process.env.PUBMED_URL);

export async function searchPubMed(req, res, next) {
  try {
    await querySchema.validateAsync(req.query);
    const results = await service.search(req.query.query);
    return res.status(200).json({ items: results });
  } catch (err) {
    loggerHelper.error('PubMedController.searchPubMed error: %s', err.message);
    return next(err);
  }
}
