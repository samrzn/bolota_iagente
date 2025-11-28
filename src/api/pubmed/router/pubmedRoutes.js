import { Router } from 'express';
import { searchPubMed } from '../controller/pubmedController.js';

const pubmedRouter = Router();
pubmedRouter.get('/', searchPubMed);

export default pubmedRouter;
