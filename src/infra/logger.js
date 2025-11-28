import { createLogger, format, transports } from 'winston';

const loggerHelper = createLogger({
  level: process.env.LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [new transports.Console()]
});

export default loggerHelper;
