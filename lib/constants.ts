export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getTrustedHosts(): string[] {
  if (isDevelopmentEnvironment()) {
    return ['localhost:3000', 'localhost'];
  }
  return [];
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);
