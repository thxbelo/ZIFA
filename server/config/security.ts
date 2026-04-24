const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY);

export function getAllowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) return configured;
  return isProduction ? [] : DEFAULT_DEV_ORIGINS;
}

export function isOriginAllowed(origin?: string) {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (isProduction) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  }

  console.warn('[Security] Using development JWT secret. Set JWT_SECRET before deployment.');
  return 'zifa-local-development-secret-change-before-production';
}

export function getMaxUploadBytes() {
  const mb = Number.parseInt(process.env.MAX_UPLOAD_MB || '5', 10);
  const safeMb = Number.isFinite(mb) && mb > 0 ? Math.min(mb, 25) : 5;
  return safeMb * 1024 * 1024;
}

export function getJsonLimit() {
  return process.env.JSON_BODY_LIMIT || '1mb';
}
