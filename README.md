# WOW — Unified Web, Dashboard & Android

This repository is the single source of truth for the WOW platform.

## Architecture

- **Web:** Next.js-ready Jamstack layer, deployable to Vercel.
- **API/CMS:** Supabase-first architecture; Strapi can be added later if a self-hosted CMS is required.
- **Mobile:** Android shell designed around the same web/application layer.
- **Database:** Supabase PostgreSQL.
- **CI/CD:** GitHub Actions.
- **Secrets:** never commit production keys, service-role keys, signing keys, or `.env` files.

## Repository layout

```
web/          # Public web application
dashboard/    # Unified administration dashboard
mobile/       # Android application
shared/       # Shared contracts/types
supabase/     # Database migrations and policies
.github/      # CI/CD workflows
```

## Initial milestone

The first commit establishes the architecture and CI foundation. Product-specific screens, database tables, authentication, and Supabase credentials are intentionally configured in subsequent milestones so no secret or invented business logic is committed.
