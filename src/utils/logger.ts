import winston from 'winston';
import config from '@config/index';

interface CustomLogger extends winston.Logger {
  getLevel(): string;
  setLevel(level: string): void;
  setName(name: string): void;
}

const logger: CustomLogger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      const args = Object.keys(rest).length
        ? JSON.stringify(rest, null, 2)
        : '';
      return `${timestamp} ${level}: ${message} ${args}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          let args = '';
          if (typeof message === 'object') {
            args = JSON.stringify(message, null, 2);
            message = '';
          }
          const extraArgs = Object.keys(rest).length
            ? JSON.stringify(rest, null, 2)
            : '';
          return `${timestamp} ${level}: ${message} ${args} ${extraArgs}`.trim();
        })
      ),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
}) as CustomLogger;

// Add getLevel and setLevel methods to make it compatible with Slack Bolt
logger.getLevel = (): string => logger.level as string;
logger.setLevel = (level: string): void => {
  logger.level = level;
  logger.transports.forEach(transport => {
    transport.level = level;
  });
};

// Add setName method to satisfy Logger interface
logger.setName = (name: string): void => {
  logger.defaultMeta = { ...logger.defaultMeta, name };
};

export default logger;
