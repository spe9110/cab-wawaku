// backend/config/logger.js
import winston, { format, transports } from 'winston';
import os from 'os';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, json, errors } = format;

const jsonFormat = combine(
  errors({ stack: true }), // capture stack traces
  timestamp(),
  json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: process.env.APP_NAME || 'wawaku-backend',
    environment: process.env.NODE_ENV || 'development',
    host: os.hostname(), // adds server or container name
  },
  format: jsonFormat,
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: `${process.env.LOG_DIR || 'logs'}/wawaku-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: process.env.LOG_LEVEL || 'info',
    }),
  ],
  exitOnError: false,
});

// Optional Loki remote logging
if (process.env.LOKI_URL) {
  import('winston-loki')
    .then(({ default: LokiTransport }) => {
      logger.add(
        new LokiTransport({
          host: process.env.LOKI_URL,
          labels: {
            app: process.env.APP_NAME || 'wawaku-backend',
            environment: process.env.NODE_ENV || 'development',
          },
          json: true,
        })
      );
    })
    .catch(() => {
      logger.warn('⚠️ winston-loki not installed or Loki not reachable, skipping remote logs');
    });
}

export default logger;

/*
✅ Handles Winston logging, with:

JSON structured logs (for easy parsing by Loki/ELK)

Daily rotation (keeps 14 days of logs)

Optional Loki remote logging

*/ 