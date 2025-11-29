import express from 'express';
import cors from 'cors';
import yaml from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import medicationRoutes from './api/medications/router/medicationRoutes.js';
import pubmedRoutes from './api/pubmed/router/pubmedRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import errorHandler from './middlewares/errorMiddleware.js';

const app = express();
app.use(cors());
app.use(express.json());

try {
  const swaggerDocument = yaml.load('./swagger.yaml');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn(
    'Could not load ./swagger.yaml for /docs:',
    err?.message ? err.message : err
  );
}

app.use('/medications', medicationRoutes);
app.use('/pubmed', pubmedRoutes);
app.use('/webhook/bolota', webhookRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
