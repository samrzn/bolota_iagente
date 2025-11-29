import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController.js';

const webhookRouter = Router();
webhookRouter.post('/', handleWebhook);

export default webhookRouter;
