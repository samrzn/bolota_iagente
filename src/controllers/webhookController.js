const Joi = require('joi');
const bolota = require('../agent/bolotaAgent.js');
const loggerInfo = require('../infra/logger.js');

const bodySchema = Joi.object({
  sessionId: Joi.string().allow(null, ''),
  message: Joi.string().min(1).required()
});

async function handleWebhook(req, res, next) {
  try {
    await bodySchema.validateAsync(req.body);
    const { sessionId, message } = req.body;
    const sId = sessionId || `sess_${Date.now()}`;
    const response = await bolota.handle(sId, message);
    return res.json({ agent: 'Bolota', ...response });
  } catch (err) {
    loggerInfo.error('WebhookController error: %s', err.message);
    return next(err);
  }
}

module.exports = { handleWebhook };
