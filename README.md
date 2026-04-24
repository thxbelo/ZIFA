<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ec633ec9-d8c7-4e6d-a6c9-e1b68b4cc784

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set values (at minimum `JWT_SECRET`, `DB_TYPE`, `NEON_DATABASE_URL`, `ALLOWED_ORIGINS`, and `GEMINI_API_KEY`).
   - `JWT_SECRET` must be a unique random value of at least 32 characters for production.
   - `ALLOWED_ORIGINS` should include only trusted frontend origins.
   - Keep `SEED_DEFAULT_ADMIN=false` outside local development.
3. Run the app:
   `npm run dev`

## Deploy to Netlify

This repo includes `netlify.toml` for build + SPA routing and a Netlify Function that hosts the API.

1. Push to GitHub and create a new Netlify site from the repo.
2. In Netlify Site settings > Environment variables, set:
   - `DB_TYPE=neon`
   - `NEON_DATABASE_URL=...`
   - `JWT_SECRET=...`
   - `ALLOWED_ORIGINS=https://your-site.netlify.app`
   - `SEED_DEFAULT_ADMIN=false`
   - `GEMINI_API_KEY=...` (used at build time by the frontend)
3. Deploy. The frontend calls `/api/...` and Netlify rewrites that to the function.

## Security Audit

The practical security audit and remediation notes are in `artifacts/security-audit.md`.
