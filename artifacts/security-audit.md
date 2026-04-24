# ZIFA Practical Security Audit

Date: 2026-04-24  
Scope: ZIFA web application source, Express/Netlify API, database access layer, dependencies, uploads, auth, deployment configuration, and fixture/result image export workflow.

## Executive Summary

The application is functional and the production build passes, but the initial posture had several high-impact risks: exposed-looking credentials in `.env.example`, weak production JWT defaults, open CORS/WebSocket access, default admin seeding, unrestricted uploads, and dependency advisories. This pass implemented the first hardening layer and standardized exported fixture/result cards against the supplied Pacific Breeze Southern Region Soccer League design.

Immediate manual action is still required: rotate the Neon database password and JWT secret outside the repository before any production deployment.

## Findings

| ID | Severity | Area | Status | Evidence | Risk | Remediation |
| --- | --- | --- | --- | --- | --- | --- |
| ZIFA-001 | Critical | Secrets | Mitigated in repo, manual rotation required | `.env.example` previously contained a real-looking Neon connection string and static JWT secret. | Anyone with repo access/history could access or attempt access to the database and forge tokens if the secret was reused. | Replaced sample values with placeholders. Rotate Neon credentials and set a new 32+ character `JWT_SECRET` in hosting settings. |
| ZIFA-002 | High | Authentication | Mitigated | `server/middleware/auth.ts` and `server/routes/auth.ts` used insecure fallback JWT secrets. | Production tokens could be signed/verified with known fallback values. | Added `getJwtSecret()` requiring a strong secret in production. |
| ZIFA-003 | High | Default Credentials | Mitigated | Neon and SQLite bootstraps seeded `admin/admin`. | Predictable admin credentials can be used to take over the app. | Default seeding is skipped in production and can be disabled with `SEED_DEFAULT_ADMIN=false`. |
| ZIFA-004 | High | Database / RLS | Open | `supabase_schema.sql` disables row-level security. | Direct Supabase client access could bypass app authorization if anon keys are exposed. | Do not use this schema in production without enabling RLS policies. Current app primarily uses server-side Neon queries. |
| ZIFA-005 | High | SQL Injection | Mitigated / monitored | Database wrappers use parameterized `pool.query(..., [$1])` / prepared SQLite statements; dynamic filters are assembled from fixed server-side condition strings. | SQL injection would allow data theft or manipulation. | Preserved parameterized queries and added Zod validation before write/update payloads reach DB calls. Continue banning string interpolation of user input in SQL. |
| ZIFA-006 | High | Rate Limiting | Mitigated | Login and write endpoints previously had no throttling. | Brute force login and write spam could degrade service or guess credentials. | Added `express-rate-limit`: 10 login attempts per 15 minutes, 120 write requests per minute. |
| ZIFA-007 | High | Uploads | Mitigated with residual parser risk | Upload endpoints accepted in-memory files without size/MIME controls. | Large or malicious documents could cause DoS or parser exploitation. | Added file-size limits, MIME/extension allowlists, parser row/line caps, and request body limits. |
| ZIFA-008 | High | Dependencies | Partially mitigated | `npm audit` initially reported `@xmldom/xmldom` and `xlsx`; now only `xlsx` remains. | Vulnerable parser code can cause prototype pollution or ReDoS with malicious spreadsheet files. | Updated `@xmldom/xmldom` to `0.8.13`; constrained `xlsx` parser inputs. Replace `xlsx` with a maintained/fixed parser in the next hardening pass. |
| ZIFA-009 | Medium | CORS / WebSockets | Mitigated | API and Socket.IO allowed all origins. | Untrusted websites could interact with the API from browsers where tokens are present. | Added `ALLOWED_ORIGINS` and shared origin checks for Express and Socket.IO. |
| ZIFA-010 | Medium | Error Disclosure | Mitigated | Routes returned raw `err.message` for many server errors. | Internal implementation details could leak. | Added generic 500 handling with server-side logging and validation-specific 400s. |
| ZIFA-011 | Medium | Browser Token Storage | Accepted for now | Auth state persists token under `zifa-auth`. | XSS would expose tokens. | No XSS sink was found in this pass. Future improvement: move auth to HttpOnly secure cookies. |
| ZIFA-012 | Medium | Security Headers | Mitigated | Express lacked standard hardening headers. | Missing headers increase browser-side attack surface. | Added Helmet with CSP disabled for compatibility pending a dedicated CSP pass. |
| ZIFA-013 | Low | Export Standardization | Mitigated | Fixture and result images used separate layouts and did not match the uploaded standard. | Inconsistent official communications. | Added shared portrait export card matching the supplied green header/body/footer design for fixtures and results. |

## Rate Limiting

Implemented in `server/app.ts`:

- Login: 10 requests per 15 minutes per client.
- API writes: 120 non-GET requests per minute per client.
- Rate-limit headers are enabled using standard headers.

## SQL Injection Review

Current database access is low risk for SQL injection because:

- Neon/Postgres calls use parameter placeholders such as `$1`, `$2`.
- SQLite calls use prepared statements with `?` placeholders.
- Dynamic match filtering only concatenates fixed server-defined clauses, while user values go into parameter arrays.
- New Zod schemas validate and constrain IDs, scores, text lengths, booleans, and known enum values before writes.

Rules for future changes:

- Never concatenate request body, query, or route params directly into SQL.
- Any dynamic `ORDER BY`, table name, or column name must use an explicit allowlist.
- Keep validation at route boundaries.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm audit --json`: 1 remaining high advisory, direct `xlsx`, no npm fix available.
- `npm ls @xmldom/xmldom`: resolved to `0.8.13`.

## Remaining Work

- Rotate Neon database credentials and JWT secret immediately.
- Replace `xlsx` with a parser that has a fixed advisory path, or isolate spreadsheet parsing in a sandboxed worker/service.
- Add automated API route tests for auth, protected routes, upload rejection, and validation failures.
- Enable Supabase RLS if Supabase is used in production.
- Consider HttpOnly cookie auth and a strict Content Security Policy.
