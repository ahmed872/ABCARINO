# Deploying ABCARINO

The recommended setup for a small team is **one VPS with Docker Compose**: the app, PostgreSQL and a persistent volume for uploaded media, behind a TLS reverse proxy. Any provider works (Hetzner, DigitalOcean, AWS Lightsail…); 2 vCPU / 2–4 GB RAM is plenty.

## Deploying on Vercel

The site needs a **PostgreSQL database** and, for uploaded images, **Vercel Blob** (Vercel's disk is not persistent). Without a database every page fails with a server error.

1. **Database** — Vercel → your project → **Storage** → *Create / Connect Database* → **Neon (Postgres)**. This adds `DATABASE_URL` automatically. (Supabase or any Postgres works too: paste its connection string as `DATABASE_URL`.)
2. **Images** — Storage → *Create* → **Blob**. This adds `BLOB_READ_WRITE_TOKEN`.
3. **Environment variables** (Settings → Environment Variables, for *Production* and *Preview*):
   - `APP_SECRET` — a long random string (`openssl rand -base64 48`)
   - `ADMIN_EMAIL` — the first admin's email
   - `ADMIN_PASSWORD` — optional; if empty, a password is generated and printed once in the **build log**
   - `APP_URL` — optional; your custom domain (e.g. `https://abcarino.com`). Defaults to the Vercel production domain.
4. **Redeploy** (Deployments → ⋯ → Redeploy). The `vercel-build` script runs migrations and the idempotent seed before building, so the database is always up to date. If `DATABASE_URL` is missing the build fails with a clear message instead of publishing a broken site.
5. Sign in at `/admin` and follow the first sign-in checklist below.

Notes: uploads larger than ~3.5 MB are downscaled in the browser before upload (Vercel limits request bodies to 4.5 MB); the rate limiter is per server instance on serverless.

## Deploying on a VPS with Docker (recommended for full control)

### 1. Prepare the server

```bash
# Ubuntu 24.04 example
curl -fsSL https://get.docker.com | sh
git clone <your-repo-url> abcarino && cd abcarino
```

### 2. Configure environment

Create `.env` next to `docker-compose.yml`:

```bash
APP_URL=https://abcarino.com
APP_SECRET=$(openssl rand -base64 48)          # paste the generated value
POSTGRES_PASSWORD=$(openssl rand -base64 24)   # paste the generated value
ADMIN_EMAIL=founder@abcarino.com
ADMIN_NAME="Founder Name"
ADMIN_PASSWORD=                                # leave empty to generate one
```

Never commit `.env`. Secrets are only read on the server; nothing secret is exposed to the browser.

### 3. Build, migrate, seed, create the admin

```bash
docker compose build
docker compose up -d db
docker compose run --rm web node node_modules/tsx/dist/cli.mjs scripts/migrate.ts
docker compose run --rm web node node_modules/tsx/dist/cli.mjs scripts/seed.ts   # prints the admin password if generated
docker compose up -d web
```

On every later start the container applies pending migrations automatically before serving.

### 4. TLS reverse proxy

The app listens on `127.0.0.1:3000`. Put Caddy (automatic HTTPS) or nginx in front. **The proxy must overwrite `X-Real-IP`** — rate limiting relies on it (`TRUST_PROXY=true` is set in compose).

**Caddy** (`/etc/caddy/Caddyfile`):

```caddy
abcarino.com, www.abcarino.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

**nginx**:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 16m;   # media uploads up to 15 MB
}
```

With `APP_URL` on `https://`, the app automatically enables HSTS, `upgrade-insecure-requests` and the `__Host-` secure session cookie.

## First sign-in checklist

1. Open `https://abcarino.com/admin` and sign in.
2. **My account** → change the generated password.
3. **Settings → Contact & WhatsApp** → add the WhatsApp number (international format). All CTAs switch to WhatsApp automatically.
4. **Settings → Calls to action** → describe how consultations work (free / paid).
5. Review solutions and packages; set statuses (Available / Coming soon / Hidden).
6. Upload real photography when available (Media library), with English + Arabic alt text.
7. **Settings → SEO** → add the Google Search Console verification code, then submit `https://abcarino.com/sitemap.xml`.

The dashboard's *Launch checklist* tracks these.

## Backups

```bash
# Database (daily cron recommended)
docker compose exec -T db pg_dump -U abcarino abcarino | gzip > backup-$(date +%F).sql.gz
# Uploaded media
docker run --rm -v abcarino_media:/data -v "$PWD":/backup alpine tar czf /backup/media-$(date +%F).tgz -C /data .
```

**After restoring a database backup, restart the web container** (`docker compose restart web` after deleting `.next/cache/fetch-cache` inside it, or simply `docker compose up -d --force-recreate web`): published content is cached on disk for speed and is only invalidated by admin edits.

## Updating

```bash
git pull
docker compose build web && docker compose up -d web   # migrations run automatically
```

## Scaling notes

- The app is stateless except for **uploaded media** (volume `media`) and the **in-memory rate limiter**. For more than one instance: move media to S3/R2 (implement `src/lib/storage.ts` against the bucket) and the rate limiter to Redis/Postgres (same interface in `src/lib/security/rate-limit.ts`).
- On Vercel, media goes to Vercel Blob automatically when `BLOB_READ_WRITE_TOKEN` is set.
- Scheduled articles use server time; the image sets `TZ=Africa/Cairo`.

## Operations

- **Maintenance mode**: Settings → Maintenance (admins still see the site; robots.txt blocks crawlers meanwhile).
- **Private preview**: Settings → SEO → untick *Allow search engines to index*.
- **Locked out?** `docker compose run --rm -e ADMIN_EMAIL=you@abcarino.com web node node_modules/tsx/dist/cli.mjs scripts/create-admin.ts --reset`
- **Audit trail**: Admin → Activity log (sign-ins, every content/settings/user change).
