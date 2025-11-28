import Joi from 'joi';
import bolotaAgent from '../agent/bolotaAgent.js';
import loggerHelper from '../infra/logger.js';

const bodySchema = Joi.object({
  sessionId: Joi.string().allow(null, ''),
  message: Joi.string().min(1).required()
});

export async function handleWebhook(req, res, next) {
  try {
    await bodySchema.validateAsync(req.body);
    const { sessionId, message } = req.body;
    const sId = sessionId || `sess_${Date.now()}`;
    const response = await bolotaAgent.handle(sId, message);
    return res.json({ agent: 'Bolota', ...response });
  } catch (err) {
    loggerHelper.error('WebhookController error: %s', err.message);
    return next(err);
  }
}
