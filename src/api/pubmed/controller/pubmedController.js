import Joi from 'joi';
import pubMedService from '../service/pubmedService.js';

const querySchema = Joi.object({
  query: Joi.string().min(2).required()
});

export async function searchPubMed(req, res, next) {
  try {
    const { error, value } = querySchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        details: error.details?.map((d) => d.message) || []
      });
    }

    const { query } = value;

    const items = await pubMedService.searchArticles(query);

    return res.status(200).json({
      items
    });
  } catch (err) {
    next(err);
  }
}

export default { searchPubMed };
