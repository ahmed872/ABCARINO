# Deploying ABCARINO

The recommended setup for a small team is **one VPS with Docker Compose**: the app, PostgreSQL and a persistent volume for uploaded media, behind a TLS reverse proxy. Any provider works (Hetzner, DigitalOcean, AWS Lightsail…); 2 vCPU / 2–4 GB RAM is plenty.

## Deploying on Vercel

The site needs a **PostgreSQL database** and, for uploaded images, **Vercel Blob** (Vercel's disk is not persistent). Without a database every page fails with a server error.

1. **Database** — Vercel → your project → **Storage** → *Create / Connect Database* → **Neon (Postgres)**. This adds `DATABASE_URL` automatically. (Supabase or any Postgres works too: paste its connection string as `DATABASE_URL`.)
2. **Images** — Storage → *Create* → **Blob**, with **public** access (the app stores images as public blobs; a private store rejects uploads). Connecting it adds `BLOB_STORE_ID` (the SDK then signs in with the deployment's OIDC token; older connections add `BLOB_READ_WRITE_TOKEN` instead — either works). Without it, uploads are refused with "Media storage is not configured".
3. **Environment variables** (Settings → Environment Variables, for *Production*):
   - `APP_SECRET` — a long random string (`openssl rand -base64 48`)
   - `ADMIN_EMAIL` — the first admin's email
   - `ADMIN_PASSWORD` — optional; if empty, a password is generated and printed once in the **build log**
   - `APP_URL` — recommended; your custom domain (e.g. `https://abcarino.com`). Defaults to the Vercel production domain.
4. **Redeploy** (Deployments → ⋯ → Redeploy). The `vercel-build` script runs migrations, then the seed, before building. The seed only fills an **empty** database (starter catalogue + first admin); later deploys never touch content or accounts. The build fails with a clear message — and the live site stays on the previous deployment — if `DATABASE_URL` is missing or malformed, or `APP_SECRET` is missing or shorter than 32 characters.
5. Sign in at `/admin` and follow the first sign-in checklist below.

**Preview deployments run migrations too.** Every build — including each pushed branch's Preview — runs `vercel-build` against the `DATABASE_URL` of its environment. Never give *Preview* the production database: use a separate database (e.g. a Neon branch) for Preview, or no Preview deployments at all. Otherwise an unmerged branch's migration is applied to production data.

After the first successful sign-in, change the password and delete `ADMIN_PASSWORD` from the Vercel settings.

Notes:
- Uploads larger than ~3.5 MB are downscaled in the browser before upload (Vercel limits request bodies to 4.5 MB).
- Sign-in rate limits and the failure counter live in each function instance's memory, so on Vercel they are best-effort (an account lock, once triggered, is stored in the database and applies everywhere). Consider a Vercel Firewall rate-limit rule on `/admin/login`.
- Use the database's **pooled** connection string (Neon `-pooler`, Supabase port 6543) and put the functions in the region closest to the database.
- Dates and times are shown, and article schedules entered, in the server's time zone — UTC on Vercel (Africa/Cairo in the Docker image).

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
POSTGRES_PASSWORD=$(openssl rand -hex 24)      # paste the generated value (hex: it goes into a URL)
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

On every later start the container applies pending migrations automatically before serving, after checking the configuration (it refuses to start without a valid `APP_SECRET` and `APP_URL`). Running the seed again is harmless: it only fills an empty database.

### 4. TLS reverse proxy

The app listens on `127.0.0.1:3000`. Put Caddy (automatic HTTPS) or nginx in front. **The proxy must overwrite `X-Real-IP`** — rate limiting relies on it (`TRUST_PROXY=true` is set in compose).

**Caddy** (`/etc/caddy/Caddyfile`):

```caddy
www.abcarino.com {
    redir https://abcarino.com{uri} permanent
}

abcarino.com {
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

With `APP_URL` on `https://`, the app automatically enables HSTS, `upgrade-insecure-requests` and the `__Host-` secure session cookie. The HSTS header includes `includeSubDomains`: every subdomain of the site's domain must also be served over HTTPS.

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

There is **no automatic backup** in the application — schedule these yourself and copy the files off the server. Volume names are prefixed with the Compose project name (the folder name, `abcarino` here). `docker compose down -v` **deletes** both volumes; never use `-v` on the server.

```bash
# Database (daily cron recommended)
docker compose exec -T db pg_dump -U abcarino abcarino | gzip > backup-$(date +%F).sql.gz
# Uploaded media
docker run --rm -v abcarino_media:/data -v "$PWD":/backup alpine tar czf /backup/media-$(date +%F).tgz -C /data .
```

Restore: `gunzip -c backup-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U abcarino abcarino` (into an empty database) and `docker run --rm -v abcarino_media:/data -v "$PWD":/backup alpine tar xzf /backup/media-YYYY-MM-DD.tgz -C /data`.

On Vercel, database backups are the Postgres provider's (e.g. Neon point-in-time restore) and Blob files are not backed up by the app.

**After restoring a database backup, restart the web container** (`docker compose restart web`): published content is cached in memory for speed and only admin edits invalidate it; a restart always starts with an empty cache.

## Updating

```bash
git pull
docker compose exec -T db pg_dump -U abcarino abcarino | gzip > pre-update-$(date +%F).sql.gz
docker compose build web
docker compose run --rm web node node_modules/tsx/dist/cli.mjs scripts/migrate.ts   # site still up on the old version
docker compose up -d web
```

Migrations run in a single transaction: if one fails, nothing is applied and the running version keeps serving (the last command is skipped only if you stop on the error).

## Scaling notes

- Self-hosting supports **one app instance**. Besides uploaded media (volume `media`), each process keeps in memory the **public-content cache** (`cache-handler.cjs`: an admin edit only clears the cache of the instance that handled it) and the **rate limiter / sign-in failure counter**. For more than one instance: shared media storage (S3/R2 via `src/lib/storage.ts`, or Vercel Blob), a shared cache handler, and a Redis/Postgres rate limiter (same interface in `src/lib/security/rate-limit.ts`).
- On Vercel, media goes to Vercel Blob automatically when a Blob store is connected (`BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`).
- Scheduled articles use server time; the image sets `TZ=Africa/Cairo`.

## Operations

- **Maintenance mode**: Settings → Maintenance (admins still see the site; robots.txt blocks crawlers meanwhile).
- **Private preview**: Settings → SEO → untick *Allow search engines to index*.
- **Locked out?** `docker compose run --rm -e ADMIN_EMAIL=you@abcarino.com web node node_modules/tsx/dist/cli.mjs scripts/create-admin.ts --reset`
- **Audit trail**: Admin → Activity log (sign-ins, every content/settings/user change).
