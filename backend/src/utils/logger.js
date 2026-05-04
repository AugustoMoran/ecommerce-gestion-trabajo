/**
 * Structured logger utility.
 * - Development: colorized, human-readable console output with timestamp.
 * - Production: JSON structured output (compatible with log aggregators like Datadog, Logtail, etc.).
 *
 * No external dependencies — uses Node.js built-ins only.
 * Drop-in replacement for console.log / console.error.
 */

const isDev = process.env.NODE_ENV !== 'production';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
};

const LEVEL_COLORS = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.cyan,
  debug: COLORS.gray,
};

const timestamp = () => new Date().toISOString();

const formatDev = (level, message, meta) => {
  const color = LEVEL_COLORS[level] || COLORS.reset;
  const prefix = `${COLORS.gray}[${timestamp()}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset}`;
  const metaStr = meta && Object.keys(meta).length ? ` ${COLORS.gray}${JSON.stringify(meta)}${COLORS.reset}` : '';
  return `${prefix} ${message}${metaStr}`;
};

const formatProd = (level, message, meta) => {
  return JSON.stringify({ level, message, timestamp: timestamp(), ...meta });
};

const log = (level, message, meta = {}) => {
  const output = isDev ? formatDev(level, message, meta) : formatProd(level, message, meta);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
};

const logger = {
  error: (message, meta = {}) => log('error', message, meta),
  warn: (message, meta = {}) => log('warn', message, meta),
  info: (message, meta = {}) => log('info', message, meta),
  debug: (message, meta = {}) => {
    // Only emit debug logs in development
    if (isDev) log('debug', message, meta);
  },
};

module.exports = logger;
