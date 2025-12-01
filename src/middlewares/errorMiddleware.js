import loggerHelper from '../infra/logger.js';

export function errorMiddleware(err, req, res, _next) {
  loggerHelper.error('UnhandledError', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    query: req.query
  });

  const status = err.status || 500;

  const isInternal = status >= 500;

  const response = {
    message: isInternal
      ? 'Erro interno no servidor.'
      : err.message || 'Erro ao processar a requisição.'
  };

  if (process.env.NODE_ENV !== 'production') {
    if (err.details) {
      response.details = err.details;
    }
  }

  res.status(status).json(response);
}

export default errorMiddleware;
