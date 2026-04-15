export type HttpError = Error & { status?: number; data?: unknown };

export async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      text ||
      `${res.status} ${res.statusText}`.trim();
    const err: HttpError = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

