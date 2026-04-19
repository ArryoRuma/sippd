# Vercel Deployment

This project is a Nuxt 4 app deployed on Vercel with Supabase for auth and data.

## Where This Lives

These instructions live in `docs/` because they are repository documentation, not GitHub automation.

- Use `docs/` or `README.md` for deployment instructions humans need to follow.
- Use `.github/workflows/` only if you want GitHub Actions to run CI or trigger deployments.
- For standard Vercel Git integration, no GitHub Actions workflow is required.

## Prerequisites

- A Vercel account connected to the Git repository.
- A Supabase project with the database schema from [supabase/migrations/001_create_tables.sql](../supabase/migrations/001_create_tables.sql) and [supabase/migrations/002_fix_auth_rls_policies.sql](../supabase/migrations/002_fix_auth_rls_policies.sql) applied.
- The public Supabase project URL and publishable key.

## Required Environment Variables

Set these in Vercel for `Production`, `Preview`, and `Development`:

```bash
NUXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=your_supabase_publishable_key
```

Notes:

- `@nuxtjs/supabase` reads `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY` by default.
- The older `SUPABASE_URL` and `SUPABASE_KEY` names still work as fallbacks, but this project should use the `NUXT_` names.
- Do not expose a Supabase secret or service-role key in client-side variables.

## Supabase Auth Configuration

This app uses the auth callback route `/confirm`, configured in [nuxt.config.ts](../nuxt.config.ts).

In the Supabase dashboard under `Authentication -> URL Configuration`, set:

- `Site URL` to your production Vercel domain, for example `https://your-app.vercel.app` or your custom domain.
- `Redirect URLs` to include at least:

```text
https://your-app.vercel.app/confirm
```

If you rely on Vercel Preview Deployments for auth flows, also add the preview callback URL for the deployment you want to test.

## Deploy From Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, create a new project and import this repository.
3. Let Vercel auto-detect the framework. Nuxt and Nitro are supported without custom output configuration.
4. Confirm the project settings:

```text
Framework Preset: Nuxt.js
Install Command: pnpm install
Build Command: pnpm build
Output Setting: auto-detected by Vercel/Nitro
Node.js Version: use the Vercel default or a version compatible with Nuxt 4
```

5. Add the required environment variables.
6. Trigger the first deployment.

## Local Verification Before Deploying

Run these commands before pushing:

```bash
pnpm install
pnpm typecheck
pnpm build
```

If you want to emulate the production server locally after a successful build:

```bash
pnpm preview
```

## Behavior In Production

- The app uses secure Supabase SSR cookies in production and non-secure cookies on localhost, as configured in [nuxt.config.ts](../nuxt.config.ts).
- The root route is prerendered through Nitro, while authenticated pages continue to run through Nuxt/Nitro on Vercel.
- Pushes to non-production branches create Vercel Preview Deployments. Pushes to the production branch create Production Deployments.

## Troubleshooting

### Login redirects back to `/login`

- Check that the Vercel environment variables are set in the environment you deployed.
- Verify the Supabase `Site URL` and `Redirect URLs` include the current deployed domain and `/confirm` callback.
- Confirm the cookies are not being blocked by an unexpected domain mismatch.

### Build fails on Vercel

- Run `pnpm build` locally first.
- Make sure `pnpm-lock.yaml` is committed so Vercel installs the same dependency graph.
- Check that Vercel is using `pnpm` rather than `npm`.

### Auth works locally but not on Vercel

- Re-check the Supabase auth URL configuration for the deployed domain.
- Verify that you are using the publishable key, not a revoked or legacy value.
- Make sure you set the variables in `Preview` as well as `Production` if you are testing a preview deployment.
