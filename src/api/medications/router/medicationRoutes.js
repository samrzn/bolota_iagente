import { Router } from 'express';
import { searchMedication } from '../controller/medicationController.js';

const medicationRouter = Router();
medicationRouter.get('/', searchMedication);

export default medicationRouter;
