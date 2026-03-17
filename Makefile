.PHONY: dev prod preview test test-watch build install db-generate db-push db-deploy db-seed audit audit-fix security docker-dev docker-prod docker-down docker-build-prod docker-run-prod

# ── Development ───────────────────────────────────────────
dev:
	npm run dev

# ── Production ────────────────────────────────────────────
build:
	npx prisma generate
	npm run build

prod: build
	npm run start

# ── Cloudflare Edge Testing ──────────────────────────────
preview: build
	npx wrangler pages dev .vercel/output/static

# ── Testing ───────────────────────────────────────────────
test:
	npm test

test-watch:
	npm run test:watch

# ── Security ─────────────────────────────────────────────
audit:
	npm audit

audit-fix:
	npm audit fix

security:
	@echo "══ Dependency Audit ══"
	npm audit || true
	@echo ""
	@echo "══ Unit Tests ══"
	npm test

# ── Database ──────────────────────────────────────────────
db-generate:
	npx prisma generate

db-push:
	npx prisma db push

db-deploy:
	npx prisma migrate deploy

db-seed:
	npx prisma db seed

# ── Setup (first-time) ───────────────────────────────────
install:
	npm ci
	npx prisma generate

# ── Docker ───────────────────────────────────────────────
docker-dev:
	docker compose --profile dev up --build

docker-prod:
	docker compose --profile prod up --build

docker-down:
	docker compose --profile dev --profile prod down

docker-build-prod:
	docker build --target prod --build-arg DATABASE_URL="$$DATABASE_URL" -t running-app .

docker-run-prod:
	docker run -p 3000:3000 --env-file .env running-app
