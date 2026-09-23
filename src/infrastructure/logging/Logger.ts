import { env } from '@app/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * 08-security-privacy.md forbids exact user location, API keys, tokens, and
 * addresses in logs. Callers pass raw context; this strips/rounds anything
 * that looks like a coordinate or secret before it reaches the console (or,
 * later, a real log sink) so the redaction happens in one place rather than
 * at every call site.
 */
const SENSITIVE_KEY_PATTERN = /lat|lon|lng|coordinate|address|apikey|api_key|token|secret/i;

function redact(context: LogContext | undefined): LogContext | undefined {
  if (!context) {
    return context;
  }
  const redacted: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : value;
  }
  return redacted;
}

/**
 * Production builds only surface WARN/ERROR — DEBUG/INFO are development
 * aids and the release checklist requires debug logging to be reduced.
 */
function minLevelForEnv(): LogLevel {
  return env.appEnv === 'production' ? 'warn' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevelForEnv()];
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }
  const safeContext = redact(context);
  const line = `[NearBell] ${message}`;
  switch (level) {
    case 'debug':
    case 'info':
      console.log(line, safeContext ?? '');
      return;
    case 'warn':
      console.warn(line, safeContext ?? '');
      return;
    case 'error':
      console.error(line, safeContext ?? '');
      return;
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
