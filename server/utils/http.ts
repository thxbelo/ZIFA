import type { Response } from 'express';
import type { ZodSchema } from 'zod';

export function sendError(res: Response, err: unknown, context: string, status = 500) {
  console.error(`[${context}]`, err);
  const message = status >= 500 ? 'Internal server error' : err instanceof Error ? err.message : 'Request failed';
  res.status(status).json({ error: message });
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
    throw Object.assign(new Error(message), { status: 400 });
  }
  return parsed.data;
}

export function statusFromError(err: unknown, fallback = 500) {
  if (typeof err === 'object' && err && 'status' in err && typeof (err as any).status === 'number') {
    return (err as any).status;
  }
  if (err instanceof Error && err.message.includes('not found')) return 404;
  return fallback;
}
