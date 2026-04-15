import { API_URL } from '@/lib/api';
import { fetchJson } from '@/lib/http';

export function apiFetch(path: string, init?: RequestInit) {
  return fetchJson(`${API_URL}${path}`, init);
}

