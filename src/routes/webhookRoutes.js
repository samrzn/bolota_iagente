import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController.js';

const webhookRouter = Router();
webhookRouter.post('/bolota', handleWebhook);

export default webhookRouter;
