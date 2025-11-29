import loggerHelper from '../infra/logger.js';

export default function errorMiddleware(err, req, res, next) {
  loggerHelper.error('UnhandledError', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  const status = err.statusCode || err.status || 500;

  const responseBody = {
    message:
      status >= 500
        ? 'Ocorreu um erro interno ao processar sua requisição.'
        : err.message || 'Erro ao processar requisição.'
  };

  if (process.env.NODE_ENV === 'development' && status >= 500) {
    responseBody.details = err.stack;
  }

  res.status(status).json(responseBody);
}
