# Docker setup with Neon Local (development) and Neon Cloud (production)
This project uses two separate Docker Compose configurations:
- `docker-compose.dev.yml`: app + Neon Local proxy
- `docker-compose.prod.yml`: app only, connected directly to Neon Cloud

## 1) Development (Neon Local + ephemeral branches)
Neon Local runs as a sidecar and your app connects to it via:
- `DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require`
- `NEON_LOCAL_FETCH_ENDPOINT=http://neon-local:5432/sql`

Start development:
```bash
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

What this does:
- Starts `app` and `neon-local`
- Neon Local uses `NEON_API_KEY`, `NEON_PROJECT_ID`, and optional `PARENT_BRANCH_ID`
- With `DELETE_BRANCH=true`, branches are ephemeral and cleaned up when the container stops

Stop development:
```bash
docker compose -f docker-compose.dev.yml --env-file .env.development down
```

## 2) Production (Neon Cloud only)
Production does **not** run Neon Local. The app connects directly to Neon Cloud via:
- `DATABASE_URL` from `.env.production` (or your deployment secret manager)

Start production:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

Stop production:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

## Environment switching summary
- Dev: `docker-compose.dev.yml` + `.env.development` → `DATABASE_URL` points to `neon-local`
- Prod: `docker-compose.prod.yml` + `.env.production` → `DATABASE_URL` points to `*.neon.tech`

## Notes
- Do not commit real secrets to `.env` files.
- Inject production values from CI/CD secrets or your hosting platform.
