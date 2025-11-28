const loggerInfo = require('../infra/loggerInfo.js');

function errorHandler(err, req, res, next) {
  loggerInfo.error('UnhandledError: %s', err.stack || err.message);
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal Server Error'
  };
  res.status(status).json(payload);
}

module.exports = errorHandler;
