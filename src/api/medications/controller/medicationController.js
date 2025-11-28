const Joi = require('joi');
const MedicationService = require('../services/medicationService.js');
const MedicationRepository = require('../../../repositories/medications/medicationRepository.js');
const loggerInfo = require('../infra/logger.js');

const querySchema = Joi.object({
  query: Joi.string().trim().min(1).required()
});

const repository = new MedicationRepository();
const service = new MedicationService(repository);

async function search(req, res, next) {
  try {
    await querySchema.validateAsync(req.query, { abortEarly: false });
    const { query } = req.query;
    const items = await service.find(query);
    if (!items || items.length === 0) {
      return res.status(200).json({ items: [], message: 'No records found' });
    }
    return res.status(200).json({ items });
  } catch (err) {
    loggerInfo.error('MedicationController.search error: %s', err.message);
    return next(err);
  }
}

module.exports = { search };
