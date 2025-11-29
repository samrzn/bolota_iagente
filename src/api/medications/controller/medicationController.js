import Joi from 'joi';
import MedicationRepository from '../../../repositories/medications/medicationRepository.js';
import { MedicationService } from '../service/medicationService.js';

const repository = new MedicationRepository();
const service = new MedicationService(repository);

const querySchema = Joi.object({
  query: Joi.string().min(2).required()
});

export async function searchMedication(req, res, next) {
  try {
    const { error, value } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        details: error.details?.map((d) => d.message) || []
      });
    }

    const { query } = value;

    const result = await service.find(query);

    if (!result) {
      return res.status(200).json({
        items: [],
        message: 'Nenhum medicamento encontrado para o parâmetro informado.'
      });
    }

    return res.status(200).json({
      items: [result]
    });
  } catch (err) {
    next(err);
  }
}

export default { searchMedication };
