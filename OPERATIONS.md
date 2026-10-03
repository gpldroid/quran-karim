# Quran Karim — Post-Deployment Operations

## Current architecture

- Next.js 15 + React 19 static dashboard on GitHub Pages.
- Supabase Postgres, Auth, Realtime and Edge Functions.
- Islamway is accessed through the Supabase Edge Function, not directly from the browser.
- The browser uses IndexedDB with a 15-minute fresh TTL and up to 24 hours of stale fallback.
- The Edge Function keeps a 15-minute server cache and applies an in-memory request limit of 60 requests/minute per forwarded client IP.
- GitHub Actions performs Pages deployment, Android release builds, health checks, JSON backups and weekly cleanup.

## Required GitHub Actions secrets

Set these under Settings → Secrets and variables → Actions:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_ISLAMWAY_API_URL
- NEXT_PUBLIC_SITE_URL
- SUPABASE_SECRET_KEY
- SUPABASE_RELEASE_SYNC_URL
- SUPABASE_RELEASE_SYNC_SECRET
- DISCORD_WEBHOOK_URL (optional)
- TELEGRAM_BOT_TOKEN (optional)
- TELEGRAM_CHAT_ID (optional)

## Required Supabase Edge Function secrets

Set these with the Supabase CLI or Dashboard:

- RELEASE_SYNC_SECRET
- SUPABASE_GITHUB_WEBHOOK_SECRET
- GITHUB_ACTIONS_TOKEN
- GITHUB_REPOSITORY=gpldroid/quran-karim

The GitHub token must be a fine-grained token with Actions: write for this repository because the GitHub dispatch endpoint requires Actions write permission.

Never put any of these secrets in .env.example, source code, SQL committed to the repository, or client-side VITE_ variables.

## On-demand rebuild flow

1. An administrator updates quran_settings or site_config.
2. A Supabase Database Webhook sends the row-change payload to github-dispatch.
3. github-dispatch validates x-webhook-secret.
4. The Edge Function calls GitHub repository_dispatch with event_type=supabase_content_changed.
5. deploy-dashboard.yml receives repository_dispatch and rebuilds/deploys the dashboard.
6. The Android job is skipped for repository_dispatch.

The workflow file must exist on the default branch for repository_dispatch to trigger it.

## Free-tier environment strategy

Supabase Free does not include Branching. Use two separate Free projects while staying within the current limit of two active projects:

- Development project: local development, test data and migrations.
- Production project: live application.

Keep environment-specific URLs/keys in GitHub Environments or local .env files. Do not copy production data into development unless it is safe to do so.

## Backups

Supabase Free does not provide downloadable managed database backups. The backup workflow therefore exports only the operational tables requested for this project as JSON and stores the result as a GitHub Actions artifact for 7 days.

For a disaster recovery plan, keep an occasional manually downloaded copy outside the repository as well.

## Storage pressure

The Free database quota is 500 MB. This is database data, not the separate 1 GB Storage quota.

Weekly cleanup:
- Deletes expired islamway_cache rows.
- Keeps only the five newest app_releases database rows.

GitHub Release assets are not deleted by this workflow. They are outside the Supabase database quota. If old APK releases are no longer needed, delete their GitHub releases separately.

## Incident checklist

### Islamway endpoint failure

1. Run the scheduled health check manually.
2. Test https://quranapi.islamway.net/readers and /surahs.
3. Inspect supabase/functions/islamway/index.ts normalization.
4. Update the API base/path mapping if Islamway changed its contract.
5. Deploy the function.
6. Clear expired rows from islamway_cache or run Maintenance manually.
7. Verify both readers and surahs in the dashboard.

### Supabase reaches 500 MB

1. Check database size in the Supabase dashboard.
2. Run Maintenance manually.
3. Inspect islamway_cache row count and payload size.
4. Remove obsolete app_releases rows beyond the newest five.
5. Review large JSON columns and unused historical data.
6. If the project is already read-only, cleanup may require first reducing usage through the dashboard/SQL workflow that remains available.

### GitHub Pages build failure

1. Open the failed workflow run.
2. Check npm install and npm run build output.
3. Confirm NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_SITE_URL.
4. Run npm run build locally.
5. Check TypeScript errors before rerunning the deployment.
6. If repository_dispatch is involved, verify the workflow exists on main and that the GitHub token has Actions: write.
7. Rerun only after fixing the root cause.

## Backup restore

The JSON artifact is an operational export, not a full physical database backup. Restore with the Supabase dashboard or SQL/import tooling after validating the JSON. Do not blindly overwrite production.
