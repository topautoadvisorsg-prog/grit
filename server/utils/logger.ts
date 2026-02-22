type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function getTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, args: unknown[]): string {
  return `[${getTimestamp()}] [${level.toUpperCase()}]`;
}

export const logger = {
  debug(...args: unknown[]): void {
    if (!shouldLog('debug')) return;
    console.log(formatMessage('debug', args), ...args);
  },

  info(...args: unknown[]): void {
    if (!shouldLog('info')) return;
    console.log(formatMessage('info', args), ...args);
  },

  warn(...args: unknown[]): void {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', args), ...args);
  },

  error(...args: unknown[]): void {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', args), ...args);
  },
};
