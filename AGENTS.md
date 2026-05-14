# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands
- Install dependencies: `npm install`
- Run the API in watch mode: `npm run dev`
- Lint all files: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`
- Format all files: `npm run format`
- Check formatting only: `npm run format:check`
- Generate new Drizzle migrations from schema changes: `npm run db.generate`
- Apply migrations: `npm run db.migrate`
- Open Drizzle Studio: `npm run db.studio`

## Tests
- There is currently no test script in `package.json` and no test files in the repository.
- Running a single test is not currently supported by project scripts; add a test runner first, then document its single-test command here.

## Runtime and configuration
- App entrypoint is `src/index.js`, which loads environment variables and starts `src/server.js`.
- HTTP app setup is in `src/app.js`.
- Important environment variables used by the app:
  - `PORT`
  - `DATABASE_URL`
  - `ARCJET_KEY`
  - `JWT_SECRET`
  - `LOG_LEVEL`
  - `NODE_ENV`
- `drizzle.config.js` uses `src/models/*.js` as schema source and writes migrations to `drizzle/`.

## High-level architecture
- Stack: Express 5 API, Drizzle ORM, Neon Postgres driver, Zod validation, Arcjet security middleware, Winston logging.
- Module aliasing is configured in `package.json#imports` (`#config/*`, `#controllers/*`, etc.); prefer aliases over deep relative imports.
- Request flow for auth endpoints:
  1. Route registration in `src/routes/auth.routh.js` (`/api/auth/*`)
  2. Controller input validation and HTTP responses in `src/controllers/auth.controller.js`
  3. Business logic and DB operations in `src/services/auth.service.js`
  4. Data schema in `src/models/user.models.js`
- Global middleware chain in `src/app.js` runs before routes: `helmet` → `cors` → body parsers → `cookie-parser` → `morgan` (to Winston) → `securityMiddleware`.
- `src/middleware/security.middleware.js` applies Arcjet protections and role-based rate limits (`guest`, `user`, `admin`) and short-circuits blocked traffic with `403/429`.
- Shared utilities:
  - `src/utils/jwt.js` for token signing/verification
  - `src/utils/cookie.js` for cookie options/set/clear/get
  - `src/utils/format.js` for validation error formatting

## Data and migration notes
- User table definition is in `src/models/user.models.js`.
- Existing generated migration SQL is under `drizzle/` (with metadata in `drizzle/meta/`).
