require('dotenv').config();
const loggerInfo = require('./infra/loggerInfo.js');
const connect = require('./database/connect.js');
const app = require('./app.js');

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  try {
    await connect(MONGO_URI);
    app.listen(PORT, () => {
      loggerInfo.info('Bolota Agent listening on port %d', PORT);
    });
  } catch (err) {
    loggerInfo.error('Failed to start server: %s', err.message);
    process.exit(1);
  }
})();
