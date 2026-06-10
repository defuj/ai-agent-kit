---
name: devops-cicd-pipeline
description: Complete CI/CD pipeline patterns for DevOps Engineer — GitHub Actions, Docker multi-stage build, Docker Compose, Vercel (Nuxt & Next.js), Cloudflare Pages/Workers, environment/secret management, health check & monitoring, rollback strategy. Gunakan skill ini untuk semua tugas deployment, pipeline, dan infrastruktur frontend/backend.
license: MIT
metadata:
  author: Nous Research — DevOps Team
  version: "1.0.0"
---

# DevOps CI/CD Pipeline

Skill referensi untuk **@devops** — DevOps Engineer. Stack: Docker, GitHub Actions, Vercel, Cloudflare, monitoring.

---

## 1. GitHub Actions Workflow Patterns

Pipeline standar terdiri dari 6 stage: **Lint → Test → Build → Security Scan → Deploy → Verify**.

### 1.1 Workflow — Test

```yaml
name: Test
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

### 1.2 Workflow — Build

```yaml
name: Build
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            .output/
            .next/
            dist/
      - name: Build Docker Image
        run: docker build -t ${{ secrets.REGISTRY }}/app:${{ github.sha }} .
```

### 1.3 Workflow — Deploy (Environment Promotion)

```yaml
name: Deploy

on:
  workflow_run:
    workflows: ["Build"]
    types: [completed]
    branches: [main, develop]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying to staging..."
      - name: Smoke Test
        run: curl --fail ${{ vars.STAGING_URL }}/api/health

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying to production..."
      - name: Health Check
        run: curl --fail ${{ vars.PRODUCTION_URL }}/api/health
