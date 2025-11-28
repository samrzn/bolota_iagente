import 'dotenv/config';
import loggerHelper from './infra/logger.js';
import dbConnection from './database/connect.js';
import app from './app.js';

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

try {
  await dbConnection(MONGO_URI);
  app.listen(PORT, () => {
    loggerHelper.info('Bolota Agent listening on port %d', PORT);
  });
} catch (err) {
  loggerHelper.error('Failed to start server: %s', err.message);
  process.exit(1);
}
