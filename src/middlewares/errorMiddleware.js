import loggerHelper from '../infra/logger.js';

export default function errorHandler(err, req, res, next) {
  loggerHelper.error('UnhandledError: %s', err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}