```

**Environment Variables in CI:**
- `vars.*` → non-sensitive env vars (diatur via GitHub UI: Settings → Environments → `environment` name)
- `secrets.*` → sensitive values (API keys, tokens, passwords)
- Gunakan `vars.` (bukan `secrets.`) untuk non-sensitive per-environment config

### 1.4 Branch Strategy & Environment Mapping

| Branch | Environment | Job Trigger | Approval |
|--------|-------------|-------------|----------|
| `feature/*` | Development | Push & PR | Auto |
| `develop` | Staging | Push | Auto |
| `main` | Production | Push | Manual approval gate (environment protection rule) |
| `hotfix/*` | Production (expedited) | Push | Manual approval |

---

## 2. Docker Multi-Stage Build

### 2.1 Multi-Stage Dockerfile (Nuxt / Next.js)

```dockerfile
# === STAGE 1: Install dependencies ===
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# === STAGE 2: Build ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Nuxt 4
RUN npm run build
# or for Next.js: RUN npm run build

# === STAGE 3: Production ===
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.output ./.output

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
```

### 2.2 Backend / Express Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser
EXPOSE 3001

ENV NODE_ENV=production \
    PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node dist/health.js || exit 1

CMD ["node", "dist/index.js"]
```

### 2.3 Docker Best Practices

- **Gunakan alpine base image** — minimal footprint, reduced attack surface
- **Jangan pakai `latest` tag** — pin versi eksplisit: `node:20-alpine`, `node:22-slim`
- **Non-root user** — selalu buat user non-root (`adduser`) di stage final
- **COPY only what's needed** — jangan copy `node_modules`, dev dependencies, atau source map di stage final
- **Layer caching** — urutkan COPY dari yang paling jarang berubah (package.json sebelum source code)
- **`--chown`** — set ownership ke non-root user saat COPY
- **`HEALTHCHECK`** — instruction wajib untuk production image
- **Resource limits** — set `--memory` dan `--cpus` saat run container

---

## 3. Docker Compose untuk Dev / Prod

### 3.1 docker-compose.yml (Development)

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - NUXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - PORT=3001
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### 3.2 docker-compose.prod.yml (Production)

```yaml
version: "3.9"

services:
  app:
    image: ${REGISTRY}/app:${IMAGE_TAG:-latest}
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:3000"
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512M"
        reservations:
          cpus: "0.5"
          memory: "256M"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot-data:/var/www/certbot
    depends_on:
      - app
```

### 3.3 Run Commands

```bash
# Development (hot-reload)
docker compose up -d
docker compose logs -f

# Production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Rebuild & restart service
docker compose up -d --build --no-deps frontend

# Rollback to previous image tag
docker compose -f docker-compose.prod.yml up -d app
# Then manually: docker tag previous-image app:latest
```

---

## 4. Vercel Deployment (Nuxt & Next.js)

### 4.1 Nuxt 4 / Vue — Vercel

```json
// vercel.json — Nuxt 4
{
  "framework": "nuxtjs",
  "buildCommand": "nuxt build",
  "outputDirectory": ".output",
  "installCommand": "npm install",
  "regions": ["sin1", "iad1"],
  "headers": [
    {
      "source": "/_nuxt/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Env vars (Vercel Dashboard → Project → Settings → Environment Variables):**
- `NUXT_PUBLIC_API_URL` — public, client-side accessible
- `NUXT_PUBLIC_SITE_URL` — canonical URL
- `DATABASE_URL` — secret, server-only
- `NITRO_PRESET` — `vercel` (default, otomatis)

**Nuxt 4 Specific:**
- SSR: `nuxt build` → `.output/` → Vercel serverless functions
- Static: `nuxi generate` → `dist/` → Vercel static hosting
- `nuxt.config.ts`: pastikan `ssr: true` atau atur per-route dengan `routeRules`
- Server routes di `server/api/` otomatis jadi serverless functions

### 4.2 Next.js 15 / React — Vercel

```json
// vercel.json — Next.js 15
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["sin1", "iad1"],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Env vars:**
- `NEXT_PUBLIC_*` — client-side accessible
- Non-prefixed vars — server-only
- `NEXT_RUNTIME` — `nodejs` (default) or `edge`

**Next.js 15 Specific:**
- App Router: `next build` → server components + client bundle
- Middleware: `middleware.ts` di root → edge runtime
- ISR: `revalidate` option di fetch / `generateStaticParams`
- PPR (Partial Prerendering): set `experimental.ppr = true` di `next.config.ts`

### 4.3 GitHub Actions → Vercel Deploy

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Atau gunakan Vercel CLI:

```yaml
      - name: Install Vercel CLI & Deploy
        run: |
          npm i -g vercel
          vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 4.4 Preview Deployments (Pull Requests)

Vercel otomatis buat preview deployment untuk setiap PR. Konfigurasi di GitHub:

```
Settings → Environments → Preview → Deployment branches: *
```

GitHub Action untuk PR preview:

```yaml
name: Vercel Preview
on: [pull_request]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: `🚀 Preview: ${process.env.VERCEL_URL}`
            })
```

---

## 5. Cloudflare Pages / Workers

### 5.1 Cloudflare Pages (Nuxt / Next.js)

```toml
# wrangler.toml — Cloudflare Pages
name = "my-app"
compatibility_date = "2025-01-01"

pages_build_output_dir = ".output"  # Nuxt
# pages_build_output_dir = ".next"  # Next.js

[env.production]
routes = [
  { pattern = "*.example.com", zone_id = "<zone-id>" }
]

[env.preview]
routes = [
  { pattern = "*.preview.example.com", zone_id = "<zone-id>" }
]
```

**Nuxt di Cloudflare Pages:**
- Build command: `npm run build` (dengan preset `cloudflare-pages` di `nuxt.config.ts`)
- `nuxt.config.ts`: `nitro: { preset: 'cloudflare-pages', esbuild: { options: { target: 'es2022' } } }`
- Output: `.output/public/` → diupload sebagai static assets
- Server functions: `.output/server/` → Cloudflare Functions

**Next.js di Cloudflare Pages:**
- Gunakan `@cloudflare/next-on-pages`
- Build command: `npx @cloudflare/next-on-pages`
- Output dir: `.vercel/output/static`
- Limitations: tidak semua Next.js API didukung (App Router sebagian, ISR terbatas)

### 5.2 Cloudflare Workers

```toml
# wrangler.toml — Worker
name = "my-worker"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

[env.production]
vars = { API_URL = "https://api.example.com" }

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "<id>"

[[kv_namespaces]]
binding = "CACHE"
id = "<id>"
```

```typescript
// src/worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // API proxy
    if (url.pathname.startsWith('/api/')) {
      const apiUrl = `${env.API_URL}${url.pathname}${url.search}`;
      const response = await fetch(apiUrl, { headers: request.headers });
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

### 5.3 GitHub Actions → Cloudflare Deploy

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .output/public --project-name=my-app
```

### 5.4 Deploy Worker

```yaml
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy src/worker.ts --name my-worker --env production
```

---

## 6. Environment Variables & Secret Management

### 6.1 Environment Variable Hierarchy (Priority)

1. **Runtime** (process.env / platform env vars dashboard) — highest priority
2. **`.env.production`** — production-specific
3. **`.env.staging`** — staging-specific
4. **`.env.development`** — development-specific
5. **`.env.local`** — local overrides (`.gitignore`)
6. **`.env`** — defaults

### 6.2 Template File

```bash
# .env.example — committed, contains placeholder values
NUXT_PUBLIC_API_URL=http://localhost:3001
NUXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/app
JWT_SECRET=change-me-in-production
REDIS_URL=redis://localhost:6379
SENTRY_DSN=
```

### 6.3 Platform-Specific Secret Storage

| Platform | Secret Store | How |
|----------|-------------|-----|
| GitHub Actions | Repository Secrets | Settings → Secrets and variables → Actions |
| GitHub Actions | Environment Secrets | Settings → Environments → pilih env → Secrets |
| Vercel | Environment Variables | Project → Settings → Environment Variables |
| Cloudflare | Secrets via Wrangler | `wrangler secret put <KEY>` |
| Cloudflare | Environment Variables | Dashboard → Worker → Settings → Variables |
| Docker Compose | `.env` file | `docker compose --env-file .env.production up` |
| Production | Secrets Manager | AWS Secrets Manager / HashiCorp Vault / Doppler / 1Password |

### 6.4 Validasi Env Vars di Startup

```typescript
// validate-env.ts
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NUXT_PUBLIC_API_URL',
];

function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ All environment variables validated');
}

validateEnv();
```

### 6.5 Secret Rotation Schedule

| Secret Type | Recommended Rotation |
|-------------|---------------------|
| JWT Secret | Every 90 days |
| Database Password | Every 180 days |
| API Keys (third-party) | Per vendor policy, min annually |
| Cloudflare API Token | Every 90 days |
| Vercel Token | Every 180 days |
| SSH Keys | Every 365 days |

---

## 7. Health Check & Monitoring

### 7.1 Health Check Endpoints

Semua service WAJIB memiliki endpoints berikut:

```typescript
// api/health.ts — Generic health check endpoint
import { Request, Response } from 'express';

export async function healthCheck(req: Request, res: Response) {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown',
  };
  res.status(200).json(healthData);
}

// api/health/ready.ts — Readiness check (dependencies available)
export async function readinessCheck(req: Request, res: Response) {
  try {
    // Check database
    await db.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    // Check external service
    const extRes = await fetch(process.env.EXTERNAL_HEALTH_URL!);
    if (!extRes.ok) throw new Error('External service unhealthy');

    res.status(200).json({ status: 'ready', checks: { db: 'ok', redis: 'ok', external: 'ok' } });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
}

// api/health/live.ts — Liveness check (service not deadlocked)
export async function livenessCheck(req: Request, res: Response) {
  res.status(200).json({ status: 'alive' });
}
```

### 7.2 HTTP Health Check Response Format

```json
// 200 OK
{
  "status": "ok",
  "timestamp": "2026-06-10T10:00:00.000Z",
  "uptime": 86400,
  "version": "1.2.3"
}

// 503 Service Unavailable (readiness failed)
{
  "status": "not ready",
  "error": "Database connection failed",
  "timestamp": "2026-06-10T10:00:00.000Z"
}
```

### 7.3 Monitoring Stack Recommendations

| Layer | Tool | Purpose |
|-------|------|---------|
| Uptime Monitoring | Better Uptime / Upptime / Checkly | External health check every 1-5 min |
| Error Tracking | Sentry | Capture JS errors, source maps, stack traces |
| Performance (RUM) | Vercel Analytics / Cloudflare Web Analytics | Real user monitoring, LCP, CLS, INP |
| Application Metrics | OpenTelemetry → Datadog / Grafana / SigNoz | Traces, spans, request duration, error rate |
| Server Metrics | Prometheus + Grafana / CloudWatch | CPU, memory, disk, network |
| Logging | Axiom / Better Stack / ELK / Loki | Structured JSON logs aggregation |
| Alerting | Slack webhook / PagerDuty / OpsGenie | Critical alerts routed to on-call |

### 7.4 GitHub Actions — Smoke Test After Deploy

```yaml
      - name: Smoke Test
        run: |
          sleep 10
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${{ vars.DEPLOY_URL }}/api/health)
          if [ "$STATUS" -ne 200 ]; then
            echo "❌ Health check failed with status $STATUS"
            exit 1
          fi
          echo "✅ Health check passed"
```

### 7.5 Alert Configuration (example: BetterStack)

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Uptime | < 99.9% in 5 min | Critical | PagerDuty call |
| Error Rate | > 1% in 5 min | Critical | Slack alert |
| Response Time (p95) | > 2000ms | Warning | Slack notification |
| SSL Expiry | < 14 days | Warning | Email reminder |
| Build Failure | Any | High | GitHub notification |

---

## 8. Rollback Strategy

### 8.1 Rollback Methods

| Method | Speed | Risk | Complexity | Best For |
|--------|-------|------|------------|----------|
| **Git Revert** | Medium | Low | Low | Code-only issues |
| **Docker Image Rollback** | Fast | Low | Medium | Container deployment |
| **Vercel Instant Rollback** | Instant | Low | None | Vercel deployment |
| **Cloudflare Pages Rollback** | Instant | Low | Low | Cloudflare Pages |
| **Database Migration Rollback** | Slow | High | High | Schema migration issues |

### 8.2 Vercel Rollback

```bash
# Via Vercel Dashboard
Deployments → Pilih deployment sebelumnya → "•••" → "Promote to Production"

# Via Vercel CLI
vercel rollback --yes --token=$VERCEL_TOKEN

# Via GitHub Actions (automated rollback on health check failure)
```

### 8.3 Automated Rollback in GitHub Actions

```yaml
name: Deploy with Rollback

on:
  push:
    branches: [main]

jobs:
  deploy-with-rollback:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Build & Push Docker Image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/app:${{ github.sha }} .
          docker push ${{ secrets.REGISTRY }}/app:${{ github.sha }}

      - name: Deploy to Production
        run: |
          # Save current version before deployment
          echo "PREVIOUS_TAG=$(curl -s $DEPLOY_URL/api/health | jq -r '.version')" >> $GITHUB_ENV
          docker compose -f docker-compose.prod.yml up -d app

      - name: Health Check
        id: health
        run: |
          for i in {1..6}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOY_URL/api/health)
            if [ "$STATUS" -eq 200 ]; then
              echo "✅ Deployment successful"
              exit 0
            fi
            echo "Waiting... ($i/6)"
            sleep 10
          done
          echo "❌ Health check failed, initiating rollback"
          exit 1

      - name: Rollback on Failure
        if: failure() && steps.health.outcome == 'failure'
        run: |
          echo "⏪ Rolling back to $PREVIOUS_TAG"
          docker pull ${{ secrets.REGISTRY }}/app:$PREVIOUS_TAG
          docker compose -f docker-compose.prod.yml up -d app
          echo "✅ Rollback complete"
```

### 8.4 Docker Container Rollback

```bash
# Step 1: Tag current as backup
docker tag app:latest app:rollback-$(date +%Y%m%d-%H%M%S)

# Step 2: Pull previous stable image
docker pull registry.example.com/app:v1.2.1

# Step 3: Re-tag and restart
docker tag registry.example.com/app:v1.2.1 app:latest
docker compose up -d app

# Step 4: Verify
curl --fail http://localhost:3000/api/health && echo "Rollback successful"
```

### 8.5 Database Rollback

```bash
# Prisma — rollback migration
npx prisma migrate resolve --applied "<migration-name>"

# Manual SQL restore
psql $DATABASE_URL < backups/schema-2026-06-09.sql

# Best practice: selalu backup database SEBELUM deploy migration
# Di CI:
#   - name: Backup Database
#     run: pg_dump $DATABASE_URL > backups/pre-deploy-$(date +%Y%m%d).sql
```

### 8.6 Rollback Decision Matrix

| Scenario | Action | Timeline |
|----------|--------|----------|
| Minor bug (non-breaking) | Hotfix deploy | Within 1 hour |
| Major bug (broken feature) | Rollback to previous version | Within 15 minutes |
| Security vulnerability | Immediate rollback + hotfix | Within 5 minutes |
| Database corruption | Restore from backup | 30-60 minutes |
| Performance degradation | Scale up first, rollback if persists | 10 minutes |

### 8.7 Rollback Checklist

- [ ] Notify team via Slack (#deploy channel)
- [ ] Identify the last known good version (commit SHA / Docker tag / deployment timestamp)
- [ ] Execute rollback (Git revert / Docker re-tag / Vercel promote)
- [ ] Verify health check endpoint returns 200
- [ ] Run smoke tests
- [ ] Monitor error rate for 15 minutes post-rollback
- [ ] Post-mortem: document root cause and preventive measures

---

## Pipeline Configuration Cheatsheet

### GitHub Actions Secrets Required

| Secret Name | Purpose | Source |
|-------------|---------|--------|
| `DOCKER_REGISTRY` | Container registry URL | Docker Hub / GHCR / ECR |
| `DOCKER_USERNAME` | Registry auth | Docker Hub account |
| `DOCKER_PASSWORD` | Registry auth token | Docker Hub / GHCR PAT |
| `VERCEL_TOKEN` | Vercel API auth | Vercel Account → Tokens |
| `VERCEL_ORG_ID` | Vercel team ID | Vercel Project Settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Project Settings |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API auth | Cloudflare Dashboard → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | Cloudflare Dashboard |
| `SENTRY_AUTH_TOKEN` | Sentry source maps | Sentry → Settings → Auth Tokens |

### Quick Reference: Deployment Commands

```bash
# Nuxt 4
nuxt build                    # SSR build → .output/
nuxi generate                 # Static export → dist/

# Next.js 15
next build                    # Standard build → .next/

# Docker
docker build -t app:latest .  # Build image
docker compose up -d          # Start services

# Vercel CLI
vercel deploy --prod          # Deploy to production
vercel rollback               # Rollback to previous

# Cloudflare Wrangler
wrangler pages deploy .output/public --project-name=my-app
wrangler deploy src/worker.ts --name my-worker
```
