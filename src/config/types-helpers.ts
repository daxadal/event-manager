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
