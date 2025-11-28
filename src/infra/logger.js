const { createLogger, format, transports } = require('winston');

const loggerInfo = createLogger({
  level: process.env.LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [new transports.Console()]
});

module.exports = loggerInfo;
