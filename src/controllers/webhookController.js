import Joi from 'joi';
import bolotaAgent from '../agent/bolotaAgent.js';

const bodySchema = Joi.object({
  sessionId: Joi.string().optional(),
  message: Joi.string().min(1).required()
});

function generateSessionId() {
  return `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export async function handleWebhook(req, res, next) {
  try {
    const { error, value } = bodySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: 'Body inválido',
        details: error.details?.map((d) => d.message) || []
      });
    }

    let { sessionId, message } = value;

    if (!sessionId) {
      sessionId = generateSessionId();
    }

    const agentResponse = await bolotaAgent.handle(sessionId, message);

    return res.status(200).json({
      sessionId,
      agent: 'Bolota',
      reply: agentResponse.reply
    });
  } catch (err) {
    next(err);
  }
}

export default { handleWebhook };
