// src/utils/logger.ts
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { config } from '../config/app-config';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * Create and configure Winston logger
 */
function createWinstonLogger(): WinstonLogger {
  // Determine log level based on environment
  const level = config.environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  
  // Configure format based on environment
  const logFormat = config.environment === 'production'
    ? format.combine(
        format.timestamp(),
        format.json()
      )
    : format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => {
          const { timestamp, level, message, ...meta } = info;
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      );
  
  // Create Winston logger
  return createLogger({
    level,
    format: logFormat,
    defaultMeta: { service: 'contextnexus' },
    transports: [
      // Console transport for all environments
      new transports.Console(),
      
      // File transports for production
      ...(config.environment === 'production' ? [
        // Error log
        new transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        // Combined log
        new transports.File({ 
          filename: 'logs/combined.log' 
        })
      ] : [])
    ]
  });
}

/**
 * Application logger implementation
 */
class AppLogger implements Logger {
  private winstonLogger: WinstonLogger;
  
  constructor() {
    this.winstonLogger = createWinstonLogger();
  }
  
  debug(message: string, meta?: any): void {
    this.winstonLogger.debug(message, meta);
  }
  
  info(message: string, meta?: any): void {
    this.winstonLogger.info(message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.winstonLogger.warn(message, meta);
  }
  
  error(message: string, meta?: any): void {
    this.winstonLogger.error(message, meta);
  }
}

// Create and export a singleton logger instance
const logger = new AppLogger();
export default logger;