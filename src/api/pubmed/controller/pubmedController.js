const Joi = require('joi');
const PubMedService = require('../service/pubmedService.js');
const loggerInfo = require('../infra/loggerInfo.js');

const querySchema = Joi.object({
  query: Joi.string().trim().min(1).required()
});

const service = new PubMedService(process.env.PUBMED_URL);

async function search(req, res, next) {
  try {
    await querySchema.validateAsync(req.query);
    const results = await service.search(req.query.query);
    return res.status(200).json({ items: results });
  } catch (err) {
    loggerInfo.error('PubMedController.search error: %s', err.message);
    next(err);
  }
}

module.exports = { search };
