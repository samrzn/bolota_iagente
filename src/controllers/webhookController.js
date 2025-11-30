import Joi from 'joi';
import bolotaAgent from '../agent/bolotaAgent.js';
import loggerHelper from '../infra/logger.js';

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
      loggerHelper.warn('BolotaWebhook body inválido', {
        body: req.body,
        details: error.details?.map((d) => d.message)
      });

      return res.status(400).json({
        message: 'Body inválido',
        details: error.details?.map((d) => d.message) || []
      });
    }

    let { sessionId, message } = value;

    if (!sessionId) {
      sessionId = generateSessionId();
    }

    loggerHelper.info('BolotaWebhook request', {
      sessionId,
      message
    });

    const agentResponse = await bolotaAgent.handle(sessionId, message);

    let replyText;

    if (typeof agentResponse.reply === 'string') {
      replyText = agentResponse.reply;
    } else if (Array.isArray(agentResponse.reply)) {
      replyText = agentResponse.reply.join(' ');
    } else {
      replyText = String(agentResponse.reply ?? '');
    }

    const sample = replyText.replaceAll(/\s+/g, ' ').slice(0, 120);

    loggerHelper.info('BolotaWebhook response', {
      sessionId,
      intent: agentResponse.intent,
      replySample: sample
    });

    return res.status(200).json({
      sessionId,
      agent: 'Bolota',
      reply: replyText
    });
  } catch (err) {
    next(err);
  }
}

export default { handleWebhook };
