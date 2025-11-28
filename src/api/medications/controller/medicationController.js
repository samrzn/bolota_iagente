import Joi from 'joi';
import MedicationService from '../service/medicationService.js';
import MedicationRepository from '../../../repositories/medications/medicationRepository.js';
import loggerHelper from '../../../infra/logger.js';

const querySchema = Joi.object({
  query: Joi.string().trim().min(1).required()
});

const repository = new MedicationRepository();
const service = new MedicationService(repository);

export async function searchMedication(req, res, next) {
  try {
    await querySchema.validateAsync(req.query, { abortEarly: false });
    const { query } = req.query;
    const items = await service.find(query);
    if (!items || items.length === 0) {
      return res.status(200).json({ items: [], message: 'No records found' });
    }
    return res.status(200).json({ items });
  } catch (err) {
    loggerHelper.error(
      'MedicationController.searchMedication error: %s',
      err.message
    );
    return next(err);
  }
}
