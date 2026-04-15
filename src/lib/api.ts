function normalizeBaseUrl(url: string) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const defaultBase = import.meta.env.PROD ? '' : 'http://localhost:3001';
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || defaultBase);
export const API_URL = `${API_BASE_URL}/api`;

