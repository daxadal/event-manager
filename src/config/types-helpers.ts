/* Enums */

export enum LogLevel {
  NONE,
  ERROR,
  WARN,
  INFO,
  VERBOSE,
}

/* Helpers */

export function parseEnvString(name: string, errors: string[]): string {
  const value = process.env[name];
  if (value && value !== '') return value;

  errors.push(`${name} must be defined and not empty`);
  return '';
}

export function parseBoolean(name: string, errors: string[]): boolean {
  const value = process.env[name];
  if (value === 'true') return true;
  if (value === 'false') return false;

  errors.push(`${name} must be "true" or "false" (lowercase only)`);
  return false;
}

export function parseOptEnvString(
  name: string,
  errors: string[]
): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  if (value !== '') return value;

  errors.push(`If defined, ${name} must be not empty`);
  return '';
}

export function parseEnvLogLevel(name: string, errors: string[]): LogLevel {
  const value = process.env[name];

  if (!value) {
    errors.push(`${name} must be one of: ${Object.keys(LogLevel)}`);
    return LogLevel.NONE;
  }
  if (/^none$/i.test(value)) return LogLevel.NONE;
  if (/^error$/i.test(value)) return LogLevel.ERROR;
  if (/^warn$/i.test(value)) return LogLevel.WARN;
  if (/^info$/i.test(value)) return LogLevel.INFO;
  if (/^verbose$/i.test(value)) return LogLevel.VERBOSE;

  errors.push(`${name} must be one of: ${Object.keys(LogLevel).join(', ')}`);
  return LogLevel.NONE;
}
