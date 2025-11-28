const express = require('express');
const cors = require('cors');
const yaml = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const medicationRoutes = require('./api/medications/router/medicationRoutes.js');
const pubmedRoutes = require('./api/pubmed/router/pubmedRoutes.js');
const webhookRoutes = require('./routes/webhookRoutes.js');
const errorHandler = require('./middlewares/errorHandler.js');

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

// routes
app.use('/medications', medicationRoutes);
app.use('/pubmed', pubmedRoutes);
app.use('/webhook', webhookRoutes);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// error handler
app.use(errorHandler);

module.exports = app;
